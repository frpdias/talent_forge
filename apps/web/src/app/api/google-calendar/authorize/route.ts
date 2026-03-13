import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// URL fixa registrada no Google Cloud Console.
// Prioridade: GOOGLE_CALENDAR_REDIRECT_URI > NEXT_PUBLIC_APP_URL > fallback hardcoded.
// NUNCA usar URL dinâmica do request — o Google valida contra a lista cadastrada.
function getRedirectUri(): string {
  const base =
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/callback`
      : 'https://web-eight-rho-84.vercel.app/api/google-calendar/callback');
  return base;
}

export async function GET(_request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const state = crypto.randomBytes(32).toString('hex');

    // Salvar state no user_profiles para validação no callback (service role para bypass RLS)
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await serviceSupabase
      .from('user_profiles')
      .upsert({ id: session.user.id, google_calendar_state: state }, { onConflict: 'id' });

    const redirectUri = getRedirectUri();

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('google-calendar/authorize error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
