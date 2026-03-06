import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mapeamento de display_name padrão por canal
const CHANNEL_DISPLAY_NAMES: Record<string, string> = {
  gupy: 'Gupy',
  vagas: 'Vagas.com',
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  catho: 'Catho',
  infojobs: 'InfoJobs',
  custom: 'Canal Personalizado',
};

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

/**
 * Constrói o payload para o canal a partir dos campos da vaga canônica.
 * Fase 1: simulação (sem chamada real à API externa).
 * Fase 2+: cada case chama o adapter correto.
 */
function buildPayload(channelCode: string, job: any): Record<string, any> {
  const base = {
    title: job.title,
    description: job.description || '',
    location: job.location || '',
    type: job.type || 'full_time',
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    status: 'open',
  };

  switch (channelCode) {
    case 'gupy':
      return {
        name: base.title,
        description: base.description,
        address: { city: base.location },
        type: base.type === 'full_time' ? 'EFFECTIVE' : 'INTERNSHIP',
        salary: base.salary_min
          ? { min: base.salary_min, max: base.salary_max }
          : undefined,
      };
    case 'vagas':
      return {
        titulo: base.title,
        descricao: base.description,
        cidade: base.location,
        salario_min: base.salary_min,
        salario_max: base.salary_max,
      };
    case 'linkedin':
      return {
        title: base.title,
        description: base.description,
        location: base.location,
        employmentStatus: 'FULL_TIME',
        salaryMin: base.salary_min,
        salaryMax: base.salary_max,
      };
    default:
      return base;
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

    // Carregar a vaga e validar acesso
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
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

    // Buscar canais solicitados (validar que pertencem a esta org)
    const { data: channels, error: channelsError } = await supabase
      .from('job_publication_channels')
      .select('id, channel_code, display_name, is_active, config')
      .in('id', channelIds)
      .eq('org_id', job.org_id);

    if (channelsError || !channels || channels.length === 0) {
      return NextResponse.json({ error: 'Canais não encontrados ou sem acesso' }, { status: 400 });
    }

    const results: Array<{
      channelId: string;
      channelCode: string;
      status: 'published' | 'failed' | 'pending';
      message: string;
      publicationId?: string;
    }> = [];

    for (const channel of channels) {
      const payload = buildPayload(channel.channel_code, job);
      const startMs = Date.now();

      // Upsert na tabela de publicações
      const { data: pub, error: pubError } = await supabase
        .from('job_publications')
        .upsert({
          job_id: jobId,
          channel_id: channel.id,
          status: 'publishing',
          payload_sent: payload,
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
          message: pubError?.message || 'Erro ao criar registro',
        });
        continue;
      }

      const durationMs = Date.now() - startMs;

      // Fase 1: Simular publicação (sem chamada real)
      // Em Fase 2+, aqui vai a chamada real ao adapter
      const externalId = `tf_${channel.channel_code}_${jobId.slice(0, 8)}`;
      const externalUrl = `https://${channel.channel_code}.com.br/vaga/${externalId}`;
      const simSuccess = channel.is_active; // Só "publica" se canal está ativo

      if (simSuccess) {
        await supabase
          .from('job_publications')
          .update({
            status: 'published',
            external_id: externalId,
            external_url: externalUrl,
            published_at: new Date().toISOString(),
            response_received: { id: externalId, url: externalUrl },
            updated_at: new Date().toISOString(),
          })
          .eq('id', pub.id);

        await supabase.from('job_publication_logs').insert({
          publication_id: pub.id,
          action: 'publish',
          status: 'success',
          request_payload: payload,
          response_payload: { id: externalId, url: externalUrl },
          duration_ms: durationMs,
        });

        results.push({
          channelId: channel.id,
          channelCode: channel.channel_code,
          status: 'published',
          message: `Publicada em ${channel.display_name}`,
          publicationId: pub.id,
        });
      } else {
        await supabase
          .from('job_publications')
          .update({
            status: 'failed',
            error_message: 'Canal inativo — configure as credenciais para publicar',
            updated_at: new Date().toISOString(),
          })
          .eq('id', pub.id);

        await supabase.from('job_publication_logs').insert({
          publication_id: pub.id,
          action: 'publish',
          status: 'error',
          request_payload: payload,
          error_detail: 'Canal inativo',
          duration_ms: durationMs,
        });

        results.push({
          channelId: channel.id,
          channelCode: channel.channel_code,
          status: 'failed',
          message: `${channel.display_name} está inativo — configure as credenciais`,
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

    const { data: pubs } = await supabase
      .from('job_publications')
      .select('id')
      .eq('job_id', jobId)
      .in('channel_id', channelIds);

    const pubIds = (pubs || []).map((p: any) => p.id);

    if (pubIds.length > 0) {
      await supabase
        .from('job_publications')
        .update({
          status: 'unpublished',
          updated_at: new Date().toISOString(),
        })
        .in('id', pubIds);

      for (const pubId of pubIds) {
        await supabase.from('job_publication_logs').insert({
          publication_id: pubId,
          action: 'unpublish',
          status: 'success',
        });
      }
    }

    return NextResponse.json({ unpublished: pubIds.length });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
