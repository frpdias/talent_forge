import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  // Verificar se é admin
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Erro de autenticação' }, { status: 500 });
  }

  const ollamaUrl = process.env.OLLAMA_BASE_URL;
  const ollamaModel = process.env.OLLAMA_MODEL ?? 'gemma3:4b';

  if (!ollamaUrl) {
    return NextResponse.json({
      configured: false,
      online: false,
      models: [],
      url: null,
      model: ollamaModel,
    });
  }

  // Tentar conectar ao Ollama
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${ollamaUrl}/api/tags`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({
        configured: true,
        online: false,
        models: [],
        url: ollamaUrl,
        model: ollamaModel,
        error: `HTTP ${res.status}`,
      });
    }

    const data = await res.json();
    const models: string[] = (data.models ?? []).map((m: { name: string }) => m.name);

    return NextResponse.json({
      configured: true,
      online: true,
      models,
      url: ollamaUrl,
      model: ollamaModel,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({
      configured: true,
      online: false,
      models: [],
      url: ollamaUrl,
      model: ollamaModel,
      error: message.includes('abort') ? 'Timeout (5s)' : message,
    });
  }
}
