import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/v1/php/deactivate
 * Desativa o módulo PHP para a organização
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar org_id do usuário autenticado
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Buscar organization do usuário
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!orgMember?.org_id) {
      return NextResponse.json(
        { error: 'Usuário não pertence a nenhuma organização' },
        { status: 403 }
      );
    }

    const orgId = orgMember.org_id;

    // Desativar módulo PHP
    const { data: activation, error } = await supabase
      .from('php_module_activations')
      .update({
        is_active: false,
      })
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao desativar módulo PHP:', error);
      return NextResponse.json(
        { error: 'Erro ao desativar módulo PHP' },
        { status: 500 }
      );
    }

    return NextResponse.json(activation);
  } catch (error: any) {
    console.error('Erro no POST /api/v1/php/deactivate:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
