import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_REVIEW_PROMPT } from '@/lib/defaults';

export { DEFAULT_REVIEW_PROMPT };

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// GET — busca as configurações do recrutador
export async function GET(request: NextRequest) {
  try {
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

    const { data: settings } = await supabase
      .from('recruiter_settings')
      .select('id, review_prompt, updated_at')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .maybeSingle();

    return NextResponse.json({
      review_prompt: settings?.review_prompt ?? null,
      default_prompt: DEFAULT_REVIEW_PROMPT,
      updated_at: settings?.updated_at ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 });
  }
}

// PUT — salva/atualiza as configurações do recrutador
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const orgId = request.headers.get('x-org-id');
    if (!authHeader || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const reviewPrompt: string | null = body.review_prompt ?? null;

    const supabase = createAdminClient();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('recruiter_settings')
      .upsert(
        {
          user_id: user.id,
          org_id: orgId,
          review_prompt: reviewPrompt && reviewPrompt.trim().length > 0 ? reviewPrompt.trim() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,org_id' },
      )
      .select('id, review_prompt, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 });
  }
}
