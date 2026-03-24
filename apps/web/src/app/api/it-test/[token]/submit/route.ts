import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/it-test/[token]/submit
 * Submete as respostas do candidato e calcula o score.
 * Body: { answers: { [question_id: string]: "A"|"B"|"C"|"D" } }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  let body: { answers: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  if (!body.answers || typeof body.answers !== 'object') {
    return NextResponse.json({ error: 'Campo "answers" obrigatório.' }, { status: 400 });
  }

  const sb = adminClient();

  // 1. Buscar atribuição pelo token
  const { data: assignment, error: aErr } = await sb
    .from('it_test_assignments')
    .select('id, candidate_id, org_id, nivel')
    .eq('token', token)
    .maybeSingle();

  if (aErr || !assignment) {
    return NextResponse.json({ error: 'Teste não encontrado ou link inválido.' }, { status: 404 });
  }

  // 2. Impedir submissão dupla
  const { data: existing } = await sb
    .from('it_test_results')
    .select('id')
    .eq('assignment_id', assignment.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Este teste já foi respondido.' }, { status: 409 });
  }

  // 3. Buscar gabarito do nível
  const { data: questions, error: qErr } = await sb
    .from('it_test_questions')
    .select('id, resposta')
    .eq('nivel', assignment.nivel);

  if (qErr || !questions) {
    return NextResponse.json({ error: 'Erro ao buscar gabarito.' }, { status: 500 });
  }

  // 4. Calcular acertos
  let correct_answers = 0;
  for (const q of questions) {
    if (body.answers[q.id]?.toUpperCase() === q.resposta) {
      correct_answers++;
    }
  }
  const total_questions = questions.length;

  // 5. Salvar resultado
  const { data: result, error: rErr } = await sb
    .from('it_test_results')
    .insert({
      assignment_id:   assignment.id,
      candidate_id:    assignment.candidate_id,
      org_id:          assignment.org_id,
      nivel:           assignment.nivel,
      total_questions,
      correct_answers,
      answers:         body.answers,
    })
    .select('id, score, total_questions, correct_answers, nivel, completed_at')
    .single();

  if (rErr || !result) {
    console.error('[it-test/submit] rErr:', rErr);
    return NextResponse.json({ error: 'Erro ao salvar resultado.' }, { status: 500 });
  }

  // 6. Atualizar score_testes em candidate_technical_reviews (se existir registro)
  await sb
    .from('candidate_technical_reviews')
    .update({ score_testes: result.score })
    .eq('candidate_id', assignment.candidate_id)
    .eq('org_id', assignment.org_id);

  return NextResponse.json({
    score:           result.score,
    correct_answers: result.correct_answers,
    total_questions: result.total_questions,
    nivel:           result.nivel,
    completed_at:    result.completed_at,
  });
}
