import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/v1/php/tfci/cycles/[id]/heatmap
 * Retorna dados do heatmap de um ciclo TFCI
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    // Buscar dados do heatmap usando RPC
    const { data: heatmapData, error } = await supabase
      .rpc('tfci_get_cycle_heatmap', {
        p_cycle_id: id
      });

    if (error) {
      console.error('Erro ao buscar heatmap TFCI:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar heatmap TFCI' },
        { status: 500 }
      );
    }

    return NextResponse.json(heatmapData || []);
  } catch (error: any) {
    console.error('Erro no GET /api/v1/php/tfci/cycles/[id]/heatmap:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
