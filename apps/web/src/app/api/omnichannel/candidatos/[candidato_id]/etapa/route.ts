import { NextRequest, NextResponse } from 'next/server';
import { validateOmnichannelRequest, checkPermission } from '@/lib/api/omnichannel-auth';
import { getServiceSupabase } from '@/lib/api/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ candidato_id: string }> }
) {
  const auth = await validateOmnichannelRequest(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!checkPermission(auth.context.role, 'POST /candidatos/etapa')) {
    return NextResponse.json(
      { error: 'Permissão negada — requer papel gestor ou admin' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 });

  const { vaga_id, decisao, observacao } = body;
  if (!vaga_id || !decisao) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: vaga_id, decisao (aprovado|reprovado)' },
      { status: 400 }
    );
  }
  if (!['aprovado', 'reprovado'].includes(decisao)) {
    return NextResponse.json(
      { error: 'decisao deve ser: aprovado ou reprovado' },
      { status: 400 }
    );
  }

  const { orgId } = auth.context;
  const { candidato_id } = await params;
  const supabase = getServiceSupabase();

  const { data: application } = await supabase
    .from('applications')
    .select('id, current_stage_id, job_id, jobs!inner(org_id)')
    .eq('candidate_id', candidato_id)
    .eq('job_id', vaga_id)
    .eq('jobs.org_id', orgId)
    .maybeSingle();

  if (!application) {
    return NextResponse.json(
      { error: 'Candidatura não encontrada nesta organização' },
      { status: 404 }
    );
  }

  let update: Record<string, unknown>;

  if (decisao === 'reprovado') {
    update = { status: 'rejected', updated_at: new Date().toISOString() };
  } else {
    const { data: currentStage } = await supabase
      .from('pipeline_stages')
      .select('position')
      .eq('id', application.current_stage_id)
      .maybeSingle();

    const { data: nextStage } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('job_id', vaga_id)
      .eq('position', (currentStage?.position ?? 0) + 1)
      .maybeSingle();

    update = nextStage
      ? { current_stage_id: nextStage.id, status: 'in_process', updated_at: new Date().toISOString() }
      : { status: 'hired', updated_at: new Date().toISOString() };
  }

  if (observacao) {
    await supabase.from('application_events').insert({
      application_id: application.id,
      from_stage_id: application.current_stage_id,
      to_stage_id: (update.current_stage_id as string) ?? null,
      status: update.status as string,
      note: observacao,
    });
  }

  const { data, error } = await supabase
    .from('applications')
    .update(update)
    .eq('id', application.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Erro ao atualizar etapa' }, { status: 500 });

  return NextResponse.json({ application: data });
}
