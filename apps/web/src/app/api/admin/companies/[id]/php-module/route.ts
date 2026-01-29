import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function ensureAdmin() {
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  
  // Verificar se é admin (temporário - ajustar conforme sistema de auth)
  return { admin: adminClient, error: null };
}

/**
 * POST /api/admin/companies/[id]/php-module
 * Ativa o módulo PHP para uma organização
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { admin, error: adminError } = await ensureAdmin();
    if (adminError) return adminError;

    // Verificar se já existe
    const { data: existing } = await admin
      .from('php_module_activations')
      .select('*')
      .eq('org_id', id)
      .single();

    if (existing) {
      // Atualizar para ativo
      const { data, error } = await admin
        .from('php_module_activations')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('org_id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar módulo PHP:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, activation: data });
    }

    // Criar nova ativação com pesos padrão (conforme arquitetura canônica)
    const { data, error } = await admin
      .from('php_module_activations')
      .insert({
        org_id: id,
        is_active: true,
        activation_plan: 'full',
        settings: {
          weights: {
            tfci: 30,
            nr1: 40,
            copc: 30,
          },
        },
        activated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao ativar módulo PHP:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, activation: data });
  } catch (error: any) {
    console.error('Erro no POST /api/admin/companies/[id]/php-module:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/companies/[id]/php-module
 * Desativa o módulo PHP para uma organização
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { admin, error: adminError } = await ensureAdmin();
    if (adminError) return adminError;

    // Desativar (não deletar - manter histórico)
    const { data, error } = await admin
      .from('php_module_activations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('org_id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao desativar módulo PHP:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, activation: data });
  } catch (error: any) {
    console.error('Erro no DELETE /api/admin/companies/[id]/php-module:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
