import type { ChannelCredentials, JobCanonical, PublishResult } from './types';

const BASE_URL = 'https://api.gupy.io/api/v1';
const AUTH_URL = 'https://auth.gupy.io/oauth/token';

async function getAccessToken(credentials: ChannelCredentials): Promise<string | null> {
  if (credentials.access_token) return credentials.access_token;
  if (!credentials.client_id || !credentials.client_secret) return null;

  try {
    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { access_token?: string };
    return data.access_token || null;
  } catch {
    return null;
  }
}

function mapEmploymentType(type: string): string {
  const map: Record<string, string> = {
    clt: 'Effective',
    pj: 'YoungApprentice',
    internship: 'Internship',
    freelancer: 'Freelancer',
    temporary: 'Temporary',
  };
  return map[type?.toLowerCase()] || 'Effective';
}

function buildPayload(job: JobCanonical, credentials: ChannelCredentials): Record<string, unknown> {
  return {
    name: job.title,
    description: job.description_html || job.description,
    type: mapEmploymentType(job.employment_type),
    city: job.location,
    country: 'BR',
    state: '',
    isActive: true,
    applicationDeadline: job.application_deadline,
    externalApplicationLink: job.external_apply_url,
    companyId: credentials.company_id,
  };
}

export async function publishToGupy(
  job: JobCanonical,
  credentials: ChannelCredentials
): Promise<PublishResult> {
  const token = await getAccessToken(credentials);
  if (!token) {
    return { success: false, error: 'Credenciais Gupy inválidas ou ausentes' };
  }

  const payload = buildPayload(job, credentials);

  try {
    const res = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({})) as Record<string, unknown>;

    if (!res.ok) {
      return {
        success: false,
        error: `Gupy API ${res.status}: ${(body as any).message || 'Erro desconhecido'}`,
        payload_sent: payload,
        response_received: body,
      };
    }

    const result = body as { id?: string | number; applicationUrl?: string };
    return {
      success: true,
      external_id: String(result.id || ''),
      external_url: result.applicationUrl,
      payload_sent: payload,
      response_received: body,
    };
  } catch (err: any) {
    return { success: false, error: err.message, payload_sent: payload };
  }
}

export async function unpublishFromGupy(
  externalId: string,
  credentials: ChannelCredentials
): Promise<PublishResult> {
  const token = await getAccessToken(credentials);
  if (!token) return { success: false, error: 'Credenciais Gupy inválidas' };

  try {
    const res = await fetch(`${BASE_URL}/jobs/${externalId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Disabled' }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      return { success: false, error: `Gupy unpublish ${res.status}`, response_received: body };
    }

    return { success: true, external_id: externalId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateOnGupy(
  externalId: string,
  job: JobCanonical,
  credentials: ChannelCredentials
): Promise<PublishResult> {
  const token = await getAccessToken(credentials);
  if (!token) return { success: false, error: 'Credenciais Gupy inválidas' };

  const payload = buildPayload(job, credentials);

  try {
    const res = await fetch(`${BASE_URL}/jobs/${externalId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({})) as Record<string, unknown>;

    if (!res.ok) {
      return { success: false, error: `Gupy update ${res.status}`, response_received: body };
    }

    return { success: true, external_id: externalId, payload_sent: payload, response_received: body };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Testa se as credenciais são válidas sem publicar nada */
export async function testGupyCredentials(credentials: ChannelCredentials): Promise<{ ok: boolean; message: string }> {
  const token = await getAccessToken(credentials);
  if (!token) return { ok: false, message: 'Não foi possível obter token — verifique client_id e client_secret' };
  return { ok: true, message: 'Credenciais Gupy válidas' };
}
