import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchCbo } from '@/lib/cbo-data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cbo/search?q=<termo>
 *
 * Busca ocupações CBO 2002 (Classificação Brasileira de Ocupações — MTE).
 * Fonte primária: tabela `ref_cbo` do Supabase (2445 ocupações completas).
 * Fallback: dataset local `cbo-data.ts` caso o banco esteja indisponível.
 *
 * Response: { results: CboResult[] }
 * CboResult: { code, title, avg_salary_min?, avg_salary_max? }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Normalizar código: "354705" → "3547-05" para busca por código exato
    const codeQuery = q.replace(/^(\d{4})(\d{2})$/, '$1-$2');
    const looksLikeCode = /^\d{4}-?\d{2}$/.test(q);

    if (looksLikeCode) {
      const { data: codeData } = await serviceSupabase
        .from('ref_cbo')
        .select('code, title, avg_salary_min, avg_salary_max')
        .ilike('code', `${codeQuery}%`)
        .limit(15);
      if (codeData && codeData.length > 0) {
        return NextResponse.json({ results: codeData });
      }
    }

    // 1. Busca via FTS (prefix search no fts_vector)
    const cleanQuery = q.trim().split(/\s+/).join(' & ');
    const { data: ftsData } = await serviceSupabase
      .from('ref_cbo')
      .select('code, title, avg_salary_min, avg_salary_max')
      .textSearch('fts_vector', `${cleanQuery}:*`)
      .limit(15);

    if (ftsData && ftsData.length > 0) {
      return NextResponse.json({ results: ftsData });
    }

    // 2. Fallback: ILIKE no título E no código
    const { data: ilikeData } = await serviceSupabase
      .from('ref_cbo')
      .select('code, title, avg_salary_min, avg_salary_max')
      .or(`title.ilike.%${q}%,code.ilike.%${q}%`)
      .limit(15);

    if (ilikeData && ilikeData.length > 0) {
      return NextResponse.json({ results: ilikeData });
    }

    // 3. Fallback: dataset local (caso DB indisponível ou sem resultados)
    const localResults = searchCbo(q, 15);
    return NextResponse.json({
      results: localResults.map((r) => ({
        code: r.code,
        title: r.title,
        avg_salary_min: null,
        avg_salary_max: null,
      })),
    });

  } catch (_err) {
    // Em caso de erro no banco, usa dataset local como fallback
    const localResults = searchCbo(q, 15);
    return NextResponse.json({
      results: localResults.map((r) => ({
        code: r.code,
        title: r.title,
        avg_salary_min: null,
        avg_salary_max: null,
      })),
    });
  }
}
