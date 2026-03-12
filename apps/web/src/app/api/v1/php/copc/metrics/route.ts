import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateOrgMembership } from '@/lib/api/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/v1/php/copc/metrics
 * Lista métricas COPC
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar org_id do usuário autenticado
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'org_id é obrigatório' },
        { status: 400 }
      );
    }

    if (!(await validateOrgMembership(supabase, user.id, orgId))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    // Buscar métricas COPC
    const { data: metrics, error } = await supabase
      .from('copc_metrics')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar métricas COPC:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar métricas COPC' },
        { status: 500 }
      );
    }

    return NextResponse.json(metrics || []);
  } catch (err) {
    console.error('Erro no GET /api/v1/php/copc/metrics:', err);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/php/copc/metrics
 * Cria nova métrica COPC
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar org_id do usuário autenticado
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const orgId = request.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json(
        { error: 'x-org-id é obrigatório' },
        { status: 400 }
      );
    }

    if (!(await validateOrgMembership(supabase, user.id, orgId))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    const body = await request.json();

    const {
      team_id,
      user_id,
      metric_date,
      quality_score,
      rework_rate,
      process_adherence_rate,
      average_handle_time,
      first_call_resolution_rate,
      delivery_consistency,
      customer_satisfaction_score,
      nps_score,
      absenteeism_rate,
      engagement_score,
      operational_stress_level,
      notes,
      source,
    } = body;

    // Criar métrica COPC
    const { data: metric, error } = await supabase
      .from('copc_metrics')
      .insert({
        org_id: orgId,
        created_by: user.id,
        team_id,
        user_id,
        metric_date,
        quality_score,
        rework_rate,
        process_adherence_rate,
        average_handle_time,
        first_call_resolution_rate,
        delivery_consistency,
        customer_satisfaction_score,
        nps_score,
        absenteeism_rate,
        engagement_score,
        operational_stress_level,
        notes,
        source,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar métrica COPC:', error);
      return NextResponse.json(
        { error: 'Erro ao criar métrica COPC' },
        { status: 500 }
      );
    }

    return NextResponse.json(metric, { status: 201 });
  } catch (err) {
    console.error('Erro no POST /api/v1/php/copc/metrics:', err);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}
