import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const companyId = id;

    // Verificar se a empresa existe e se o usuário tem permissão
    const { data: company, error: companyError } = await supabase
      .from('organizations')
      .select('id, name, parent_org_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o usuário é membro da organização pai (Fartech)
    const { data: membership } = await supabase
      .from('org_members')
      .select('role, org_id')
      .eq('user_id', session.user.id)
      .eq('org_id', company.parent_org_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Você não tem permissão para ativar o módulo PHP nesta empresa' },
        { status: 403 }
      );
    }

    // Ativar o módulo PHP (adicionar coluna php_module_active = true)
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ 
        php_module_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('Error activating PHP module:', updateError);
      return NextResponse.json(
        { error: 'Erro ao ativar módulo PHP' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Módulo PHP ativado com sucesso',
      companyId,
      companyName: company.name
    });

  } catch (error) {
    console.error('Error in activate-php route:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
