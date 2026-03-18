import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://talentforge.com.br';

const CATEGORY_SLUGS = [
  'tecnologia', 'administrativo', 'saude', 'marketing', 'educacao',
  'vendas', 'rh', 'engenharia', 'varejo', 'ti', 'juridico', 'imoveis',
  'remoto', 'hibrido',
];

export const revalidate = 3600; // regenera a cada 1h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: jobs } = await supabase.rpc('get_all_public_jobs');

  // Job detail URLs
  const jobUrls: MetadataRoute.Sitemap = (jobs || [])
    .slice(0, 5000) // cap para performance do sitemap
    .map((job: any) => ({
      url: `${BASE_URL}/jobs/${job.org_slug}/${job.id}`,
      lastModified: new Date(job.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Unique career page URLs
  const orgSlugs = [...new Set((jobs || []).map((j: any) => j.org_slug).filter(Boolean))];
  const orgUrls: MetadataRoute.Sitemap = orgSlugs.map((slug: any) => ({
    url: `${BASE_URL}/jobs/${slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  // Category landing pages
  const categoryUrls: MetadataRoute.Sitemap = CATEGORY_SLUGS.map(slug => ({
    url: `${BASE_URL}/vagas/${slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/vagas`,
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    ...categoryUrls,
    ...orgUrls,
    ...jobUrls,
  ];
}
