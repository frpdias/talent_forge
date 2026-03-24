import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/**
 * GET /api/candidate/it-test
 * Retorna a atribuição (e resultado, se concluído) do IT Test do candidato logado.
 * O candidato é identificado pelo JWT — resolve user_id → candidates.id.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const sb = adminClient();
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  // 1. Encontrar o candidato pelo user_id
  const { data: candidate } = await sb
    .from('candidates')
    .select('id, email')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!candidate) {
    // Fallback: buscar pelo e-mail do auth user
    const { data: byEmail } = await sb
      .from('candidates')
      .select('id, email')
      .ilike('email', user.email ?? '')
      .maybeSingle();

    if (!byEmail) {
      return NextResponse.json({ assignment: null, result: null });
    }

    return fetchAssignment(sb, byEmail.id);
  }

  return fetchAssignment(sb, candidate.id);
}

async function fetchAssignment(sb: ReturnType<typeof adminClient>, candidateId: string) {
  // 2. Buscar atribuição mais recente
  const { data: assignment } = await sb
    .from('it_test_assignments')
    .select('id, nivel, token, assigned_at, org_id')
    .eq('candidate_id', candidateId)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!assignment) {
    return NextResponse.json({ assignment: null, result: null });
  }

  // 3. Buscar resultado
  const { data: result } = await sb
    .from('it_test_results')
    .select('score, total_questions, correct_answers, nivel, completed_at')
    .eq('assignment_id', assignment.id)
    .maybeSingle();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return NextResponse.json({
    assignment: {
      id:          assignment.id,
      nivel:       assignment.nivel,
      assigned_at: assignment.assigned_at,
      token:       assignment.token,
      link:        `${baseUrl}/it-test/${assignment.token}`,
    },
    result: result ?? null,
  });
}
