import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function ensureAdmin() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { admin: null, error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
  }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', session.user.id)
    .single();
  if (!profile || profile.user_type !== 'admin') {
    return { admin: null, error: NextResponse.json({ error: 'Acesso negado — apenas admins Fartech podem gerenciar módulos' }, { status: 403 }) };
  }
  return { admin: getAdminClient(), error: null as null };
}

/**
 * POST /api/admin/companies/[id]/recruitment-module
 * Ativa o módulo de Recrutamento para uma organização.
 * Mesmo padrão de /api/admin/companies/[id]/php-module
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    const { admin, error: adminError } = await ensureAdmin();
    if (adminError) return adminError;

    const { data: existing } = await admin
      .from('recruitment_module_activations')
      .select('id')
      .eq('org_id', orgId)
      .single();

    if (existing) {
      const { data, error } = await admin
        .from('recruitment_module_activations')
        .update({ is_active: true, activated_at: new Date().toISOString(), deactivated_at: null, updated_at: new Date().toISOString() })
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao ativar módulo Recrutamento:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, activation: data });
    }

    const { data, error } = await admin
      .from('recruitment_module_activations')
      .insert({
        org_id: orgId,
        is_active: true,
        activated_at: new Date().toISOString(),
        settings: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar ativação do módulo Recrutamento:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, activation: data });
  } catch (error: any) {
    console.error('Erro no POST /api/admin/companies/[id]/recruitment-module:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/companies/[id]/recruitment-module
 * Desativa o módulo de Recrutamento para uma organização.
 * Mantém o registro (histórico) — apenas seta is_active = false.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    const { admin, error: adminError } = await ensureAdmin();
    if (adminError) return adminError;

    const { data, error } = await admin
      .from('recruitment_module_activations')
      .update({ is_active: false, deactivated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao desativar módulo Recrutamento:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, activation: data });
  } catch (error: any) {
    console.error('Erro no DELETE /api/admin/companies/[id]/recruitment-module:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
