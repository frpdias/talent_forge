import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://web-eight-rho-84.vercel.app';

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?google=error&reason=missing_params`);
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Validar state (anti-CSRF)
  const { data: profile } = await serviceSupabase
    .from('user_profiles')
    .select('id')
    .eq('google_calendar_state', state)
    .maybeSingle();

  if (!profile) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?google=error&reason=invalid_state`);
  }

  const redirectUri = `${appUrl}/api/google-calendar/callback`;

  // Trocar code por tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('google token exchange error:', err);
    return NextResponse.redirect(`${appUrl}/dashboard/settings?google=error&reason=token_exchange`);
  }

  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

  // Buscar email do usuário Google
  let googleEmail: string | null = null;
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (userRes.ok) {
      const userInfo = await userRes.json();
      googleEmail = userInfo.email ?? null;
    }
  } catch {
    // email opcional — não bloqueia
  }

  // Salvar tokens no user_profiles
  await serviceSupabase
    .from('user_profiles')
    .update({
      google_calendar_access_token: tokens.access_token,
      google_calendar_refresh_token: tokens.refresh_token ?? null,
      google_calendar_token_expires_at: expiresAt,
      google_calendar_email: googleEmail,
      google_calendar_connected: true,
      google_calendar_connected_at: new Date().toISOString(),
      google_calendar_state: null, // limpar state usado
    })
    .eq('id', profile.id);

  return NextResponse.redirect(`${appUrl}/dashboard/settings?google=connected`);
}
