import { NextRequest, NextResponse } from 'next/server';
import { validateOmnichannelRequest, checkPermission } from '@/lib/api/omnichannel-auth';
import { getServiceSupabase } from '@/lib/api/auth';

const TIPO_MAP: Record<string, string> = {
  presencial: 'presencial',
  video: 'video',
  telefone: 'phone',
};

export async function POST(request: NextRequest) {
  const auth = await validateOmnichannelRequest(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!checkPermission(auth.context.role, 'POST /entrevistas')) {
    return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 });

  const { candidato_id, vaga_id, data_hora, formato, link } = body;
  if (!candidato_id || !vaga_id || !data_hora || !formato) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: candidato_id, vaga_id, data_hora, formato' },
      { status: 400 }
    );
  }

  const tipo = TIPO_MAP[formato];
  if (!tipo) {
    return NextResponse.json(
      { error: 'formato deve ser: presencial, video ou telefone' },
      { status: 400 }
    );
  }

  const { orgId } = auth.context;
  const supabase = getServiceSupabase();

  const { data: job } = await supabase
    .from('jobs')
    .select('id')
    .eq('id', vaga_id)
    .eq('org_id', orgId)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: 'Vaga não encontrada nesta organização' }, { status: 404 });
  }

  const { data: application } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', vaga_id)
    .eq('candidate_id', candidato_id)
    .maybeSingle();

  const { data, error } = await supabase
    .from('interviews')
    .insert({
      org_id: orgId,
      candidate_id: candidato_id,
      job_id: vaga_id,
      application_id: application?.id ?? null,
      title: `Entrevista — ${tipo}`,
      scheduled_at: data_hora,
      type: tipo,
      meet_link: link ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Erro ao agendar entrevista' }, { status: 500 });

  return NextResponse.json({ entrevista: data }, { status: 201 });
}
