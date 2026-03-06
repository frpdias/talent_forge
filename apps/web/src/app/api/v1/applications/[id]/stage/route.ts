import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  return user;
}

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/v1/applications/:id/stage
 * Move candidatura para outra fase do pipeline.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const { id } = await params;
    const body = await request.json();
    const { toStageId, status, note } = body;

    if (!toStageId) {
      return NextResponse.json({ error: 'toStageId é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Busca candidatura atual (valida que pertence à org via jobs!inner)
    const { data: current, error: fetchError } = await supabase
      .from('applications')
      .select('id, current_stage_id, status, jobs!inner (org_id)')
      .eq('id', id)
      .eq('jobs.org_id', orgId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Candidatura não encontrada' }, { status: 404 });
    }

    const { error } = await supabase
      .from('applications')
      .update({
        current_stage_id: toStageId,
        status: status || current.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[applications/stage] PATCH error:', error);
      return NextResponse.json({ error: 'Erro ao atualizar fase' }, { status: 500 });
    }

    // Registra evento de movimentação
    await supabase.from('application_events').insert({
      application_id: id,
      from_stage_id: current.current_stage_id,
      to_stage_id: toStageId,
      status: status || current.status,
      note: note || null,
      actor_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
