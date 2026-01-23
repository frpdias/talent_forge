import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/audit-logs
 * 
 * Retorna histórico de auditoria com filtros e paginação
 * 
 * Query Params:
 * - page: número da página (default: 1)
 * - limit: itens por página (default: 50, max: 100)
 * - action: filtrar por ação específica (opcional)
 * - resource: filtrar por recurso/tabela (opcional)
 * - actor_id: filtrar por ID do usuário (opcional)
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
        { error: 'Acesso negado. Apenas administradores podem visualizar logs de auditoria.' },
        { status: 403 }
      );
    }

    // 3. Extrair query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const actorId = searchParams.get('actor_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    const offset = (page - 1) * limit;

    // 4. Construir query com filtros
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        actor:actor_id (
          id,
          email,
          raw_user_meta_data
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (action) {
      query = query.eq('action', action);
    }
    if (resource) {
      query = query.eq('resource', resource);
    }
    if (actorId) {
      query = query.eq('actor_id', actorId);
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
    const { data: logs, error: logsError, count } = await query;

    if (logsError) {
      console.error('Erro ao buscar audit logs:', logsError);
      return NextResponse.json(
        { error: 'Erro ao buscar logs de auditoria' },
        { status: 500 }
      );
    }

    // 6. Formatar resposta com informações de paginação
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      success: true,
      data: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        action,
        resource,
        actorId,
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Erro no endpoint de audit logs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/audit-logs
 * 
 * Cria um novo registro de auditoria
 * Usado por outros endpoints/sistema para registrar ações
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
    const { action, resource, metadata = {} } = body;

    if (!action || !resource) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: action, resource' },
        { status: 400 }
      );
    }

    // 3. Inserir log de auditoria
    const { data: log, error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: session.user.id,
        action,
        resource,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir audit log:', insertError);
      return NextResponse.json(
        { error: 'Erro ao criar registro de auditoria' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: log
    });

  } catch (error) {
    console.error('Erro no endpoint POST de audit logs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
