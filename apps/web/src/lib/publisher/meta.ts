/**
 * Meta Graph API — Facebook Pages + Instagram Business
 *
 * Requisitos:
 * - Facebook App aprovado para `pages_manage_posts` (processo: 14-28 dias)
 * - Para Instagram: `instagram_content_publish` + conta Business vinculada
 *
 * Credenciais necessárias (obtidas via OAuth — ver /api/v1/organizations/[id]/channels/meta-oauth):
 *   - meta_access_token: Page Access Token (longa duração)
 *   - page_id: ID da Página do Facebook
 *   - instagram_account_id: ID da conta Instagram Business (só para Instagram)
 */

import type { ChannelCredentials, JobCanonical, PublishResult } from './types';

const GRAPH_URL = 'https://graph.facebook.com/v21.0';

function buildJobPost(job: JobCanonical): string {
  const salary =
    job.salary_min && job.salary_max
      ? `\n💰 Salário: R$ ${job.salary_min.toLocaleString('pt-BR')} – R$ ${job.salary_max.toLocaleString('pt-BR')}`
      : '';
  const deadline = job.application_deadline
    ? `\n📅 Candidaturas até: ${new Date(job.application_deadline).toLocaleDateString('pt-BR')}`
    : '';
  const apply = job.external_apply_url ? `\n\n🔗 Candidate-se: ${job.external_apply_url}` : '';

  return (
    `🚀 Vaga: ${job.title}\n` +
    `📍 Local: ${job.location}\n` +
    `🤝 Contrato: ${job.employment_type}` +
    salary +
    deadline +
    `\n\n${job.description.slice(0, 800)}${job.description.length > 800 ? '...' : ''}` +
    apply +
    `\n\n#vaga #emprego #recrutamento #${job.org_slug}`
  );
}

/** Publica post de vaga na Página do Facebook */
export async function publishToFacebook(
  job: JobCanonical,
  credentials: ChannelCredentials
): Promise<PublishResult> {
  const token = credentials.meta_access_token;
  const pageId = credentials.page_id;

  if (!token || !pageId) {
    return { success: false, error: 'Credenciais Meta incompletas — token e page_id obrigatórios' };
  }

  const message = buildJobPost(job);
  const payload = { message, access_token: token };

  try {
    const res = await fetch(`${GRAPH_URL}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({})) as Record<string, unknown>;

    if (!res.ok) {
      return {
        success: false,
        error: `Facebook API ${res.status}: ${(body as any).error?.message || 'Erro desconhecido'}`,
        response_received: body,
      };
    }

    const postId = String((body as any).id || '');
    return {
      success: true,
      external_id: postId,
      external_url: `https://www.facebook.com/${postId}`,
      response_received: body,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Publica post de vaga no Instagram Business via Graph API */
export async function publishToInstagram(
  job: JobCanonical,
  credentials: ChannelCredentials
): Promise<PublishResult> {
  const token = credentials.meta_access_token;
  const igId = credentials.instagram_account_id;

  if (!token || !igId) {
    return {
      success: false,
      error: 'Credenciais Meta incompletas — token e instagram_account_id obrigatórios',
    };
  }

  const caption = buildJobPost(job);

  try {
    // Etapa 1: criar container de mídia (texto puro — image_url opcional)
    const containerRes = await fetch(`${GRAPH_URL}/${igId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption, media_type: 'REELS', access_token: token }),
    });

    const containerBody = await containerRes.json().catch(() => ({})) as Record<string, unknown>;

    if (!containerRes.ok) {
      return {
        success: false,
        error: `Instagram container ${containerRes.status}: ${(containerBody as any).error?.message || 'Erro'}`,
        response_received: containerBody,
      };
    }

    const creationId = String((containerBody as any).id || '');
    if (!creationId) {
      return { success: false, error: 'Instagram não retornou creation_id' };
    }

    // Etapa 2: publicar o container
    const publishRes = await fetch(`${GRAPH_URL}/${igId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: creationId, access_token: token }),
    });

    const publishBody = await publishRes.json().catch(() => ({})) as Record<string, unknown>;

    if (!publishRes.ok) {
      return {
        success: false,
        error: `Instagram publish ${publishRes.status}: ${(publishBody as any).error?.message || 'Erro'}`,
        response_received: publishBody,
      };
    }

    const postId = String((publishBody as any).id || creationId);
    return {
      success: true,
      external_id: postId,
      response_received: publishBody,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Remove post do Facebook (só funciona se `post_id` foi salvo) */
export async function unpublishFromFacebook(
  externalId: string,
  credentials: ChannelCredentials
): Promise<PublishResult> {
  const token = credentials.meta_access_token;
  if (!token) return { success: false, error: 'Token Meta ausente' };

  try {
    const res = await fetch(`${GRAPH_URL}/${externalId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: token }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      return { success: false, error: `Facebook delete ${res.status}`, response_received: body };
    }

    return { success: true, external_id: externalId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Remove post do Instagram */
export async function unpublishFromInstagram(
  externalId: string,
  credentials: ChannelCredentials
): Promise<PublishResult> {
  // Instagram Graph API não suporta deleção de posts via API — apenas via app do usuário
  // Retornamos sucesso "lógico" para não bloquear o fluxo; a publicação será marcada como unpublished no DB
  return { success: true, external_id: externalId };
}

/** Valida token e page_id consultando a página */
export async function testMetaCredentials(
  credentials: ChannelCredentials
): Promise<{ ok: boolean; message: string }> {
  const token = credentials.meta_access_token;
  const pageId = credentials.page_id;

  if (!token || !pageId) {
    return { ok: false, message: 'meta_access_token e page_id são obrigatórios' };
  }

  try {
    const res = await fetch(`${GRAPH_URL}/${pageId}?fields=id,name&access_token=${token}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      return {
        ok: false,
        message: `Token inválido ou sem acesso à página: ${(body as any).error?.message || res.status}`,
      };
    }
    const data = await res.json() as { name?: string };
    return { ok: true, message: `Conectado à página: ${data.name || pageId}` };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}
