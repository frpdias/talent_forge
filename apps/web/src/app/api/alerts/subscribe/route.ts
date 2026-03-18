import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, params } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Evita duplicatas: verifica se já existe alerta ativo para o mesmo email + params
    const { data: existing } = await supabase
      .from('job_alerts')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .eq('search_params', params || {})
      .eq('is_active', true)
      .maybeSingle();

    if (existing) {
      // Alerta já existe — retorna 200 para não expor informações
      return NextResponse.json({ ok: true, reused: true });
    }

    const { error } = await supabase.from('job_alerts').insert({
      email: email.toLowerCase().trim(),
      search_params: params || {},
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[alerts/subscribe]', err);
    return NextResponse.json({ error: 'Falha ao salvar alerta' }, { status: 500 });
  }
}
