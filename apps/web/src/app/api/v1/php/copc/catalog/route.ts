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
 * GET /api/v1/php/copc/catalog
 * Lista métricas do catálogo — filtra por org_id e/ou department
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const department = searchParams.get('department');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (orgId && !(await validateOrgMembership(supabase, user.id, orgId))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    // Buscar templates globais (org_id IS NULL) + métricas da org
    let query = supabase
      .from('copc_metrics_catalog')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('display_order', { ascending: true });

    if (orgId) {
      query = query.or(`org_id.is.null,org_id.eq.${orgId}`);
    } else {
      query = query.is('org_id', null);
    }

    if (department) {
      query = query.or(`department.is.null,department.eq.${department}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar catálogo COPC:', error);
      return NextResponse.json({ error: 'Erro ao buscar catálogo' }, { status: 500 });
    }

    // Agrupar por categoria
    const byCategory: Record<string, typeof data> = {};
    const catalogDepts = new Set<string>();

    for (const metric of data || []) {
      if (!byCategory[metric.category]) byCategory[metric.category] = [];
      byCategory[metric.category].push(metric);
      if (metric.department) catalogDepts.add(metric.department);
    }

    // Buscar departamentos reais da organização (employees)
    let orgDepartments: string[] = [];
    if (orgId) {
      const { data: empDepts } = await supabase
        .from('employees')
        .select('department')
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .not('department', 'is', null);

      if (empDepts) {
        orgDepartments = [...new Set(empDepts.map(e => e.department as string).filter(Boolean))];
      }
    }

    // Mesclar: departamentos reais + departamentos do catálogo
    const allDepts = [...new Set([...orgDepartments, ...catalogDepts])].sort();

    return NextResponse.json({
      total: data?.length || 0,
      departments: allDepts,
      org_departments: orgDepartments,
      catalog_departments: Array.from(catalogDepts).sort(),
      by_category: byCategory,
      metrics: data || [],
    });
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/v1/php/copc/catalog  
 * Cria nova métrica customizada no catálogo (para a org específica)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id obrigatório' }, { status: 400 });

    const body = await request.json();
    const { category, metric_name, metric_code, weight, unit, department, description, min_value, max_value, higher_is_better, target_value } = body;

    if (!category || !metric_name || !metric_code) {
      return NextResponse.json({ error: 'category, metric_name e metric_code são obrigatórios' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!(await validateOrgMembership(supabase, user.id, orgId))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('copc_metrics_catalog')
      .insert({
        org_id: orgId,
        category,
        metric_name,
        metric_code,
        weight: weight || 0.5,
        unit: unit || '%',
        department: department || null,
        description: description || null,
        min_value: min_value ?? 0,
        max_value: max_value ?? 100,
        higher_is_better: higher_is_better ?? true,
        target_value: target_value || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar métrica no catálogo:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
