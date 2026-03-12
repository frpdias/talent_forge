import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getServiceSupabase, validateOrgMembership } from '@/lib/api/auth';

/**
 * GET /api/v1/php/nr1/invitations
 * Lista convites NR-1 da organização (usa view v_nr1_invitations_summary)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id') || request.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json({ error: 'org_id é obrigatório' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    if (!(await validateOrgMembership(supabase, user.id, orgId))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }
    const { data, error } = await supabase
      .from('v_nr1_invitations_summary')
      .select('*')
      .eq('org_id', orgId)
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar convites NR-1:', error);
      // Fallback: se a view não existir, buscar direto
      const { data: rawData, error: rawError } = await supabase
        .from('nr1_assessment_invitations')
        .select(`
          *,
          employee:employees!employee_id(full_name, position, department)
        `)
        .eq('org_id', orgId)
        .order('invited_at', { ascending: false });

      if (rawError) {
        return NextResponse.json({ error: 'Erro ao buscar convites' }, { status: 500 });
      }

      const invitations = (rawData || []).map((inv: any) => ({
        id: inv.id,
        employee_id: inv.employee_id,
        employee_name: inv.employee?.full_name || 'Desconhecido',
        employee_position: inv.employee?.position || '',
        employee_department: inv.employee?.department || '',
        status: inv.status,
        status_label: inv.status === 'completed' ? 'Respondido' : inv.status === 'expired' ? 'Expirado' : inv.status === 'accepted' ? 'Em Andamento' : 'Pendente',
        invited_at: inv.invited_at,
        expires_at: inv.expires_at,
        days_until_expiry: (new Date(inv.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        access_link: `/nr1-self-assessment?token=${inv.token}`,
        token: inv.token,
      }));

      return NextResponse.json({ invitations });
    }

    const invitations = (data || []).map((inv: any) => ({
      ...inv,
      access_link: inv.access_link || `/nr1-self-assessment?token=${inv.token}`,
    }));

    return NextResponse.json({ invitations });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/v1/php/nr1/invitations
 * Cria convites para funcionários (pode ser vinculado a uma campanha)
 * Body: { org_id, employee_ids: string[], campaign_id?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const orgId = request.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });
    }

    const body = await request.json();
    const { employee_ids, campaign_id } = body;

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
      return NextResponse.json({ error: 'employee_ids é obrigatório (array de UUIDs)' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verificar colaboradores existem na org
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('organization_id', orgId)
      .in('id', employee_ids);

    if (empError || !employees) {
      return NextResponse.json({ error: 'Erro ao validar funcionários' }, { status: 500 });
    }

    const validIds = new Set(employees.map((e: any) => e.id));

    // Criar convites
    const invitations = employee_ids
      .filter((id: string) => validIds.has(id))
      .map((empId: string) => ({
        org_id: orgId,
        employee_id: empId,
        invited_by: user.id,
        organizational_assessment_id: campaign_id || null,
        status: 'pending',
      }));

    if (invitations.length === 0) {
      return NextResponse.json({ error: 'Nenhum funcionário válido encontrado' }, { status: 400 });
    }

    // Upsert: se já tem convite ativo, atualiza; senão, insere
    const results = [];
    const errors = [];

    for (const inv of invitations) {
      // Verificar se já existe convite ativo
      const { data: existing } = await supabase
        .from('nr1_assessment_invitations')
        .select('id, status')
        .eq('employee_id', inv.employee_id)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      if (existing) {
        // Atualizar convite existente com novo link para campanha
        const { data, error } = await supabase
          .from('nr1_assessment_invitations')
          .update({
            organizational_assessment_id: inv.organizational_assessment_id,
            invited_by: user.id,
            invited_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (data) results.push(data);
        if (error) errors.push({ employee_id: inv.employee_id, error: error.message });
      } else {
        const { data, error } = await supabase
          .from('nr1_assessment_invitations')
          .insert(inv)
          .select()
          .single();

        if (data) results.push(data);
        if (error) errors.push({ employee_id: inv.employee_id, error: error.message });
      }
    }

    // Atualizar total_invited na campanha
    if (campaign_id) {
      const { count } = await supabase
        .from('nr1_assessment_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('organizational_assessment_id', campaign_id);

      await supabase
        .from('nr1_risk_assessments')
        .update({ total_invited: count || results.length })
        .eq('id', campaign_id);
    }

    return NextResponse.json({
      created: results.length,
      errors: errors.length,
      details: errors.length > 0 ? errors : undefined,
    }, { status: 201 });
  } catch (err) {
    console.error('Erro ao criar convites:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
