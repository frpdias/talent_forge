'use client';

import { forwardRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrgBannerData {
  name: string;
  slug: string;
  logo_url: string | null;
  career_page_logo_url: string | null;
  career_page_banner_url: string | null;
  career_page_color: string | null;
  career_page_secondary_color: string | null;
  career_page_whatsapp_url: string | null;
  career_page_instagram_url: string | null;
  career_page_linkedin_url: string | null;
  career_page_facebook_url: string | null;
}

export interface JobBannerData {
  title: string;
  location: string | null;
  employment_type: string | null;
  work_modality: string | null;
  seniority_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'CLT', part_time: 'Meio período', contract: 'PJ', internship: 'Estágio',
};
const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto',
};
const SENIORITY_LABELS: Record<string, string> = {
  intern: 'Estágio', junior: 'Júnior', mid: 'Pleno', senior: 'Sênior', lead: 'Lead', manager: 'Gerente',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" width={30} height={30} fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function IgIcon() {
  return (
    <svg viewBox="0 0 24 24" width={30} height={30} fill="white">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24c3.259 0 3.668-.014 4.948-.072 1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.689.072-4.948 0-3.259-.014-3.667-.072-4.947-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 01-2.88 0 1.44 1.44 0 012.88 0z" />
    </svg>
  );
}

function LiIcon() {
  return (
    <svg viewBox="0 0 24 24" width={30} height={30} fill="white">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FbIcon() {
  return (
    <svg viewBox="0 0 24 24" width={30} height={30} fill="white">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

// ─── Banner Component ─────────────────────────────────────────────────────────

export const JobSocialBanner = forwardRef<HTMLDivElement, { job: JobBannerData; org: OrgBannerData }>(
  ({ job, org }, ref) => {
    const primary = org.career_page_color || '#141042';
    const secondary = org.career_page_secondary_color || '#10B981';
    const logoUrl = org.career_page_logo_url || org.logo_url;
    const jobUrl = `talentforge.com.br/jobs/${org.slug}`;

    const tags: { label: string }[] = [];
    if (job.location) tags.push({ label: `📍 ${job.location}` });
    if (job.employment_type) tags.push({ label: EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type });
    if (job.work_modality) tags.push({ label: MODALITY_LABELS[job.work_modality] ?? job.work_modality });
    if (job.seniority_level) tags.push({ label: SENIORITY_LABELS[job.seniority_level] ?? job.seniority_level });
    if (job.salary_min) {
      const salary = job.salary_max
        ? `R$ ${(job.salary_min / 1000).toFixed(0)}k – ${(job.salary_max / 1000).toFixed(0)}k`
        : `A partir de R$ ${(job.salary_min / 1000).toFixed(0)}k`;
      tags.push({ label: `💰 ${salary}` });
    }

    const socials: { color: string; icon: React.ReactNode; url: string }[] = [];
    if (org.career_page_whatsapp_url) socials.push({ color: '#25D366', icon: <WaIcon />, url: org.career_page_whatsapp_url });
    if (org.career_page_instagram_url) socials.push({ color: '#E1306C', icon: <IgIcon />, url: org.career_page_instagram_url });
    if (org.career_page_linkedin_url) socials.push({ color: '#0A66C2', icon: <LiIcon />, url: org.career_page_linkedin_url });
    if (org.career_page_facebook_url) socials.push({ color: '#1877F2', icon: <FbIcon />, url: org.career_page_facebook_url });

    const titleFontSize = job.title.length > 35 ? 60 : job.title.length > 25 ? 72 : 86;

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1080,
          position: 'relative',
          fontFamily: 'Arial, Helvetica, sans-serif',
          overflow: 'hidden',
          backgroundColor: primary,
          flexShrink: 0,
        }}
      >
        {/* Banner background image */}
        {org.career_page_banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={org.career_page_banner_url}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.88) 100%)',
        }} />

        {/* Colored accent bar on left */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 12, backgroundColor: secondary,
        }} />

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 1,
          height: '100%',
          display: 'flex', flexDirection: 'column',
          padding: '64px 64px 64px 76px',
        }}>

          {/* Header: logo + org name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 0 }}>
            {logoUrl && (
              <div style={{
                width: 88, height: 88, borderRadius: 18, overflow: 'hidden',
                backgroundColor: primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                border: '2px solid rgba(255,255,255,0.2)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={org.name}
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
                />
              </div>
            )}
            <div>
              <div style={{
                color: secondary,
                fontSize: 18, fontWeight: 700,
                letterSpacing: 4, textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                OPORTUNIDADE
              </div>
              <div style={{ color: '#ffffff', fontSize: 30, fontWeight: 700 }}>
                {org.name}
              </div>
            </div>
          </div>

          {/* Flex spacer */}
          <div style={{ flex: 1 }} />

          {/* "VAGA ABERTA" badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            backgroundColor: secondary,
            borderRadius: 100,
            padding: '10px 28px',
            marginBottom: 24,
            alignSelf: 'flex-start',
          }}>
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase' }}>
              VAGA ABERTA
            </span>
          </div>

          {/* Job title */}
          <div style={{
            color: '#ffffff',
            fontSize: titleFontSize,
            fontWeight: 900,
            lineHeight: 1.05,
            marginBottom: 36,
            letterSpacing: -1,
          }}>
            {job.title}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 52 }}>
              {tags.map((tag, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    border: '1.5px solid rgba(255,255,255,0.25)',
                    borderRadius: 100,
                    padding: '10px 26px',
                    color: '#ffffff',
                    fontSize: 22,
                    fontWeight: 500,
                  }}
                >
                  {tag.label}
                </div>
              ))}
            </div>
          )}

          {/* Footer: social icons + CTA */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.18)',
            paddingTop: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: 16 }}>
              {socials.map((s, i) => (
                <div
                  key={i}
                  style={{
                    width: 60, height: 60, borderRadius: 14,
                    backgroundColor: s.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
              ))}
            </div>

            {/* CTA block */}
            <div style={{
              backgroundColor: secondary,
              borderRadius: 18,
              padding: '20px 36px',
              textAlign: 'center',
              minWidth: 340,
            }}>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
                Candidate-se agora →
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: 500 }}>
                {jobUrl}
              </div>
            </div>
          </div>
        </div>

        {/* TalentForge watermark */}
        <div style={{
          position: 'absolute', bottom: 18, left: 76,
          color: 'rgba(255,255,255,0.35)',
          fontSize: 15, fontWeight: 700, letterSpacing: 1,
        }}>
          Powered by TALENTFORGE
        </div>
      </div>
    );
  }
);

JobSocialBanner.displayName = 'JobSocialBanner';

// ─── Download Functions ───────────────────────────────────────────────────────

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40);
}

export async function downloadJobBannerPNG(element: HTMLElement, jobTitle: string): Promise<void> {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(element, {
    useCORS: true,
    scale: 1,
    width: 1080,
    height: 1080,
    backgroundColor: null,
    logging: false,
  });
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error('canvas toBlob failed')), 'image/png')
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vaga-${slugify(jobTitle)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadJobBannerPDF(
  element: HTMLElement,
  job: JobBannerData,
  org: OrgBannerData,
): Promise<void> {
  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, {
    useCORS: true,
    scale: 1,
    width: 1080,
    height: 1080,
    backgroundColor: null,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [1080, 1080] });
  pdf.addImage(imgData, 'PNG', 0, 0, 1080, 1080);

  // ── Clickable link areas (layout positions are deterministic) ──
  const jobUrl = `https://talentforge.com.br/jobs/${org.slug}`;

  // Social icons: footer, y ≈ 976, each 60×60 with 16px gap, starting at x=76
  const iconY = 976;
  const iconSize = 60;
  const iconGap = 76; // 60 + 16
  let iconX = 76;

  if (org.career_page_whatsapp_url) { pdf.link(iconX, iconY, iconSize, iconSize, { url: org.career_page_whatsapp_url }); iconX += iconGap; }
  if (org.career_page_instagram_url) { pdf.link(iconX, iconY, iconSize, iconSize, { url: org.career_page_instagram_url }); iconX += iconGap; }
  if (org.career_page_linkedin_url) { pdf.link(iconX, iconY, iconSize, iconSize, { url: org.career_page_linkedin_url }); iconX += iconGap; }
  if (org.career_page_facebook_url) { pdf.link(iconX, iconY, iconSize, iconSize, { url: org.career_page_facebook_url }); }

  // CTA block: right side of footer, approximately x=668, y=956, w=340, h=88
  pdf.link(668, 956, 340, 88, { url: jobUrl });

  pdf.save(`vaga-${slugify(job.title)}.pdf`);
}
