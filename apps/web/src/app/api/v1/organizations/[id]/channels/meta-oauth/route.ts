/**
 * Meta OAuth 2.0 — troca de code por Page Access Token
 *
 * Fluxo:
 * 1. Front redireciona usuário para login.facebook.com/dialog/oauth?...
 * 2. Usuário autoriza → Facebook redireciona para este endpoint com ?code=xxx&state=orgId
 * 3. Aqui trocamos o code por short-lived token, depois convertemos para long-lived token
 * 4. Listamos as páginas do usuário e salvamos o Page Access Token no canal correspondente
 *
 * Env vars necessárias:
 *   META_APP_ID, META_APP_SECRET
 *   NEXT_PUBLIC_APP_URL (ex: https://web-eight-rho-84.vercel.app)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const GRAPH_URL = 'https://graph.facebook.com/v21.0';

interface OAuthParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: OAuthParams) {
  const { id: orgId } = await params;
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/v1/organizations/${orgId}/channels/meta-oauth`;
  const settingsUrl = `${appUrl}/dashboard/settings/channels`;

  if (error || !code) {
    return NextResponse.redirect(
      `${settingsUrl}?meta_error=${encodeURIComponent(error || 'Autorização cancelada')}`
    );
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.redirect(`${settingsUrl}?meta_error=META_APP_ID+ou+META_APP_SECRET+nao+configurados`);
  }

  try {
    // 1. Trocar code por short-lived user token
    const tokenRes = await fetch(
      `${GRAPH_URL}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json() as { access_token?: string; error?: { message?: string } };

    if (!tokenData.access_token) {
      const msg = tokenData.error?.message || 'Token não retornado';
      return NextResponse.redirect(`${settingsUrl}?meta_error=${encodeURIComponent(msg)}`);
    }

    // 2. Converter para long-lived token (validade: 60 dias)
    const longRes = await fetch(
      `${GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const longData = await longRes.json() as { access_token?: string };
    const userLongToken = longData.access_token || tokenData.access_token;

    // 3. Listar Páginas do usuário e obter Page Access Token (permanente)
    const pagesRes = await fetch(
      `${GRAPH_URL}/me/accounts?fields=id,name,access_token&access_token=${userLongToken}`
    );
    const pagesData = await pagesRes.json() as { data?: Array<{ id: string; name: string; access_token: string }> };

    if (!pagesData.data?.length) {
      return NextResponse.redirect(`${settingsUrl}?meta_error=Nenhuma+Pagina+do+Facebook+encontrada`);
    }

    // Usamos a primeira página (usuário pode ter só uma)
    const page = pagesData.data[0];

    // 4. Verificar se já existe canal facebook para esta org — se sim, atualiza; se não, cria
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from('job_publication_channels')
      .select('id')
      .eq('org_id', orgId)
      .eq('channel_code', 'facebook')
      .single();

    const credentials = {
      meta_access_token: page.access_token,
      page_id: page.id,
    };

    if (existing) {
      await supabase
        .from('job_publication_channels')
        .update({
          credentials,
          display_name: `Facebook — ${page.name}`,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('job_publication_channels').insert({
        org_id: orgId,
        channel_code: 'facebook',
        display_name: `Facebook — ${page.name}`,
        credentials,
        is_active: true,
      });
    }

    return NextResponse.redirect(`${settingsUrl}?meta_success=Facebook+conectado+com+sucesso`);
  } catch (err: any) {
    return NextResponse.redirect(`${settingsUrl}?meta_error=${encodeURIComponent(err.message || 'Erro interno')}`);
  }
}
