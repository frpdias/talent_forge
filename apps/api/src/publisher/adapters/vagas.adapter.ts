import { Injectable, Logger } from '@nestjs/common';
import { ChannelAdapter, ChannelCode, ChannelCredentials, JobCanonical, PublishResult } from '../types';

/**
 * Vagas.com Adapter — Vagas for Business REST API
 * Docs: https://vagas.com.br/api-para-empresas
 * Requer: API Key da conta Enterprise
 */
@Injectable()
export class VagasAdapter implements ChannelAdapter {
  readonly channelCode: ChannelCode = 'vagas';
  private readonly logger = new Logger(VagasAdapter.name);
  private readonly baseUrl = 'https://www.vagas.com.br/api/v1';

  async publish(job: JobCanonical, credentials: ChannelCredentials): Promise<PublishResult> {
    if (!credentials.api_key) {
      return { success: false, error: 'API Key do Vagas.com não configurada' };
    }

    const payload = this.buildPayload(job);

    try {
      const response = await fetch(`${this.baseUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `ApiKey ${credentials.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        this.logger.warn(`Vagas.com publish failed: ${response.status} — ${JSON.stringify(body)}`);
        return {
          success: false,
          error: `Vagas.com API error ${response.status}: ${(body as any).message || 'Unknown error'}`,
          payload_sent: payload,
          response_received: body as Record<string, unknown>,
        };
      }

      const result = body as { id?: string; url?: string; jobUrl?: string };
      return {
        success: true,
        external_id: result.id,
        external_url: result.url || result.jobUrl,
        payload_sent: payload,
        response_received: body as Record<string, unknown>,
      };
    } catch (err: any) {
      this.logger.error(`Vagas.com publish error: ${err.message}`);
      return { success: false, error: err.message, payload_sent: payload };
    }
  }

  async unpublish(externalId: string, credentials: ChannelCredentials): Promise<PublishResult> {
    if (!credentials.api_key) return { success: false, error: 'API Key ausente' };

    try {
      const response = await fetch(`${this.baseUrl}/jobs/${externalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `ApiKey ${credentials.api_key}` },
      });

      if (!response.ok) {
        return { success: false, error: `Vagas.com unpublish failed: ${response.status}` };
      }

      return { success: true, external_id: externalId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async update(externalId: string, job: JobCanonical, credentials: ChannelCredentials): Promise<PublishResult> {
    if (!credentials.api_key) return { success: false, error: 'API Key ausente' };

    const payload = this.buildPayload(job);

    try {
      const response = await fetch(`${this.baseUrl}/jobs/${externalId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `ApiKey ${credentials.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { success: false, error: `Vagas.com update failed: ${response.status}`, response_received: body };
      }

      return { success: true, external_id: externalId, payload_sent: payload, response_received: body };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private buildPayload(job: JobCanonical): Record<string, unknown> {
    return {
      titulo: job.title,
      descricao: job.description_html || job.description,
      requisitos: job.requirements || '',
      beneficios: job.benefits || '',
      cidade: job.location,
      tipoContrato: this.mapEmploymentType(job.employment_type),
      dataExpiracao: job.application_deadline,
      urlCandidatura: job.external_apply_url,
      empresa: {
        nome: job.org_name,
      },
    };
  }

  private mapEmploymentType(type: string): string {
    const map: Record<string, string> = {
      clt: 'CLT',
      pj: 'PJ',
      internship: 'Estágio',
      freelancer: 'Freelancer',
      temporary: 'Temporário',
    };
    return map[type?.toLowerCase()] || 'CLT';
  }
}
