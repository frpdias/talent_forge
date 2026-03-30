import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { JobCanonical, ChannelCredentials } from '@/lib/publisher/types';
import { publishToGupy, unpublishFromGupy } from '@/lib/publisher/gupy';
import { publishToVagas, unpublishFromVagas } from '@/lib/publisher/vagas';
import { publishToFacebook, publishToInstagram, unpublishFromFacebook, unpublishFromInstagram } from '@/lib/publisher/meta';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  return user;
}

/** Converte o registro da vaga no banco para o modelo canônico */
function toJobCanonical(job: any, orgName: string, orgSlug: string): JobCanonical {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talentforge.com.br';
  return {
    id: job.id,
    title: job.title,
    description: job.description || '',
    description_html: job.description_html,
    location: job.location || '',
    employment_type: job.employment_type || 'clt',
    requirements: job.requirements,
    benefits: job.benefits,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    application_deadline: job.application_deadline,
    org_id: job.org_id,
    org_name: orgName,
    org_slug: orgSlug,
    external_apply_url: `${appUrl}/jobs/${orgSlug}/${job.id}`,
  };
}

/** Despacha para o adapter correto e retorna PublishResult */
async function dispatchPublish(
  channelCode: string,
  job: JobCanonical,
  credentials: ChannelCredentials
) {
  switch (channelCode) {
    case 'gupy':
      return publishToGupy(job, credentials);
    case 'vagas':
      return publishToVagas(job, credentials);
    case 'facebook':
      return publishToFacebook(job, credentials);
    case 'instagram':
      return publishToInstagram(job, credentials);
    default:
      return { success: false, error: `Canal '${channelCode}' ainda não suportado` };
  }
}

async function dispatchUnpublish(
  channelCode: string,
  externalId: string,
  credentials: ChannelCredentials
) {
  switch (channelCode) {
    case 'gupy':
      return unpublishFromGupy(externalId, credentials);
    case 'vagas':
      return unpublishFromVagas(externalId, credentials);
    case 'facebook':
      return unpublishFromFacebook(externalId, credentials);
    case 'instagram':
      return unpublishFromInstagram(externalId, credentials);
    default:
      return { success: false, error: `Canal '${channelCode}' ainda não suportado` };
  }
}

/**
 * POST /api/v1/jobs/[id]/publish
 * Publica a vaga nos canais selecionados.
 * Body: { channels: string[] }  — lista de channel_ids
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id: jobId } = await params;
    const body = await request.json();
    const channelIds: string[] = body.channels || [];

    if (!channelIds.length) {
      return NextResponse.json({ error: 'Selecione ao menos um canal' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Carregar a vaga + dados da organização
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*, organizations(name, slug)')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', job.org_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    // Buscar canais (incluindo credentials — nunca expostos ao cliente)
    const { data: channels, error: channelsError } = await supabase
      .from('job_publication_channels')
      .select('id, channel_code, display_name, is_active, config, credentials')
      .in('id', channelIds)
      .eq('org_id', job.org_id);

    if (channelsError || !channels || channels.length === 0) {
      return NextResponse.json({ error: 'Canais não encontrados ou sem acesso' }, { status: 400 });
    }

    const orgName = (job.organizations as any)?.name || '';
    const orgSlug = (job.organizations as any)?.slug || '';
    const canonical = toJobCanonical(job, orgName, orgSlug);

    const results: Array<{
      channelId: string;
      channelCode: string;
      status: 'published' | 'failed';
      message: string;
      externalUrl?: string;
      publicationId?: string;
    }> = [];

    for (const channel of channels) {
      const startMs = Date.now();

      // Criar/atualizar registro de publicação com status "publishing"
      const { data: pub, error: pubError } = await supabase
        .from('job_publications')
        .upsert({
          job_id: jobId,
          channel_id: channel.id,
          status: 'publishing',
          retry_count: 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'job_id,channel_id' })
        .select('id')
        .single();

      if (pubError || !pub) {
        results.push({
          channelId: channel.id,
          channelCode: channel.channel_code,
          status: 'failed',
          message: pubError?.message || 'Erro ao criar registro de publicação',
        });
        continue;
      }

      if (!channel.is_active) {
        await supabase
          .from('job_publications')
          .update({ status: 'failed', error_message: 'Canal inativo — configure as credenciais', updated_at: new Date().toISOString() })
          .eq('id', pub.id);

        results.push({
          channelId: channel.id,
          channelCode: channel.channel_code,
          status: 'failed',
          message: `${channel.display_name} está inativo — configure as credenciais primeiro`,
          publicationId: pub.id,
        });
        continue;
      }

      const credentials: ChannelCredentials = channel.credentials || {};
      const publishResult = await dispatchPublish(channel.channel_code, canonical, credentials);
      const durationMs = Date.now() - startMs;

      if (publishResult.success) {
        await supabase
          .from('job_publications')
          .update({
            status: 'published',
            external_id: publishResult.external_id,
            external_url: publishResult.external_url,
            published_at: new Date().toISOString(),
            payload_sent: publishResult.payload_sent,
            response_received: publishResult.response_received,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pub.id);

        await supabase.from('job_publication_logs').insert({
          publication_id: pub.id,
          action: 'publish',
          status: 'success',
          request_payload: publishResult.payload_sent,
          response_payload: publishResult.response_received,
          duration_ms: durationMs,
        });

        results.push({
          channelId: channel.id,
          channelCode: channel.channel_code,
          status: 'published',
          message: `Publicada em ${channel.display_name}`,
          externalUrl: publishResult.external_url,
          publicationId: pub.id,
        });
      } else {
        await supabase
          .from('job_publications')
          .update({
            status: 'failed',
            error_message: publishResult.error,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pub.id);

        await supabase.from('job_publication_logs').insert({
          publication_id: pub.id,
          action: 'publish',
          status: 'error',
          request_payload: publishResult.payload_sent,
          error_detail: publishResult.error,
          duration_ms: durationMs,
        });

        results.push({
          channelId: channel.id,
          channelCode: channel.channel_code,
          status: 'failed',
          message: publishResult.error || `Falha ao publicar em ${channel.display_name}`,
          publicationId: pub.id,
        });
      }
    }

    const published = results.filter((r) => r.status === 'published').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    return NextResponse.json({
      summary: { published, failed, total: results.length },
      results,
    });
  } catch (err: any) {
    console.error('Erro no publish:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/jobs/[id]/publish
 * Despublica a vaga de canais selecionados.
 * Body: { channels: string[] }  — lista de channel_ids
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id: jobId } = await params;
    const body = await request.json();
    const channelIds: string[] = body.channels || [];

    if (!channelIds.length) {
      return NextResponse.json({ error: 'Selecione ao menos um canal' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: job } = await supabase
      .from('jobs')
      .select('id, org_id')
      .eq('id', jobId)
      .single();

    if (!job) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', job.org_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    // Buscar publicações ativas com credenciais do canal
    const { data: pubs } = await supabase
      .from('job_publications')
      .select('id, external_id, job_publication_channels(channel_code, credentials)')
      .eq('job_id', jobId)
      .in('channel_id', channelIds)
      .eq('status', 'published');

    const unpublishedIds: string[] = [];

    for (const pub of pubs || []) {
      const channel = (pub as any).job_publication_channels;
      if ((pub as any).external_id && channel?.channel_code) {
        const credentials: ChannelCredentials = channel.credentials || {};
        await dispatchUnpublish(channel.channel_code, (pub as any).external_id, credentials);
      }

      await supabase
        .from('job_publications')
        .update({ status: 'unpublished', updated_at: new Date().toISOString() })
        .eq('id', pub.id);

      await supabase.from('job_publication_logs').insert({
        publication_id: pub.id,
        action: 'unpublish',
        status: 'success',
      });

      unpublishedIds.push(pub.id);
    }

    return NextResponse.json({ unpublished: unpublishedIds.length });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
