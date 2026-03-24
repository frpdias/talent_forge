import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * GET /api/recruiter/candidates/[id]/it-test
 * Retorna a atribuição e resultado do IT Test do candidato.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: candidateId } = await params;

  const authHeader = req.headers.get('authorization');
  const orgId      = req.headers.get('x-org-id');
  if (!authHeader || !orgId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const sb    = adminClient();
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const { data: member } = await sb
    .from('org_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  // Resolver todos os IDs de candidato com o mesmo email (duplicatas)
  // para garantir que achamos o resultado correto independente da org em que foi feito
  const { data: candidateRow } = await sb
    .from('candidates')
    .select('id, email')
    .eq('id', candidateId)
    .maybeSingle();

  const candidateIds = new Set<string>([candidateId]);

  if (candidateRow?.email) {
    const { data: dupes } = await sb
      .from('candidates')
      .select('id')
      .ilike('email', candidateRow.email)
      .limit(20);
    (dupes ?? []).forEach((r) => candidateIds.add(r.id));
  }

  // Buscar atribuição do candidato NA ORG DO RECRUTADOR (para exibir o link correto)
  const { data: orgAssignment } = await sb
    .from('it_test_assignments')
    .select('id, nivel, token, assigned_at')
    .in('candidate_id', Array.from(candidateIds))
    .eq('org_id', orgId)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!orgAssignment) {
    return NextResponse.json({ assignment: null, result: null });
  }

  // Buscar resultado em QUALQUER assignment dos candidatos com o mesmo email
  // (o candidato pode ter feito o teste via outro registro duplicado / outra org)
  const { data: allAssignments } = await sb
    .from('it_test_assignments')
    .select('id')
    .in('candidate_id', Array.from(candidateIds));

  const allAssignmentIds = (allAssignments ?? []).map((a) => a.id);

  const { data: result } = await sb
    .from('it_test_results')
    .select('score, total_questions, correct_answers, nivel, completed_at')
    .in('assignment_id', allAssignmentIds)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://web-eight-rho-84.vercel.app';

  return NextResponse.json({
    assignment: {
      id:          orgAssignment.id,
      nivel:       orgAssignment.nivel,
      assigned_at: orgAssignment.assigned_at,
      link:        `${baseUrl}/it-test/${orgAssignment.token}`,
    },
    result: result ?? null,
  });
}

/**
 * POST /api/recruiter/candidates/[id]/it-test
 * Atribui (ou substitui) um nível de teste ao candidato.
 * Body: { nivel: "junior" | "pleno" | "senior" }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: candidateId } = await params;

  const authHeader = req.headers.get('authorization');
  const orgId      = req.headers.get('x-org-id');
  if (!authHeader || !orgId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  let body: { nivel: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  if (!['junior', 'pleno', 'senior'].includes(body.nivel)) {
    return NextResponse.json({ error: 'Nível inválido. Use: junior, pleno ou senior.' }, { status: 400 });
  }

  const sb    = adminClient();
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const { data: member } = await sb
    .from('org_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  // Verificar se candidato pertence à org (campo owner_org_id na tabela candidates)
  const { data: candidate } = await sb
    .from('candidates')
    .select('id, full_name')
    .eq('id', candidateId)
    .eq('owner_org_id', orgId)
    .maybeSingle();
  if (!candidate) {
    return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 });
  }

  // Upsert atribuição (substitui nivel e regenera token se mudar)
  const newToken = crypto.randomUUID();

  const { data: assignment, error: uErr } = await sb
    .from('it_test_assignments')
    .upsert(
      {
        candidate_id: candidateId,
        org_id:       orgId,
        nivel:        body.nivel,
        assigned_by:  user.id,
        token:        newToken,
        assigned_at:  new Date().toISOString(),
      },
      { onConflict: 'candidate_id,org_id' },
    )
    .select('id, nivel, token, assigned_at')
    .single();

  if (uErr || !assignment) {
    console.error('[it-test/assign] uErr:', uErr);
    return NextResponse.json({ error: 'Erro ao atribuir teste.' }, { status: 500 });
  }

  // Remover resultado anterior (se existir — mudou de nível)
  await sb.from('it_test_results').delete().eq('assignment_id', assignment.id);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://web-eight-rho-84.vercel.app';

  return NextResponse.json({
    assignment: {
      id:          assignment.id,
      nivel:       assignment.nivel,
      assigned_at: assignment.assigned_at,
      link:        `${baseUrl}/it-test/${assignment.token}`,
    },
  }, { status: 201 });
}
