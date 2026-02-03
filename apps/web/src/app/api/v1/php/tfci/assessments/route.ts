import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/v1/php/tfci/assessments
 * Cria avaliações TFCI
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

    const body = await request.json();

    // Criar avaliações
    const { data: assessments, error } = await supabase
      .from('tfci_peer_assessments')
      .insert(body.assessments.map((assessment: any) => ({
        ...assessment,
        assessor_id: user.id,
      })))
      .select();

    if (error) {
      console.error('Erro ao criar avaliações TFCI:', error);
      return NextResponse.json(
        { error: 'Erro ao criar avaliações TFCI' },
        { status: 500 }
      );
    }

    return NextResponse.json(assessments, { status: 201 });
  } catch (error: any) {
    console.error('Erro no POST /api/v1/php/tfci/assessments:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
