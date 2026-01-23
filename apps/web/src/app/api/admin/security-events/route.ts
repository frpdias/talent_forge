import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/security-events
 * 
 * Retorna eventos de segurança com filtros e paginação
 * 
 * Query Params:
 * - page: número da página (default: 1)
 * - limit: itens por página (default: 50, max: 100)
 * - type: filtrar por tipo de evento (opcional)
 * - severity: filtrar por severidade (opcional: low, medium, high, critical)
 * - start_date: filtrar por data início (ISO string, opcional)
 * - end_date: filtrar por data fim (ISO string, opcional)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Verificar autenticação
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Verificar se é admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.user_type !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem visualizar eventos de segurança.' },
        { status: 403 }
      );
    }

    // 3. Extrair query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    const offset = (page - 1) * limit;

    // 4. Construir query com filtros
    let query = supabase
      .from('security_events')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (type) {
      query = query.eq('type', type);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Ordenar por mais recente primeiro
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 5. Executar query
    const { data: events, error: eventsError, count } = await query;

    if (eventsError) {
      console.error('Erro ao buscar security events:', eventsError);
      return NextResponse.json(
        { error: 'Erro ao buscar eventos de segurança' },
        { status: 500 }
      );
    }

    // 6. Buscar estatísticas por severidade
    const { data: severityStats } = await supabase
      .from('security_events')
      .select('severity')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const stats = {
      critical: severityStats?.filter(e => e.severity === 'critical').length || 0,
      high: severityStats?.filter(e => e.severity === 'high').length || 0,
      medium: severityStats?.filter(e => e.severity === 'medium').length || 0,
      low: severityStats?.filter(e => e.severity === 'low').length || 0,
    };

    // 7. Formatar resposta com informações de paginação
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      success: true,
      data: events || [],
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        type,
        severity,
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Erro no endpoint de security events:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/security-events
 * 
 * Cria um novo evento de segurança
 * Usado por outros endpoints/sistema para registrar eventos
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Verificar autenticação
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Parse do body
    const body = await request.json();
    const { type, severity = 'low', details = {} } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Campo obrigatório: type' },
        { status: 400 }
      );
    }

    // Validar severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `Severidade inválida. Valores aceitos: ${validSeverities.join(', ')}` },
        { status: 400 }
      );
    }

    // 3. Inserir evento de segurança
    const { data: event, error: insertError } = await supabase
      .from('security_events')
      .insert({
        type,
        severity,
        details: details || {}
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir security event:', insertError);
      return NextResponse.json(
        { error: 'Erro ao criar evento de segurança' },
        { status: 500 }
      );
    }

    // 4. Registrar no audit log
    await supabase
      .from('audit_logs')
      .insert({
        actor_id: session.user.id,
        action: 'security_event_created',
        resource: 'security_events',
        metadata: { event_id: event.id, type, severity }
      });

    return NextResponse.json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('Erro no endpoint POST de security events:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
