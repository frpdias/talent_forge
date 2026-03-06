import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/v1/php/tfci/cycles
 * Lista todos os ciclos TFCI da organização
 */
export async function GET(request: NextRequest) {
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

    // Buscar ciclos TFCI
    const { data: cycles, error } = await supabase
      .from('tfci_cycles')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar ciclos TFCI:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar ciclos TFCI' },
        { status: 500 }
      );
    }

    return NextResponse.json(cycles || []);
  } catch (error: any) {
    console.error('Erro no GET /api/v1/php/tfci/cycles:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/php/tfci/cycles
 * Cria um novo ciclo TFCI
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
    const body = await request.json();

    // Criar ciclo TFCI
    const { data: cycle, error } = await supabase
      .from('tfci_cycles')
      .insert({
        org_id: orgId,
        name: body.name,
        description: body.description,
        start_date: body.start_date,
        end_date: body.end_date,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar ciclo TFCI:', error);
      return NextResponse.json(
        { error: 'Erro ao criar ciclo TFCI' },
        { status: 500 }
      );
    }

    return NextResponse.json(cycle, { status: 201 });
  } catch (error: any) {
    console.error('Erro no POST /api/v1/php/tfci/cycles:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
