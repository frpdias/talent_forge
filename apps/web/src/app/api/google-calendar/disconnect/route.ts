import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await supabase
      .from('user_profiles')
      .update({
        google_calendar_access_token: null,
        google_calendar_refresh_token: null,
        google_calendar_token_expires_at: null,
        google_calendar_email: null,
        google_calendar_connected: false,
        google_calendar_connected_at: null,
        google_calendar_state: null,
      })
      .eq('id', session.user.id);

    return NextResponse.json({ connected: false });
  } catch (error: any) {
    console.error('google-calendar/disconnect error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
