import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * GET /api/it-test/[token]
 * Retorna os dados da atribuição + questões para o candidato fazer o teste.
 * Acesso público (sem login) — autenticado apenas via token único.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const sb = adminClient();

  // 1. Buscar atribuição pelo token
  const { data: assignment, error: aErr } = await sb
    .from('it_test_assignments')
    .select('id, candidate_id, org_id, nivel, assigned_at')
    .eq('token', token)
    .maybeSingle();

  if (aErr || !assignment) {
    return NextResponse.json({ error: 'Teste não encontrado ou link inválido.' }, { status: 404 });
  }

  // 2. Verificar se já existe resultado
  const { data: existing } = await sb
    .from('it_test_results')
    .select('id, score, nivel, completed_at')
    .eq('assignment_id', assignment.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      already_completed: true,
      score: existing.score,
      nivel: existing.nivel,
      completed_at: existing.completed_at,
    });
  }

  // 3. Buscar nome do candidato
  const { data: candidate } = await sb
    .from('candidates')
    .select('full_name')
    .eq('id', assignment.candidate_id)
    .maybeSingle();

  // 4. Buscar nome da organização
  const { data: org } = await sb
    .from('organizations')
    .select('name')
    .eq('id', assignment.org_id)
    .maybeSingle();

  // 5. Buscar questões do nível
  const { data: questions, error: qErr } = await sb
    .from('it_test_questions')
    .select('id, categoria, pergunta, alternativa_a, alternativa_b, alternativa_c, alternativa_d')
    .eq('nivel', assignment.nivel)
    .order('display_order', { ascending: true });

  if (qErr || !questions) {
    return NextResponse.json({ error: 'Erro ao carregar questões.' }, { status: 500 });
  }

  return NextResponse.json({
    assignment_id:  assignment.id,
    nivel:          assignment.nivel,
    candidate_name: candidate?.full_name ?? 'Candidato',
    org_name:       org?.name ?? 'Empresa',
    total_questions: questions.length,
    questions,
  });
}
