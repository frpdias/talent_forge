import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/v1/php/copc/dashboard/[orgId]
 * Retorna dados do dashboard COPC
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    
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

    // Buscar métricas COPC
    const { data: metrics, error } = await supabase
      .rpc('copc_get_dashboard_metrics', {
        p_org_id: orgId,
        p_period: period
      });

    if (error) {
      console.error('Erro ao buscar métricas COPC:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar métricas COPC' },
        { status: 500 }
      );
    }

    return NextResponse.json(metrics || {});
  } catch (error: any) {
    console.error('Erro no GET /api/v1/php/copc/dashboard/[orgId]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
