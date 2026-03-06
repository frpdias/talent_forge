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
 * POST /api/v1/php/nr1/invitations/[id]/resend
 * Reenvia convite (gera novo token e estende prazo)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = getSupabase();

    // Gerar novo token via SQL
    const { data, error } = await supabase.rpc('gen_random_uuid');
    const newToken = data || crypto.randomUUID();

    const { data: updated, error: updateError } = await supabase
      .from('nr1_assessment_invitations')
      .update({
        token: Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'),
        status: 'pending',
        invited_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        responded_at: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao reenviar convite:', updateError);
      return NextResponse.json({ error: 'Erro ao reenviar convite' }, { status: 500 });
    }

    return NextResponse.json({ success: true, invitation: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
