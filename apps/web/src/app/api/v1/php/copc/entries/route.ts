import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
 * GET /api/v1/php/copc/entries
 * Lista entradas de métricas dinâmicas com catálogo
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const department = searchParams.get('department');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!orgId) return NextResponse.json({ error: 'org_id obrigatório' }, { status: 400 });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('copc_metric_entries')
      .select(`
        *,
        catalog:copc_metrics_catalog(
          id, category, metric_name, metric_code, weight, unit, department, 
          description, min_value, max_value, higher_is_better, target_value
        )
      `)
      .eq('org_id', orgId)
      .order('metric_date', { ascending: false })
      .limit(limit);

    if (department) query = query.eq('department', department);
    if (startDate) query = query.gte('metric_date', startDate);
    if (endDate) query = query.lte('metric_date', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar entries COPC:', error);
      return NextResponse.json({ error: 'Erro ao buscar entries' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/v1/php/copc/entries
 * Cria entrada(s) de métricas — aceita objeto único ou array
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id obrigatório' }, { status: 400 });

    const body = await request.json();
    const entries = Array.isArray(body) ? body : [body];

    if (entries.length === 0) {
      return NextResponse.json({ error: 'Envie pelo menos uma entrada' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar catalog_metric_ids
    const catalogIds = [...new Set(entries.map(e => e.catalog_metric_id))];
    const { data: catalogMetrics, error: catError } = await supabase
      .from('copc_metrics_catalog')
      .select('id, metric_code, min_value, max_value')
      .in('id', catalogIds);

    if (catError || !catalogMetrics) {
      return NextResponse.json({ error: 'Erro ao validar catálogo' }, { status: 500 });
    }

    const validIds = new Set(catalogMetrics.map(c => c.id));
    const invalidEntries = entries.filter(e => !validIds.has(e.catalog_metric_id));
    if (invalidEntries.length > 0) {
      return NextResponse.json({ 
        error: `catalog_metric_id inválido(s): ${invalidEntries.map(e => e.catalog_metric_id).join(', ')}` 
      }, { status: 400 });
    }

    // Preparar records
    const records = entries.map(e => ({
      org_id: orgId,
      catalog_metric_id: e.catalog_metric_id,
      team_id: e.team_id || null,
      user_id: e.user_id || null,
      department: e.department || null,
      metric_date: e.metric_date || new Date().toISOString().split('T')[0],
      value: e.value,
      notes: e.notes || null,
      source: e.source || 'manual',
      created_by: user.id,
    }));

    const { data, error } = await supabase
      .from('copc_metric_entries')
      .insert(records)
      .select(`
        *,
        catalog:copc_metrics_catalog(metric_name, metric_code, category, unit)
      `);

    if (error) {
      console.error('Erro ao criar entries COPC:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      created: data?.length || 0,
      entries: data,
    }, { status: 201 });
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
