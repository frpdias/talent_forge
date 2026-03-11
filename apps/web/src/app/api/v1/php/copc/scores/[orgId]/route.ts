import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateOrgMembership } from '@/lib/api/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getAuthUser(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  return user;
}

/**
 * GET /api/v1/php/copc/scores/[orgId]
 * Retorna scores dinâmicos calculados a partir da view v_copc_dynamic_scores
 * Query params: department, start_date, end_date
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { orgId } = await context.params;
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!(await validateOrgMembership(supabase, user.id, orgId))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    let query = supabase
      .from('v_copc_dynamic_scores')
      .select('*')
      .eq('org_id', orgId)
      .order('metric_date', { ascending: false });

    if (department) query = query.eq('department', department);
    if (startDate) query = query.gte('metric_date', startDate);
    if (endDate) query = query.lte('metric_date', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar scores dinâmicos:', error);
      return NextResponse.json({ error: 'Erro ao buscar scores' }, { status: 500 });
    }

    // Calcular resumo geral 
    const entries = data || [];
    const departments = [...new Set(entries.map(e => e.department))];

    // Média geral (últimas entradas de cada departamento)
    const latestByDept: Record<string, (typeof entries)[0]> = {};
    for (const entry of entries) {
      if (!latestByDept[entry.department] || entry.metric_date > latestByDept[entry.department].metric_date) {
        latestByDept[entry.department] = entry;
      }
    }

    const latestEntries = Object.values(latestByDept);
    const overallAvg = latestEntries.length > 0
      ? latestEntries.reduce((sum, e) => sum + (e.overall_score || 0), 0) / latestEntries.length
      : 0;

    // Buscar departamentos reais da organização
    const { data: empDepts } = await supabase
      .from('employees')
      .select('department')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .not('department', 'is', null);

    const orgDepartments = empDepts
      ? [...new Set(empDepts.map(e => e.department as string).filter(Boolean))].sort()
      : [];

    // Mesclar departamentos reais + departamentos com dados
    const allDepts = [...new Set([...orgDepartments, ...departments])].sort();

    return NextResponse.json({
      org_id: orgId,
      overall_score: Math.round(overallAvg * 100) / 100,
      departments: allDepts,
      org_departments: orgDepartments,
      by_department: latestByDept,
      trends: entries,
    });
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
