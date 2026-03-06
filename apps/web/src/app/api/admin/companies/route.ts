import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

async function ensureAdmin() {
  const supabase = await createServerClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', session.user.id)
    .single();

  const userType = profile?.user_type || (session.user.user_metadata as any)?.user_type;

  if (profileError || !userType || userType !== 'admin') {
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

export async function GET(request: Request) {
  try {
    const { admin, error: adminError } = await ensureAdmin();
    if (adminError) return adminError;

    // Buscar todas as empresas (agora em organizations)
    const { data: companies, error } = await admin
      .from('organizations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar empresas:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar empresas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ companies: companies || [] });
  } catch (error: any) {
    console.error('Erro no endpoint /api/admin/companies:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { admin, error: adminError } = await ensureAdmin();
    if (adminError) return adminError;

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
    } = body;

    // Validações
    if (!name || !cnpj || !email) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, cnpj, email' },
        { status: 400 }
      );
    }

    // Inserir empresa (agora em organizations)
    const { data: company, error } = await admin
      .from('organizations')
      .insert({
        name,
        org_type: 'company',
        cnpj,
        email,
        phone: phone || null,
        website: website || null,
        address: address || null,
        city: city || null,
        state: state || null,
        industry: industry || null,
        size: size || 'small',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar empresa:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao criar empresa' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    console.error('Erro no POST /api/admin/companies:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
