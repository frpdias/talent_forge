import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function generateMetadata(
  { params }: { params: Promise<{ orgSlug: string; jobId: string }> }
): Promise<Metadata> {
  const { orgSlug, jobId } = await params;
  const supabase = getSupabase();
  const { data } = await supabase.rpc('get_public_jobs_by_org', { p_org_slug: orgSlug });
  const job = (data || []).find((j: any) => j.id === jobId);

  if (!job) return { title: 'Vaga | TalentForge' };

  const descriptionText = job.description
    ? job.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 155)
    : `Vaga de ${job.title} na empresa ${job.org_name}${job.location ? ` em ${job.location}` : ''}.`;

  return {
    title: `${job.title} — ${job.org_name} | TalentForge`,
    description: descriptionText,
    openGraph: {
      title: `${job.title} — ${job.org_name}`,
      description: `Candidate-se agora para ${job.title} na empresa ${job.org_name}. Oportunidade via TalentForge.`,
      type: 'website',
      url: `https://talentforge.com.br/jobs/${orgSlug}/${jobId}`,
      siteName: 'TalentForge',
    },
    twitter: {
      card: 'summary',
      title: `${job.title} — ${job.org_name} | TalentForge`,
      description: descriptionText,
    },
    alternates: { canonical: `https://talentforge.com.br/jobs/${orgSlug}/${jobId}` },
    robots: { index: true, follow: true },
  };
}

export default async function JobDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; jobId: string }>;
}) {
  const { orgSlug, jobId } = await params;
  const supabase = getSupabase();
  const { data } = await supabase.rpc('get_public_jobs_by_org', { p_org_slug: orgSlug });
  const job = (data || []).find((j: any) => j.id === jobId);

  const schema = job
    ? {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description
          ? job.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          : job.title,
        datePosted: job.created_at,
        ...(job.application_deadline ? { validThrough: job.application_deadline } : {}),
        hiringOrganization: {
          '@type': 'Organization',
          name: job.org_name,
          ...(job.org_logo_url ? { logo: job.org_logo_url } : {}),
        },
        ...(job.location && job.work_modality !== 'remoto'
          ? {
              jobLocation: {
                '@type': 'Place',
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: job.location,
                  addressCountry: 'BR',
                },
              },
            }
          : {}),
        ...(job.work_modality === 'remoto'
          ? {
              applicantLocationRequirements: { '@type': 'Country', name: 'Brasil' },
              jobLocationType: 'TELECOMMUTE',
            }
          : {}),
        employmentType:
          job.employment_type === 'full_time' ? 'FULL_TIME'
          : job.employment_type === 'part_time' ? 'PART_TIME'
          : job.employment_type === 'internship' ? 'INTERN'
          : 'CONTRACTOR',
        ...(job.salary_range
          ? {
              baseSalary: {
                '@type': 'MonetaryAmount',
                currency: 'BRL',
                value: {
                  '@type': 'QuantitativeValue',
                  description: job.salary_range,
                  unitText: 'MONTH',
                },
              },
            }
          : {}),
        url: `https://talentforge.com.br/jobs/${orgSlug}/${jobId}`,
        directApply: true,
      }
    : null;

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      {children}
    </>
  );
}
