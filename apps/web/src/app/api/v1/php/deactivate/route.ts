import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/v1/php/deactivate
 * Desativa o módulo PHP para uma organização.
 * RESTRITO: apenas admins Fartech (user_type = 'admin') podem desativar.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação
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

    // Verificar se é admin Fartech
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado — apenas admins Fartech podem desativar o módulo PHP' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const orgId = body.org_id;

    if (!orgId) {
      return NextResponse.json(
        { error: 'org_id é obrigatório' },
        { status: 400 }
      );
    }

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
