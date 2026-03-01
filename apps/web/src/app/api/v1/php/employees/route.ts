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
 * GET /api/v1/php/employees
 * Lista funcionários de uma organização
 * Query params: organization_id (obrigatório), status (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id') || request.headers.get('x-org-id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (!orgId) {
      return NextResponse.json({ error: 'organization_id é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabase();
    let query = supabase
      .from('employees')
      .select('id, full_name, cpf, email, phone, position, department, hire_date, status, manager_id, created_at')
      .eq('organization_id', orgId)
      .order('full_name', { ascending: true });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,cpf.ilike.%${search}%,position.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar funcionários:', error);
      return NextResponse.json({ error: 'Erro ao buscar funcionários' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/v1/php/employees
 * Cadastra novo funcionário
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
      .from('employees')
      .insert({
        organization_id: orgId,
        ...body,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar funcionário:', error);
      return NextResponse.json({ error: 'Erro ao criar funcionário' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
