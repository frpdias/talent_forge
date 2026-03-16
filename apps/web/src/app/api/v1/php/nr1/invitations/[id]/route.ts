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
 * DELETE /api/v1/php/nr1/invitations/[id]
 * Cancela/remove um convite
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const orgId = request.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Valida que o convite pertence à org do usuário antes de deletar
    const { data: invitation } = await supabase
      .from('nr1_assessment_invitations')
      .select('id, org_id')
      .eq('id', id)
      .eq('org_id', orgId)
      .maybeSingle();

    if (!invitation) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
    }

    const { error } = await supabase
      .from('nr1_assessment_invitations')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) {
      console.error('Erro ao cancelar convite:', error);
      return NextResponse.json({ error: 'Erro ao cancelar convite' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
