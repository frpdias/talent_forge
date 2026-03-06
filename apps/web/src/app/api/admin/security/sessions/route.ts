import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/security/sessions
 * Retorna sessões ativas (usuários que logaram nas últimas 24h)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    const userType = profile?.user_type || (user.user_metadata as any)?.user_type;

    if (!userType || userType !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Usar service role para acessar auth.users
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      // Fallback: retornar dados de user_profiles
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, email, user_type, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (profilesError) {
        console.error('Erro ao buscar profiles:', profilesError);
        return NextResponse.json({
          success: true,
          sessions: [],
          message: 'Não foi possível obter sessões ativas',
        });
      }

      const sessions = (profiles || []).map(p => ({
        user_id: p.user_id,
        email: p.email || 'Email não disponível',
        user_type: p.user_type || 'unknown',
        last_sign_in_at: p.updated_at,
        created_at: p.created_at,
      }));

      return NextResponse.json({
        success: true,
        sessions,
        timestamp: new Date().toISOString(),
      });
    }

    // Usar admin client
    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Buscar usuários que logaram nas últimas 24h
    const { data: authUsers, error: usersError } = await adminClient.auth.admin.listUsers({
      perPage: 100,
    });

    if (usersError) {
      console.error('Erro ao buscar usuários auth:', usersError);
      return NextResponse.json({
        success: true,
        sessions: [],
        message: 'Erro ao obter sessões',
      });
    }

    const oneDayAgo = new Date(Date.now() - 86400000);
    
    // Filtrar usuários que logaram nas últimas 24h
    const activeSessions = (authUsers.users || [])
      .filter(u => {
        if (!u.last_sign_in_at) return false;
        return new Date(u.last_sign_in_at) > oneDayAgo;
      })
      .map(u => ({
        user_id: u.id,
        email: u.email || 'Email não disponível',
        user_type: (u.user_metadata as any)?.user_type || 'unknown',
        last_sign_in_at: u.last_sign_in_at,
        created_at: u.created_at,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.last_sign_in_at || 0).getTime();
        const dateB = new Date(b.last_sign_in_at || 0).getTime();
        return dateB - dateA;
      });

    return NextResponse.json({
      success: true,
      sessions: activeSessions,
      totalUsers: authUsers.users?.length || 0,
      activeIn24h: activeSessions.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Erro no endpoint /api/admin/security/sessions:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao buscar sessões ativas',
        success: false,
      },
      { status: 500 }
    );
  }
}
