import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

async function ensureAdmin() {
  const supabase = await createServerClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
  }

  const userType = (session.user.user_metadata as any)?.user_type;
  if (userType !== 'admin') {
    return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      error: NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' },
        { status: 500 }
      ),
    };
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return { admin };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 [Metrics API] Iniciando busca de métricas para org:', id);
    const { admin, error: adminError } = await ensureAdmin();
    if (adminError) return adminError;
    console.log('✅ [Metrics API] Supabase admin client criado');

    console.log('📊 [Metrics API] Buscando métricas para org_id:', id);

    // Buscar métricas da view
    const { data: metrics, error: metricsError } = await admin
      .from('v_org_metrics')
      .select('*')
      .eq('org_id', id)
      .single();

    console.log('📈 [Metrics API] Resultado da query:', { metrics, error: metricsError });

    if (metricsError) {
      console.error('❌ [Metrics API] Error fetching metrics:', metricsError);
      return NextResponse.json({ 
        error: 'Erro ao buscar métricas', 
        details: metricsError.message,
        code: metricsError.code 
      }, { status: 500 });
    }
    
    console.log('✅ [Metrics API] Métricas encontradas para:', metrics?.org_name);

    // Buscar breakdown detalhado do banco
    const { data: dbBreakdown } = await admin.rpc('get_org_detailed_metrics', {
      p_org_id: id
    });

    const { data: candidates } = await admin
      .from('candidates')
      .select('id, full_name, email, phone, created_at')
      .eq('owner_org_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Se a função RPC não retornar dados, usar métricas básicas
    const response = dbBreakdown || {
      org_id: id,
      metrics: metrics,
      database_breakdown: {
        candidates: metrics.total_candidates || 0,
        applications: metrics.total_applications || 0,
        jobs: metrics.total_jobs || 0,
        assessments: metrics.total_assessments || 0,
        pipeline_events: metrics.total_pipeline_events || 0,
        org_members: metrics.total_users || 0,
      },
      storage_usage: [],
      health: {
        status: metrics.status || 'active',
        plan: metrics.plan_id || 'free',
        created_at: metrics.org_created_at,
        alerts: [],
      }
    };

    // Calcular totais para resposta
    const formattedResponse = {
      org_id: id,
      org_name: metrics.org_name,
      candidates: candidates || [],
      
      // 1. Métricas de Negócio
      business: {
        active_users: metrics.active_users || 0,
        total_users: metrics.total_users || 0,
        active_jobs: metrics.active_jobs || 0,
        closed_jobs: metrics.closed_jobs || 0,
        total_jobs: metrics.total_jobs || 0,
        total_applications: metrics.total_applications || 0,
        total_hires: metrics.total_hires || 0,
        conversion_rate: metrics.conversion_rate || 0,
      },
      
      // 2. Ocupação de Banco
      database: {
        breakdown: response.database_breakdown || {
          candidates: metrics.total_candidates || 0,
          applications: metrics.total_applications || 0,
          jobs: metrics.total_jobs || 0,
          assessments: metrics.total_assessments || 0,
          pipeline_events: metrics.total_pipeline_events || 0,
          org_members: metrics.total_users || 0,
        },
        total_records: (
          (metrics.total_candidates || 0) +
          (metrics.total_applications || 0) +
          (metrics.total_jobs || 0) +
          (metrics.total_assessments || 0) +
          (metrics.total_pipeline_events || 0) +
          (metrics.total_users || 0)
        ),
        estimated_size_bytes: metrics.estimated_db_size_bytes || 0,
        estimated_size_mb: ((metrics.estimated_db_size_bytes || 0) / 1048576).toFixed(2),
      },
      
      // 3. Ocupação de Storage
      storage: {
        buckets: response.storage_usage || [],
        total_files: 0, // TODO: Somar dos buckets quando storage estiver configurado
        total_size_bytes: 0,
        total_size_mb: 0,
        usage_percentage: 0,
        limit_gb: 1, // Default: 1GB
      },
      
      // 4. Timeline de Atividade (últimos 30 dias)
      activity: {
        applications_last_30d: metrics.applications_last_30d || 0,
        jobs_created_last_30d: metrics.jobs_created_last_30d || 0,
        hires_last_30d: metrics.hires_last_30d || 0,
        last_activity_at: metrics.last_activity_at,
      },
      
      // 5. Health & Status
      health: {
        status: metrics.status || 'active',
        plan: metrics.plan_id || 'free',
        created_at: metrics.org_created_at,
        alerts: response.health?.alerts || [],
      },
    };

    return NextResponse.json(formattedResponse);
    
  } catch (error) {
    console.error('Error in metrics endpoint:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
