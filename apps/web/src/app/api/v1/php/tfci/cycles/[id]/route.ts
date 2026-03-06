import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/v1/php/tfci/cycles/[id]
 * Retorna detalhes de um ciclo TFCI específico
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

    // Buscar ciclo TFCI
    const { data: cycle, error } = await supabase
      .from('tfci_cycles')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgMember.org_id)
      .single();

    if (error || !cycle) {
      return NextResponse.json(
        { error: 'Ciclo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(cycle);
  } catch (error: any) {
    console.error('Erro no GET /api/v1/php/tfci/cycles/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/php/tfci/cycles/[id]
 * Remove um ciclo TFCI
 */
export async function DELETE(
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

    // Deletar ciclo TFCI
    const { error } = await supabase
      .from('tfci_cycles')
      .delete()
      .eq('id', id)
      .eq('org_id', orgMember.org_id);

    if (error) {
      console.error('Erro ao deletar ciclo TFCI:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar ciclo TFCI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro no DELETE /api/v1/php/tfci/cycles/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/php/tfci/cycles/[id]
 * Atualiza um ciclo TFCI (nome, datas, status)
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const orgId = request.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });
    }

    const body = await request.json();

    // Validar transições de status permitidas
    if (body.status) {
      const { data: currentCycle } = await supabase
        .from('tfci_cycles')
        .select('status')
        .eq('id', id)
        .eq('org_id', orgId)
        .single();

      if (!currentCycle) {
        return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 });
      }

      const validTransitions: Record<string, string[]> = {
        draft: ['active', 'cancelled'],
        active: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
      };

      const allowed = validTransitions[currentCycle.status] || [];
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `Transição de "${currentCycle.status}" para "${body.status}" não é permitida` },
          { status: 400 }
        );
      }
    }

    // Montar update parcial
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.end_date !== undefined) updateData.end_date = body.end_date;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.description !== undefined) updateData.description = body.description;

    const { data: cycle, error } = await supabase
      .from('tfci_cycles')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !cycle) {
      console.error('Erro ao atualizar ciclo TFCI:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar ciclo TFCI' },
        { status: 500 }
      );
    }

    return NextResponse.json(cycle);
  } catch (error: any) {
    console.error('Erro no PUT /api/v1/php/tfci/cycles/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
