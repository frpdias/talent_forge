import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Deriva o redirect_uri a partir do domínio da requisição.
// Isso garante que talentforge.com.br → talentforge.com.br/api/google-calendar/callback
// e web-eight-rho-84.vercel.app → web-eight-rho-84.vercel.app/api/google-calendar/callback
function getRedirectUri(request: Request): string {
  // Se há uma URI explícita configurada, usar ela
  if (process.env.GOOGLE_CALENDAR_REDIRECT_URI) {
    return process.env.GOOGLE_CALENDAR_REDIRECT_URI;
  }
  // Derivar do host da requisição
  const { origin } = new URL(request.url);
  return `${origin}/api/google-calendar/callback`;
}

export async function GET(request: Request) {
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

    const redirectUri = getRedirectUri(request);

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
