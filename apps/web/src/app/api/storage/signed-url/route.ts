import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Valida sessão do recruiter
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { bucket, path } = await request.json();
    if (!bucket || !path) {
      return NextResponse.json({ error: 'bucket e path são obrigatórios' }, { status: 400 });
    }

    // Usa service_role para gerar signed URL (bypass RLS do storage)
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // válida por 1 hora

    if (error || !data?.signedUrl) {
      console.error('[signed-url] Erro:', error);
      return NextResponse.json({ error: error?.message || 'Erro ao gerar URL' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (err: any) {
    console.error('[signed-url] Erro inesperado:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
