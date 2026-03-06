import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/v1/php/status
 * Retorna o status de ativação do módulo PHP para a organização atual
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Pegar org_id dos headers (enviado pelo middleware/guard)
    const orgId = request.headers.get('x-org-id');

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      );
    }

    // Buscar status do módulo PHP
    const { data: activation, error } = await supabase
      .from('php_module_activations')
      .select('is_active, activation_plan, activated_at, settings, created_at')
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar status PHP:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar status do módulo PHP' },
        { status: 500 }
      );
    }

    // Se não existir registro, módulo está inativo
    if (!activation) {
      return NextResponse.json({
        is_active: false,
        activation_plan: null,
        activated_at: null,
        settings: {},
      });
    }

    return NextResponse.json({
      is_active: activation.is_active,
      activation_plan: activation.activation_plan,
      activated_at: activation.activated_at,
      settings: activation.settings,
    });
  } catch (error: any) {
    console.error('Erro no GET /api/v1/php/status:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
