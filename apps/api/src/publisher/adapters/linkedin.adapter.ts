import { Injectable, Logger } from '@nestjs/common';
import { ChannelAdapter, ChannelCode, ChannelCredentials, JobCanonical, PublishResult } from '../types';

/**
 * LinkedIn Adapter — Job Posting API
 * Docs: https://learn.microsoft.com/en-us/linkedin/talent/job-postings/api/
 * Requer: LinkedIn Partner Program enrollment ou ATS Authorization
 * Status: Parceria pendente — adapter preparado, aguarda credenciais
 */
@Injectable()
export class LinkedInAdapter implements ChannelAdapter {
  readonly channelCode: ChannelCode = 'linkedin';
  private readonly logger = new Logger(LinkedInAdapter.name);
  private readonly baseUrl = 'https://api.linkedin.com/v2';

  async publish(job: JobCanonical, credentials: ChannelCredentials): Promise<PublishResult> {
    if (!credentials.access_token || !credentials.company_id) {
      return {
        success: false,
        error: 'LinkedIn requer access_token OAuth 2.0 e company_id. Parceria ATS necessária.',
      };
    }

    const payload = this.buildPayload(job, credentials);

    try {
      const response = await fetch(`${this.baseUrl}/simpleJobPostings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202311',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        this.logger.warn(`LinkedIn publish failed: ${response.status} — ${JSON.stringify(body)}`);
        return {
          success: false,
          error: `LinkedIn API error ${response.status}: ${(body as any).message || 'Unknown error'}`,
          payload_sent: payload,
          response_received: body as Record<string, unknown>,
        };
      }

      const result = body as { id?: string; jobPostingUrl?: string };
      return {
        success: true,
        external_id: result.id,
        external_url: result.jobPostingUrl,
        payload_sent: payload,
        response_received: body as Record<string, unknown>,
      };
    } catch (err: any) {
      this.logger.error(`LinkedIn publish error: ${err.message}`);
      return { success: false, error: err.message, payload_sent: payload };
    }
  }

  async unpublish(externalId: string, credentials: ChannelCredentials): Promise<PublishResult> {
    if (!credentials.access_token) return { success: false, error: 'Access token LinkedIn ausente' };

    try {
      const response = await fetch(`${this.baseUrl}/simpleJobPostings/${externalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'LinkedIn-Version': '202311',
        },
      });

      if (!response.ok) {
        return { success: false, error: `LinkedIn unpublish failed: ${response.status}` };
      }

      return { success: true, external_id: externalId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async update(externalId: string, job: JobCanonical, credentials: ChannelCredentials): Promise<PublishResult> {
    if (!credentials.access_token || !credentials.company_id) {
      return { success: false, error: 'Credenciais LinkedIn ausentes' };
    }

    const payload = this.buildPayload(job, credentials);

    try {
      const response = await fetch(`${this.baseUrl}/simpleJobPostings/${externalId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202311',
          'X-Restli-Method': 'PARTIAL_UPDATE',
        },
        body: JSON.stringify({ patch: { $set: payload } }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { success: false, error: `LinkedIn update failed: ${response.status}`, response_received: body };
      }

      return { success: true, external_id: externalId, payload_sent: payload, response_received: body };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private buildPayload(job: JobCanonical, credentials: ChannelCredentials): Record<string, unknown> {
    return {
      title: job.title,
      description: {
        text: job.description,
      },
      companyApplyUrl: job.external_apply_url || `https://talentforge.com.br/jobs/${job.id}`,
      listedAt: Date.now(),
      jobPostingOperationType: 'CREATE',
      integrationContext: `urn:li:organization:${credentials.company_id}`,
      workplaceTypes: ['urn:li:workplaceType:1'],
      location: {
        description: job.location,
        country: 'BR',
      },
      employmentStatus: this.mapEmploymentType(job.employment_type),
      expireAt: job.application_deadline
        ? new Date(job.application_deadline).getTime()
        : Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 dias
    };
  }

  private mapEmploymentType(type: string): string {
    const map: Record<string, string> = {
      clt: 'urn:li:employmentStatus:F',
      pj: 'urn:li:employmentStatus:C',
      internship: 'urn:li:employmentStatus:I',
      temporary: 'urn:li:employmentStatus:T',
    };
    return map[type?.toLowerCase()] || 'urn:li:employmentStatus:F';
  }
}
