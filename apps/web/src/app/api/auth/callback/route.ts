import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Rota de callback OAuth (PKCE) — Sprint 42
 *
 * Supabase redireciona aqui após autenticação Google com ?code=...
 * Esta rota:
 *  1. Troca o code por uma sessão (server-side, seguro)
 *  2. Consulta user_profiles para saber o tipo do usuário
 *  3. Redireciona para a tela correta
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Supabase pode redirecionar aqui com erro quando o provider falha
  const errorCode = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  if (errorCode) {
    console.error('[auth/callback] Provider error:', errorCode, errorDescription);
    const msg = encodeURIComponent(errorDescription || errorCode);
    return NextResponse.redirect(`${origin}/login?oauth_error=${msg}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();

  // Troca o código pelo par de tokens (PKCE)
  const { data: sessionData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !sessionData.session) {
    console.error('[auth/callback] exchangeCodeForSession error:', exchangeError?.message);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const userId = sessionData.session.user.id;

  // Descobre o tipo do usuário consultando user_profiles
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', userId)
    .single();

  const userType = profile?.user_type ?? sessionData.session.user.user_metadata?.user_type;

  let destination: string;

  if (userType === 'admin') {
    destination = `${origin}/admin`;
  } else if (userType === 'recruiter' || userType === 'manager') {
    destination = `${origin}/dashboard`;
  } else if (userType === 'candidate') {
    // Já tem perfil → lista de vagas; sem perfil → onboarding
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    destination = candidate ? `${origin}/candidate` : `${origin}/cadastro`;
  } else {
    // Usuário novo sem user_type definido — provavelmente candidato via Google
    destination = `${origin}/cadastro`;
  }

  // Usa `next` param se vier da página de login com redirect intencional
  if (next !== '/dashboard') {
    destination = `${origin}${next}`;
  }

  return NextResponse.redirect(destination);
}


  const supabase = await createClient();

  // Troca o código pelo par de tokens (PKCE)
  const { data: sessionData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !sessionData.session) {
    console.error('[auth/callback] exchangeCodeForSession error:', exchangeError?.message);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const userId = sessionData.session.user.id;

  // Descobre o tipo do usuário consultando user_profiles
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', userId)
    .single();

  const userType = profile?.user_type ?? sessionData.session.user.user_metadata?.user_type;

  let destination: string;

  if (userType === 'admin') {
    destination = `${origin}/admin`;
  } else if (userType === 'recruiter' || userType === 'manager') {
    destination = `${origin}/dashboard`;
  } else if (userType === 'candidate') {
    // Já tem perfil → lista de vagas; sem perfil → onboarding
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    destination = candidate ? `${origin}/candidate` : `${origin}/cadastro`;
  } else {
    // Usuário novo sem user_type definido — provavelmente candidato via Google
    destination = `${origin}/cadastro`;
  }

  // Usa `next` param se vier da página de login com redirect intencional
  if (next !== '/dashboard') {
    destination = `${origin}${next}`;
  }

  return NextResponse.redirect(destination);
}
