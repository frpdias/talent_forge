import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GupyAdapter } from './adapters/gupy.adapter';
import { VagasAdapter } from './adapters/vagas.adapter';
import { LinkedInAdapter } from './adapters/linkedin.adapter';
import { ChannelAdapter, ChannelCode, JobCanonical, PublishResult } from './types';

@Injectable()
export class PublisherService {
  private readonly logger = new Logger(PublisherService.name);
  private readonly supabase: SupabaseClient;
  private readonly adapters: Map<ChannelCode, ChannelAdapter>;

  constructor(
    private readonly configService: ConfigService,
    private readonly gupyAdapter: GupyAdapter,
    private readonly vagasAdapter: VagasAdapter,
    private readonly linkedinAdapter: LinkedInAdapter,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    this.adapters = new Map([
      ['gupy', this.gupyAdapter],
      ['vagas', this.vagasAdapter],
      ['linkedin', this.linkedinAdapter],
    ]);
  }

  /** Retorna publicações de uma vaga */
  async getJobPublications(jobId: string) {
    const { data, error } = await this.supabase
      .from('job_publications')
      .select(`
        *,
        job_publication_channels (
          id, channel_code, display_name, is_active
        )
      `)
      .eq('job_id', jobId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  /** Lista canais configurados pela org */
  async getOrgChannels(orgId: string) {
    const { data, error } = await this.supabase
      .from('job_publication_channels')
      .select('id, channel_code, display_name, is_active, last_sync_at, created_at')
      .eq('org_id', orgId)
      .order('channel_code');

    if (error) throw new Error(error.message);
    return data || [];
  }

  /** Configura / atualiza credenciais de um canal */
  async upsertChannel(orgId: string, dto: {
    channel_code: ChannelCode;
    display_name: string;
    credentials: Record<string, string>;
    config?: Record<string, unknown>;
    is_active?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('job_publication_channels')
      .upsert({
        org_id: orgId,
        channel_code: dto.channel_code,
        display_name: dto.display_name,
        credentials: dto.credentials,
        config: dto.config || {},
        is_active: dto.is_active ?? false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id,channel_code' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /** Publica a vaga nos canais selecionados */
  async publishJob(jobId: string, channelIds: string[]): Promise<{
    results: Array<{ channel_code: string; success: boolean; error?: string }>;
  }> {
    const job = await this.getJobCanonical(jobId);
    const results: Array<{ channel_code: string; success: boolean; error?: string }> = [];

    for (const channelId of channelIds) {
      const channel = await this.getChannel(channelId);
      if (!channel) {
        results.push({ channel_code: channelId, success: false, error: 'Canal não encontrado' });
        continue;
      }

      const adapter = this.adapters.get(channel.channel_code as ChannelCode);
      if (!adapter) {
        results.push({ channel_code: channel.channel_code, success: false, error: 'Adapter não disponível para este canal' });
        continue;
      }

      // Marcar como "publishing"
      const { data: pub } = await this.supabase
        .from('job_publications')
        .upsert({
          job_id: jobId,
          channel_id: channelId,
          status: 'publishing',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'job_id,channel_id' })
        .select()
        .single();

      const credentials = channel.credentials || {};
      const startMs = Date.now();
      let result: PublishResult;

      try {
        result = await adapter.publish(job, credentials);
      } catch (err: any) {
        result = { success: false, error: err.message };
      }

      const duration = Date.now() - startMs;

      // Atualizar job_publications
      await this.supabase
        .from('job_publications')
        .update({
          status: result.success ? 'published' : 'failed',
          external_id: result.external_id,
          external_url: result.external_url,
          error_message: result.error,
          payload_sent: result.payload_sent,
          response_received: result.response_received,
          published_at: result.success ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pub?.id);

      // Audit log
      await this.supabase
        .from('job_publication_logs')
        .insert({
          publication_id: pub?.id,
          action: 'publish',
          status: result.success ? 'success' : 'error',
          request_payload: result.payload_sent,
          response_payload: result.response_received,
          error_detail: result.error,
          duration_ms: duration,
        });

      results.push({ channel_code: channel.channel_code, success: result.success, error: result.error });
      this.logger.log(`Publish [${channel.channel_code}] job=${jobId} → ${result.success ? 'OK' : 'FAIL'}`);
    }

    return { results };
  }

  /** Despublica a vaga de um canal */
  async unpublishJob(jobId: string, channelId: string): Promise<PublishResult> {
    const { data: pub } = await this.supabase
      .from('job_publications')
      .select('*, job_publication_channels(*)')
      .eq('job_id', jobId)
      .eq('channel_id', channelId)
      .single();

    if (!pub) throw new NotFoundException('Publicação não encontrada');
    if (!pub.external_id) return { success: false, error: 'Vaga sem external_id — despublicação manual necessária' };

    const channel = pub.job_publication_channels;
    const adapter = this.adapters.get(channel.channel_code as ChannelCode);
    if (!adapter) return { success: false, error: 'Adapter não disponível' };

    const result = await adapter.unpublish(pub.external_id, channel.credentials || {});

    await this.supabase
      .from('job_publications')
      .update({
        status: result.success ? 'unpublished' : 'failed',
        error_message: result.error,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pub.id);

    await this.supabase
      .from('job_publication_logs')
      .insert({
        publication_id: pub.id,
        action: 'unpublish',
        status: result.success ? 'success' : 'error',
        error_detail: result.error,
      });

    return result;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async getJobCanonical(jobId: string): Promise<JobCanonical> {
    const { data, error } = await this.supabase
      .from('jobs')
      .select(`
        id, title, description, description_html, location,
        employment_type, requirements, benefits, application_deadline,
        external_apply_url, org_id,
        organizations (name, slug)
      `)
      .eq('id', jobId)
      .single();

    if (error || !data) throw new NotFoundException(`Vaga ${jobId} não encontrada`);

    const org = (data as any).organizations;
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      description_html: data.description_html,
      location: data.location || '',
      employment_type: data.employment_type || 'clt',
      requirements: data.requirements,
      benefits: data.benefits,
      application_deadline: data.application_deadline,
      external_apply_url: data.external_apply_url,
      org_id: data.org_id,
      org_name: org?.name || '',
      org_slug: org?.slug || '',
    };
  }

  private async getChannel(channelId: string) {
    const { data } = await this.supabase
      .from('job_publication_channels')
      .select('*')
      .eq('id', channelId)
      .single();
    return data;
  }
}
