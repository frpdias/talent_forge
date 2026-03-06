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

/**
 * GET /api/v1/jobs/[id]/channels
 * Status de publicação da vaga em cada canal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id: jobId } = await params;
    const supabase = getSupabase();

    // Verificar que o user é membro da org desta vaga
    const { data: job } = await supabase
      .from('jobs')
      .select('id, org_id')
      .eq('id', jobId)
      .single();

    if (!job) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', job.org_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { data, error } = await supabase
      .from('job_publications')
      .select(`
        id,
        status,
        external_id,
        external_url,
        error_message,
        retry_count,
        published_at,
        expires_at,
        created_at,
        updated_at,
        job_publication_channels (
          id,
          channel_code,
          display_name
        )
      `)
      .eq('job_id', jobId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
