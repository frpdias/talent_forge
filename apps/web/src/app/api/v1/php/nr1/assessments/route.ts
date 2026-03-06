import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  return user;
}

/**
 * GET /api/v1/php/nr1/assessments
 * Lista avaliações NR-1 da organização
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!orgId) {
      return NextResponse.json({ error: 'org_id é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('nr1_risk_assessments')
      .select('*')
      .eq('org_id', orgId)
      .order('assessment_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar NR-1:', error);
      return NextResponse.json({ error: 'Erro ao buscar avaliações NR-1' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/v1/php/nr1/assessments
 * Cria nova avaliação NR-1
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const orgId = request.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });
    }

    const body = await request.json();
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('nr1_risk_assessments')
      .insert({
        org_id: orgId,
        assessed_by: user.id,
        ...body,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar NR-1:', error);
      return NextResponse.json({ error: 'Erro ao criar avaliação NR-1' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
