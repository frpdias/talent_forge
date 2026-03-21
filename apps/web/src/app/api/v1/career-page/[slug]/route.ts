import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Endpoint público — não exige autenticação
// Usa service role para bypassar RLS, mas só retorna orgs com career_page_enabled=TRUE

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/v1/career-page/[slug]
 * Retorna dados públicos da career page de uma org pelo slug.
 * Não requer autenticação. Só funciona se career_page_enabled=TRUE e status='active'.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const { data: org, error } = await supabase
    .from('organizations')
    .select(
      `id, name, slug, industry,
       logo_url,
       career_page_enabled,
       career_page_headline,
       career_page_logo_url,
       career_page_color,
       career_page_secondary_color,
       career_page_banner_url,
       career_page_about,
       career_page_whatsapp_url,
       career_page_instagram_url,
       career_page_linkedin_url,
       career_page_show_contact,
       career_page_hero_font_color,
       career_page_hero_text_align,
       career_page_hero_font_size,
       career_page_about_font_color,
       career_page_about_text_align,
       career_page_about_font_size,
       career_page_jobs_font_color,
       career_page_jobs_text_align,
       career_page_jobs_font_size,
       career_page_talent_font_color,
       career_page_talent_text_align,
       career_page_talent_font_size,
       career_page_testimonials_font_color,
       career_page_testimonials_text_align,
       career_page_testimonials_font_size,
       career_page_process_font_color,
       career_page_process_text_align,
       career_page_process_font_size`,
    )
    .eq('slug', slug)
    .eq('career_page_enabled', true)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }

  if (!org) {
    return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });
  }

  return NextResponse.json(org);
}
