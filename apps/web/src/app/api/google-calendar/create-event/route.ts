import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Refresha o access_token usando o refresh_token se expirado.
 * Retorna o access_token válido (novo ou existente).
 */
async function getValidAccessToken(
  userId: string,
  profile: {
    google_calendar_access_token: string;
    google_calendar_refresh_token: string;
    google_calendar_token_expires_at: string;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceSupabase: any,
): Promise<string> {
  const expiresAt = new Date(profile.google_calendar_token_expires_at).getTime();
  const now = Date.now();

  // Se o token ainda é válido (com 2min de margem), retorna direto
  if (now < expiresAt - 120_000) {
    return profile.google_calendar_access_token;
  }

  // Refresh token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      refresh_token: profile.google_calendar_refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[create-event] Token refresh failed:', err);
    throw new Error('Falha ao renovar token do Google. Reconecte o Google Calendar nas configurações.');
  }

  const tokens = await res.json();
  const newExpiresAt = new Date(now + (tokens.expires_in ?? 3600) * 1000).toISOString();

  // Salvar novo access_token
  await serviceSupabase
    .from('user_profiles')
    .update({
      google_calendar_access_token: tokens.access_token,
      google_calendar_token_expires_at: newExpiresAt,
    })
    .eq('id', userId);

  return tokens.access_token;
}

/**
 * POST /api/google-calendar/create-event
 *
 * Cria um evento no Google Calendar do recrutador com Google Meet automático.
 *
 * Body: {
 *   title: string;
 *   startTime: string;       // ISO datetime
 *   durationMinutes: number;
 *   description?: string;
 *   location?: string;
 *   attendees?: string[];    // emails dos participantes
 * }
 *
 * Returns: {
 *   eventId: string;
 *   meetLink: string;
 *   htmlLink: string;        // link para ver o evento no Calendar
 * }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { title, startTime, durationMinutes, description, location, attendees } = body;

    if (!title || !startTime || !durationMinutes) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: title, startTime, durationMinutes' },
        { status: 400 },
      );
    }

    // Buscar tokens do Google Calendar do usuário
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select(
        'google_calendar_connected, google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expires_at',
      )
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    if (!profile.google_calendar_connected || !profile.google_calendar_access_token) {
      return NextResponse.json(
        { error: 'Google Calendar não conectado. Conecte nas configurações primeiro.' },
        { status: 400 },
      );
    }

    if (!profile.google_calendar_refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token ausente. Reconecte o Google Calendar nas configurações.' },
        { status: 400 },
      );
    }

    // Obter access_token válido (refresh se necessário)
    const accessToken = await getValidAccessToken(session.user.id, profile as any, serviceSupabase);

    // Construir evento Google Calendar com conferência Meet
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60_000);

    const event: Record<string, unknown> = {
      summary: title,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      // Gerar Google Meet automaticamente
      conferenceData: {
        createRequest: {
          requestId: `tf-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    if (description) event.description = description;
    if (location) event.location = location;
    if (attendees && Array.isArray(attendees) && attendees.length > 0) {
      event.attendees = attendees.map((email: string) => ({ email }));
    }

    // Criar evento via Google Calendar API
    const calRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
    );

    if (!calRes.ok) {
      const err = await calRes.text();
      console.error('[create-event] Google Calendar API error:', calRes.status, err);

      // Se 401, token inválido — sugerir reconexão
      if (calRes.status === 401) {
        return NextResponse.json(
          { error: 'Token expirado. Reconecte o Google Calendar nas configurações.' },
          { status: 401 },
        );
      }

      return NextResponse.json(
        { error: `Erro ao criar evento no Google Calendar: ${calRes.status}` },
        { status: 500 },
      );
    }

    const calEvent = await calRes.json();

    // Extrair Meet link da resposta
    const meetLink =
      calEvent.hangoutLink ||
      calEvent.conferenceData?.entryPoints?.find(
        (ep: any) => ep.entryPointType === 'video',
      )?.uri ||
      null;

    return NextResponse.json({
      eventId: calEvent.id,
      meetLink,
      htmlLink: calEvent.htmlLink,
    });
  } catch (error: any) {
    console.error('[create-event] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao criar evento' },
      { status: 500 },
    );
  }
}
