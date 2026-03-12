import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser, validateOrgMembership } from '@/lib/api/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/v1/recruitment/status
 * Retorna o status de ativação do módulo de Recrutamento para a organização atual.
 * Mesmo padrão de /api/v1/php/status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const orgId = request.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!(await validateOrgMembership(supabase, user.id, orgId))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    const { data: activation, error } = await supabase
      .from('recruitment_module_activations')
      .select('is_active, activated_at, settings, created_at')
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar status Recrutamento:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar status do módulo de Recrutamento' },
        { status: 500 }
      );
    }

    if (!activation) {
      return NextResponse.json({
        is_active: false,
        activated_at: null,
        settings: {},
      });
    }

    return NextResponse.json({
      is_active: activation.is_active,
      activated_at: activation.activated_at,
      settings: activation.settings,
    });
  } catch (error: any) {
    console.error('Erro no GET /api/v1/recruitment/status:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
