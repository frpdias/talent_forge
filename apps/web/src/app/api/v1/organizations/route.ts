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
 * GET /api/v1/organizations
 * Lista organizações filhas de parent_org_id (empresas de um headhunter/recrutador)
 * Query params: parent_org_id (obrigatório)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parentOrgId = searchParams.get('parent_org_id');

    if (!parentOrgId) {
      return NextResponse.json({ error: 'parent_org_id é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verificar que o usuário é membro da org pai
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', parentOrgId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    // Buscar companies filhas
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, org_type, slug, cnpj, email, phone, website, address, city, state, industry, size, parent_org_id, created_at, updated_at')
      .eq('parent_org_id', parentOrgId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar organizações:', error);
      return NextResponse.json({ error: 'Erro ao buscar organizações' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Erro interno:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/v1/organizations
 * Cria nova organização (empresa cliente) vinculada a um parent_org_id
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      cnpj,
      email,
      phone,
      website,
      address,
      city,
      state,
      industry,
      size,
      parentOrgId,
      orgType = 'company',
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verificar permissão no parent_org
    if (parentOrgId) {
      const { data: membership } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', parentOrgId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
      }
    }

    // Criar organização
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        org_type: orgType,
        cnpj: cnpj || null,
        email: email || null,
        phone: phone || null,
        website: website || null,
        address: address || null,
        city: city || null,
        state: state || null,
        industry: industry || null,
        size: size || null,
        parent_org_id: parentOrgId || null,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Erro ao criar organização:', orgError);
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }

    // Adicionar o criador como admin da nova org
    const { error: memberError } = await supabase
      .from('org_members')
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: 'admin',
      });

    if (memberError) {
      console.error('Erro ao adicionar membro:', memberError);
      // Org foi criada, retornar mesmo assim
    }

    return NextResponse.json(org, { status: 201 });
  } catch (err) {
    console.error('Erro interno:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
