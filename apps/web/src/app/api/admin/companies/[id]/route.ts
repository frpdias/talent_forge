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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Atualizar empresa (agora em organizations)
    const { data: company, error } = await admin
      .from('organizations')
      .update({
        name,
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
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar empresa:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao atualizar empresa' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    console.error('Erro no PATCH /api/admin/companies/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { admin, error: adminError } = await ensureAdmin();
    if (adminError) return adminError;

    // Deletar empresa (agora em organizations)
    const { error } = await admin
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar empresa:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao deletar empresa' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro no DELETE /api/admin/companies/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
