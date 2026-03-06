import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('google_calendar_connected, google_calendar_email')
      .eq('id', session.user.id)
      .maybeSingle();

    return NextResponse.json({
      connected: Boolean(profile?.google_calendar_connected),
      email: profile?.google_calendar_email ?? null,
    });
  } catch (error: any) {
    console.error('google-calendar/status error:', error);
    return NextResponse.json({ connected: false, email: null });
  }
}
