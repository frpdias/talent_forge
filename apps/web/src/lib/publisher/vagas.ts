import type { ChannelCredentials, JobCanonical, PublishResult } from './types';

const BASE_URL = 'https://www.vagas.com.br/api/v1';

function mapEmploymentType(type: string): string {
  const map: Record<string, string> = {
    clt: 'CLT',
    pj: 'PJ',
    internship: 'Estágio',
    freelancer: 'Freelancer',
    temporary: 'Temporário',
  };
  return map[type?.toLowerCase()] || 'CLT';
}

function buildPayload(job: JobCanonical): Record<string, unknown> {
  return {
    titulo: job.title,
    descricao: job.description_html || job.description,
    requisitos: job.requirements || '',
    beneficios: job.benefits || '',
    cidade: job.location,
    tipoContrato: mapEmploymentType(job.employment_type),
    dataExpiracao: job.application_deadline,
    urlCandidatura: job.external_apply_url,
    empresa: { nome: job.org_name },
  };
}

export async function publishToVagas(
  job: JobCanonical,
  credentials: ChannelCredentials
): Promise<PublishResult> {
  if (!credentials.api_key) {
    return { success: false, error: 'API Key do Vagas.com não configurada' };
  }

  const payload = buildPayload(job);

  try {
    const res = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        Authorization: `ApiKey ${credentials.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({})) as Record<string, unknown>;

    if (!res.ok) {
      return {
        success: false,
        error: `Vagas.com API ${res.status}: ${(body as any).message || 'Erro desconhecido'}`,
        payload_sent: payload,
        response_received: body,
      };
    }

    const result = body as { id?: string; url?: string; jobUrl?: string };
    return {
      success: true,
      external_id: result.id,
      external_url: result.url || result.jobUrl,
      payload_sent: payload,
      response_received: body,
    };
  } catch (err: any) {
    return { success: false, error: err.message, payload_sent: payload };
  }
}

export async function unpublishFromVagas(
  externalId: string,
  credentials: ChannelCredentials
): Promise<PublishResult> {
  if (!credentials.api_key) return { success: false, error: 'API Key ausente' };

  try {
    const res = await fetch(`${BASE_URL}/jobs/${externalId}`, {
      method: 'DELETE',
      headers: { Authorization: `ApiKey ${credentials.api_key}` },
    });

    if (!res.ok) {
      return { success: false, error: `Vagas.com unpublish ${res.status}` };
    }

    return { success: true, external_id: externalId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateOnVagas(
  externalId: string,
  job: JobCanonical,
  credentials: ChannelCredentials
): Promise<PublishResult> {
  if (!credentials.api_key) return { success: false, error: 'API Key ausente' };

  const payload = buildPayload(job);

  try {
    const res = await fetch(`${BASE_URL}/jobs/${externalId}`, {
      method: 'PUT',
      headers: {
        Authorization: `ApiKey ${credentials.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({})) as Record<string, unknown>;

    if (!res.ok) {
      return { success: false, error: `Vagas.com update ${res.status}`, response_received: body };
    }

    return { success: true, external_id: externalId, payload_sent: payload, response_received: body };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Testa se a API key é válida (GET /jobs retornando 200 ou 404 = key válida) */
export async function testVagasCredentials(credentials: ChannelCredentials): Promise<{ ok: boolean; message: string }> {
  if (!credentials.api_key) return { ok: false, message: 'API Key não informada' };

  try {
    const res = await fetch(`${BASE_URL}/jobs`, {
      method: 'GET',
      headers: { Authorization: `ApiKey ${credentials.api_key}` },
    });

    // 200 ou 404 = key aceita pelo servidor (404 = sem vagas, mas autenticado)
    if (res.status === 200 || res.status === 404) {
      return { ok: true, message: 'Credenciais Vagas.com válidas' };
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: 'API Key inválida ou sem permissão' };
    }
    return { ok: false, message: `Vagas.com retornou status ${res.status}` };
  } catch (err: any) {
    return { ok: false, message: `Erro de conexão: ${err.message}` };
  }
}
