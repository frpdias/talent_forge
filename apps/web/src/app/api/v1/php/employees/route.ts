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
 * Resolve ou cria um auth user para o email informado.
 * Retorna o user_id (UUID do auth.users) ou null se não houver email.
 *
 * Estratégia:
 * 1. Verifica se já existe auth user com este email via user_profiles
 * 2. Se não existir, cria auth user confirmado via admin API (sem envio de email)
 *    O funcionário poderá acessar via "Esqueci a senha" quando necessário.
 */
async function resolveAuthUserId(supabase: ReturnType<typeof createClient>, email: string): Promise<string | null> {
  // 1. Busca user_id existente por email em user_profiles
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (profile?.id) return (profile as { id: string }).id;

  // 2. Cria auth user sem envio de email (email_confirm: true = conta ativa sem verificação)
  //    O acesso real é estabelecido pelo funcionário via link de recuperação de senha.
  const { data: created, error } = await supabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    email_confirm: true,
    user_metadata: { source: 'php_employee_import' },
  });

  if (error) {
    // Se o email já existe no auth mas não tem user_profile, tenta listar
    if (error.message?.includes('already been registered')) {
      console.warn('[employees] Email já registrado no auth, buscando user_id via admin API');
      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = list?.users?.find((u: any) => u.email === email.toLowerCase().trim());
      return found?.id || null;
    }
    console.error('[employees] Erro ao criar auth user:', error.message);
    return null; // Não bloqueia criação do employee
  }

  return created?.user?.id || null;
}

/**
 * POST /api/v1/php/employees
 * Cadastra novo funcionário.
 * Se o campo email for fornecido, automaticamente cria/vincula um auth user
 * para que o funcionário possa ser adicionado a times e acessar self-assessments.
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

    // Resolve user_id via auth se email fornecido (e user_id ainda não definido no body)
    let authUserId: string | null = body.user_id || null;
    if (!authUserId && body.email) {
      authUserId = await resolveAuthUserId(supabase, body.email);
    }

    const { data, error } = await supabase
      .from('employees')
      .insert({
        organization_id: orgId,
        ...body,
        user_id: authUserId, // garante que user_id fica preenchido quando há email
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
