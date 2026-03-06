import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * GET /api/v1/php/nr1/invitations/token/[token]
 * Valida um token de convite (acesso público para colaboradores)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    const supabase = getSupabase();
    const { data: invitation, error } = await supabase
      .from('nr1_assessment_invitations')
      .select(`
        id, org_id, employee_id, status, invited_at, expires_at,
        organizational_assessment_id
      `)
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ valid: false, message: 'Token inválido ou não encontrado' }, { status: 404 });
    }

    // Verificar se expirou
    if (new Date(invitation.expires_at) < new Date()) {
      // Atualizar status para expirado
      await supabase
        .from('nr1_assessment_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json({ valid: false, message: 'Este convite expirou' }, { status: 410 });
    }

    // Verificar se já foi completado
    if (invitation.status === 'completed') {
      return NextResponse.json({ valid: false, message: 'Esta avaliação já foi respondida' }, { status: 409 });
    }

    if (invitation.status === 'expired') {
      return NextResponse.json({ valid: false, message: 'Este convite expirou' }, { status: 410 });
    }

    // Buscar dados do funcionário
    const { data: employee } = await supabase
      .from('employees')
      .select('id, full_name, position, department, organization_id')
      .eq('id', invitation.employee_id)
      .single();

    // Marcar como aceito se ainda pendente
    if (invitation.status === 'pending') {
      await supabase
        .from('nr1_assessment_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.id,
        org_id: invitation.org_id,
        employee_id: invitation.employee_id,
        organizational_assessment_id: invitation.organizational_assessment_id,
        employee: employee ? {
          full_name: employee.full_name,
          position: employee.position,
          department: employee.department,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Erro ao validar token:', error);
    return NextResponse.json({ valid: false, message: 'Erro interno' }, { status: 500 });
  }
}
