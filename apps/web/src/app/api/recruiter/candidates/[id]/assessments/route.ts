import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * GET /api/recruiter/candidates/[id]/assessments
 * Retorna todos os assessments (DISC, Color, PI) do candidato.
 * Usa service_role para evitar bloqueios de RLS client-side.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: candidateId } = await params;

    const authHeader = request.headers.get('authorization');
    const orgId = request.headers.get('x-org-id');
    if (!authHeader || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar membership
    const { data: member } = await supabase
      .from('org_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .maybeSingle();
    if (!member) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar dados básicos do candidato para obter user_id (necessário para pi/color)
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id, user_id, email')
      .eq('id', candidateId)
      .maybeSingle();

    if (!candidate) {
      return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 });
    }

    // DISC — usa candidate_id (FK para candidates.id)
    const { data: discRows } = await supabase
      .from('assessments')
      .select('id, assessment_type, status, traits, completed_at, created_at')
      .eq('candidate_id', candidateId)
      .eq('assessment_type', 'disc')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    // Color e PI — usa candidate_user_id
    // Tenta por user_id direto; se nulo, tenta via email no candidate_profiles
    let resolvedUserId: string | null = candidate.user_id ?? null;

    if (!resolvedUserId && candidate.email) {
      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('user_id')
        .eq('email', candidate.email)
        .not('user_id', 'is', null)
        .maybeSingle();
      resolvedUserId = profile?.user_id ?? null;
    }

    let colorRows: any[] = [];
    let piRows: any[] = [];

    if (resolvedUserId) {
      const [colorRes, piRes] = await Promise.all([
        supabase
          .from('color_assessments')
          .select('id, primary_color, secondary_color, scores, status, completed_at, created_at')
          .eq('candidate_user_id', resolvedUserId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false }),
        supabase
          .from('pi_assessments')
          .select('id, scores_natural, scores_adapted, reference_profile, status, completed_at, created_at')
          .eq('candidate_user_id', resolvedUserId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false }),
      ]);
      colorRows = colorRes.data ?? [];
      piRows = piRes.data ?? [];
    }

    return NextResponse.json({
      disc: discRows ?? [],
      color: colorRows,
      pi: piRows,
      candidate_user_id: resolvedUserId,
    });
  } catch (err: any) {
    console.error('[assessments] Unexpected error:', err);
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 });
  }
}
