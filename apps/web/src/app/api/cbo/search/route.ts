import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchCbo } from '@/lib/cbo-data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cbo/search?q=<termo>
 *
 * Busca ocupações CBO 2002 (Classificação Brasileira de Ocupações — MTE).
 * Combina duas fontes:
 *  1. Dataset local `cbo-data.ts` (~350 ocupações mais comuns) — busca instantânea
 *  2. Tabela `ref_cbo` do Supabase — enriquecimento com salário médio de mercado
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

  // 1. Busca local rápida
  const localResults = searchCbo(q, 15);

  // 2. Enriquecer com dados de salário da tabela ref_cbo (service role para bypass RLS)
  let salaryMap: Record<string, { min: number; max: number }> = {};

  try {
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (localResults.length > 0) {
      const codes = localResults.map((r) => r.code);
      const { data } = await serviceSupabase
        .from('ref_cbo')
        .select('code, avg_salary_min, avg_salary_max')
        .in('code', codes);

      if (data) {
        data.forEach((row) => {
          if (row.avg_salary_min || row.avg_salary_max) {
            salaryMap[row.code] = {
              min: row.avg_salary_min ?? 0,
              max: row.avg_salary_max ?? 0,
            };
          }
        });
      }
    }

    // 3. Fallback: busca direta na ref_cbo por ILIKE se resultado local for vazio
    if (localResults.length === 0) {
      const { data } = await serviceSupabase
        .from('ref_cbo')
        .select('code, title, avg_salary_min, avg_salary_max')
        .ilike('title', `%${q}%`)
        .limit(15);

      if (data && data.length > 0) {
        return NextResponse.json({
          results: data.map((row) => ({
            code: row.code,
            title: row.title,
            avg_salary_min: row.avg_salary_min ?? null,
            avg_salary_max: row.avg_salary_max ?? null,
          })),
        });
      }

      return NextResponse.json({ results: [] });
    }
  } catch (err) {
    // Salário não é crítico — continua sem enriquecimento
    console.error('[cbo/search] Salary enrichment error:', err);
  }

  const results = localResults.map((entry) => ({
    code: entry.code,
    title: entry.title,
    avg_salary_min: salaryMap[entry.code]?.min ?? null,
    avg_salary_max: salaryMap[entry.code]?.max ?? null,
  }));

  return NextResponse.json({ results });
}
