import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getPeriodDays(period: string): number {
  switch (period) {
    case '7d': return 7;
    case '90d': return 90;
    case '30d': default: return 30;
  }
}

/**
 * GET /api/v1/php/copc/dashboard/[orgId]
 * Retorna dados do dashboard COPC com métricas agregadas por categoria
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Calcular data de início do período
    const days = getPeriodDays(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Buscar métricas COPC direto da tabela
    const { data: metrics, error } = await supabase
      .from('copc_metrics')
      .select('*')
      .eq('org_id', orgId)
      .gte('metric_date', startDateStr)
      .order('metric_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar métricas COPC:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar métricas COPC' },
        { status: 500 }
      );
    }

    const data = metrics || [];

    // Calcular médias por categoria
    const count = data.length;
    const avg = (field: string) => {
      const vals = data.map((m: Record<string, unknown>) => m[field] as number).filter((v: number | null | undefined) => v != null);
      return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
    };

    const summary = {
      quality: avg('quality_score'),
      efficiency: avg('process_adherence_rate'),
      effectiveness: avg('first_call_resolution_rate'),
      cx: avg('customer_satisfaction_score'),
      people: count > 0
        ? data.reduce((sum: number, m: Record<string, unknown>) => sum + (100 - ((m.absenteeism_rate as number) || 0)), 0) / count
        : 0,
      overall: avg('overall_performance_score'),
    };

    // Trends agrupados por data
    const byDate: Record<string, Record<string, unknown>[]> = {};
    for (const m of data) {
      const d = (m as Record<string, unknown>).metric_date as string;
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(m as Record<string, unknown>);
    }

    const trends = Object.entries(byDate).map(([date, items]) => {
      const c = items.length;
      return {
        date,
        quality: items.reduce((s, m) => s + ((m.quality_score as number) || 0), 0) / c,
        efficiency: items.reduce((s, m) => s + ((m.process_adherence_rate as number) || 0), 0) / c,
        effectiveness: items.reduce((s, m) => s + ((m.first_call_resolution_rate as number) || 0), 0) / c,
        cx: items.reduce((s, m) => s + ((m.customer_satisfaction_score as number) || 0), 0) / c,
        people: items.reduce((s, m) => s + (100 - ((m.absenteeism_rate as number) || 0)), 0) / c,
      };
    });

    return NextResponse.json({
      org_id: orgId,
      period,
      summary,
      trends,
      details: data,
    });
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    console.error('Erro no GET /api/v1/php/copc/dashboard/[orgId]:', error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
