import { Injectable, Logger } from '@nestjs/common';
import { ChannelAdapter, ChannelCode, ChannelCredentials, JobCanonical, PublishResult } from '../types';

/**
 * Gupy Adapter — REST API v2
 * Docs: https://developers.gupy.io/
 * Requer: OAuth 2.0 com client_id + client_secret da conta Enterprise
 */
@Injectable()
export class GupyAdapter implements ChannelAdapter {
  readonly channelCode: ChannelCode = 'gupy';
  private readonly logger = new Logger(GupyAdapter.name);
  private readonly baseUrl = 'https://api.gupy.io/api/v1';

  async publish(job: JobCanonical, credentials: ChannelCredentials): Promise<PublishResult> {
    const token = await this.getAccessToken(credentials);
    if (!token) {
      return { success: false, error: 'Credenciais Gupy inválidas ou ausentes' };
    }

    const payload = this.buildPayload(job, credentials);

    try {
      const response = await fetch(`${this.baseUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        this.logger.warn(`Gupy publish failed: ${response.status} — ${JSON.stringify(body)}`);
        return {
          success: false,
          error: `Gupy API error ${response.status}: ${(body as any).message || 'Unknown error'}`,
          payload_sent: payload,
          response_received: body as Record<string, unknown>,
        };
      }

      const result = body as { id?: string | number; applicationUrl?: string };
      return {
        success: true,
        external_id: String(result.id || ''),
        external_url: result.applicationUrl,
        payload_sent: payload,
        response_received: body as Record<string, unknown>,
      };
    } catch (err: any) {
      this.logger.error(`Gupy publish error: ${err.message}`);
      return { success: false, error: err.message, payload_sent: payload };
    }
  }

  async unpublish(externalId: string, credentials: ChannelCredentials): Promise<PublishResult> {
    const token = await this.getAccessToken(credentials);
    if (!token) return { success: false, error: 'Credenciais Gupy inválidas' };

    try {
      const response = await fetch(`${this.baseUrl}/jobs/${externalId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Disabled' }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return { success: false, error: `Gupy unpublish failed: ${response.status}`, response_received: body };
      }

      return { success: true, external_id: externalId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async update(externalId: string, job: JobCanonical, credentials: ChannelCredentials): Promise<PublishResult> {
    const token = await this.getAccessToken(credentials);
    if (!token) return { success: false, error: 'Credenciais Gupy inválidas' };

    const payload = this.buildPayload(job, credentials);

    try {
      const response = await fetch(`${this.baseUrl}/jobs/${externalId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { success: false, error: `Gupy update failed: ${response.status}`, response_received: body };
      }

      return { success: true, external_id: externalId, payload_sent: payload, response_received: body };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private async getAccessToken(credentials: ChannelCredentials): Promise<string | null> {
    if (credentials.access_token) return credentials.access_token;
    if (!credentials.client_id || !credentials.client_secret) return null;

    try {
      const response = await fetch('https://auth.gupy.io/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: credentials.client_id,
          client_secret: credentials.client_secret,
        }),
      });

      if (!response.ok) return null;
      const data = await response.json() as { access_token?: string };
      return data.access_token || null;
    } catch {
      return null;
    }
  }

  private buildPayload(job: JobCanonical, credentials: ChannelCredentials): Record<string, unknown> {
    return {
      name: job.title,
      description: job.description_html || job.description,
      type: this.mapEmploymentType(job.employment_type),
      city: job.location,
      country: 'BR',
      state: '',
      isActive: true,
      applicationDeadline: job.application_deadline,
      externalApplicationLink: job.external_apply_url,
      companyId: credentials.company_id,
    };
  }

  private mapEmploymentType(type: string): string {
    const map: Record<string, string> = {
      clt: 'Effective',
      pj: 'YoungApprentice',
      internship: 'Internship',
      freelancer: 'Freelancer',
      temporary: 'Temporary',
    };
    return map[type?.toLowerCase()] || 'Effective';
  }
}
