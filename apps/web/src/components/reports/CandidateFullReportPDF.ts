'use client';

import jsPDF from 'jspdf';

// ─── Tipos de entrada ─────────────────────────────────────────────────────────

export interface FullReportData {
  // Dados do candidato
  candidate: {
    fullName: string;
    email: string;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    currentTitle?: string | null;
    areaOfExpertise?: string | null;
    seniorityLevel?: string | null;
    salaryExpectation?: number | null;
    linkedinUrl?: string | null;
    avatarUrl?: string | null;
  };
  experiences: Array<{
    job_title: string;
    company_name: string;
    start_date?: string | null;
    end_date?: string | null;
    is_current?: boolean;
    description?: string | null;
  }>;
  education: Array<{
    degree_level: string;
    course_name: string;
    institution: string;
    start_year?: number | string | null;
    end_year?: number | string | null;
    is_current?: boolean;
  }>;
  // Testes comportamentais
  disc?: {
    D: number; I: number; S: number; C: number;
    primary_profile?: string | null;
    secondary_profile?: string | null;
    description?: string | null;
  } | null;
  colorAssessment?: {
    primary_color?: string | null;
    secondary_color?: string | null;
    scores?: Record<string, number> | null;
  } | null;
  piAssessment?: {
    scores_natural?: Record<string, number> | null;
    scores_adapted?: Record<string, number> | null;
  } | null;
  // Parecer técnico
  review?: {
    score_total: number;
    score_testes: number;
    score_experiencia: number;
    score_recrutador: number;
    recruiter_rating: number;
    ai_review: string;
    created_at: string;
  } | null;
  // Anotações
  notes: string[];
}

// ─── Paleta de cores ──────────────────────────────────────────────────────────

const C = {
  primary:    [20, 16, 66]    as [number,number,number],
  accent:     [16, 185, 129]  as [number,number,number],
  blue:       [59, 130, 246]  as [number,number,number],
  purple:     [124, 58, 237]  as [number,number,number],
  white:      [255, 255, 255] as [number,number,number],
  dark:       [25, 25, 45]    as [number,number,number],
  gray:       [100, 100, 120] as [number,number,number],
  lightGray:  [200, 200, 215] as [number,number,number],
  bg:         [248, 248, 252] as [number,number,number],
  border:     [225, 225, 230] as [number,number,number],
  green:      [34, 197, 94]   as [number,number,number],
  yellow:     [234, 179, 8]   as [number,number,number],
  red:        [239, 68, 68]   as [number,number,number],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(v?: string | null): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

function fmtSalary(v?: number | null): string {
  if (!v) return '';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}

const DEGREE_PT: Record<string, string> = {
  ensino_fundamental: 'Ens. Fundamental',
  ensino_medio:       'Ensino Médio',
  tecnico:            'Técnico',
  graduacao:          'Graduação',
  pos_graduacao:      'Pós-graduação',
  mestrado:           'Mestrado',
  doutorado:          'Doutorado',
  mba:                'MBA',
};

async function toCircularBase64(url: string, size = 256): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('img-load'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  } catch { return null; }
}

function scoreColor(score: number): [number,number,number] {
  if (score >= 80) return C.green;
  if (score >= 60) return C.blue;
  if (score >= 40) return C.yellow;
  return C.red;
}

// ─── Gerador principal ────────────────────────────────────────────────────────

export async function generateCandidateFullReport(data: FullReportData): Promise<void> {
  const avatarB64 = data.candidate.avatarUrl
    ? await toCircularBase64(data.candidate.avatarUrl, 300)
    : null;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const ml = 14;
  const mr = 14;
  const contentW = pageW - ml - mr;
  const emitDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── Rodapé helper (adicionado ao final) ────────────────────────────────────
  const addedPages: number[] = [];
  function markPage() { addedPages.push((doc as any).getCurrentPageInfo?.()?.pageNumber ?? 1); }

  // ══════════════════════════════════════════════════════════════════════════
  // FUNÇÃO: HEADER PADRÃO (usado na p.1 e reutilizado)
  // ══════════════════════════════════════════════════════════════════════════
  function drawHeader(isFirstPage: boolean): number {
    const hdrH = 52;
    doc.setFillColor(...C.primary);
    doc.rect(0, 0, pageW, hdrH, 'F');
    doc.setFillColor(...C.accent);
    doc.rect(0, hdrH - 1.5, pageW, 1.5, 'F');

    if (isFirstPage) {
      // Badge "Relatório Completo"
      doc.setFillColor(...C.purple);
      const badgeW = 46;
      doc.roundedRect(pageW - mr - badgeW, 6, badgeW, 7, 2, 2, 'F');
      doc.setTextColor(...C.white);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO COMPLETO DO CANDIDATO', pageW - mr - badgeW + 3, 11.2);
    }

    // Foto
    const photoX = ml, photoY = 8, photoDia = 36;
    const photoCX = photoX + photoDia / 2, photoCY = photoY + photoDia / 2;

    if (avatarB64) {
      doc.setFillColor(...C.white);
      doc.circle(photoCX, photoCY, photoDia / 2 + 1, 'F');
      doc.addImage(avatarB64, 'PNG', photoX, photoY, photoDia, photoDia, '', 'FAST');
    } else {
      doc.setFillColor(40, 34, 90);
      doc.circle(photoCX, photoCY, photoDia / 2, 'F');
      doc.setFillColor(...C.accent);
      doc.circle(photoCX, photoCY, photoDia / 2 - 1, 'F');
      const initials = data.candidate.fullName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
      doc.setTextColor(...C.white);
      doc.setFontSize(initials.length === 1 ? 18 : 14);
      doc.setFont('helvetica', 'bold');
      doc.text(initials, photoCX - doc.getTextWidth(initials) / 2, photoCY + 4);
    }

    // Nome
    const nameX = ml + photoDia + 7;
    const availW = pageW - nameX - mr - (isFirstPage ? 52 : 0);
    doc.setTextColor(...C.white);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const nameLines = doc.splitTextToSize(data.candidate.fullName.toUpperCase(), availW) as string[];
    doc.text(nameLines, nameX, 17);

    let ty = 17 + nameLines.length * 7;
    if (data.candidate.currentTitle) {
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.accent);
      doc.text(data.candidate.currentTitle, nameX, ty); ty += 6;
    }
    const sub = [data.candidate.areaOfExpertise, data.candidate.seniorityLevel].filter(Boolean).join('  ·  ');
    if (sub) {
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 178, 220);
      doc.text(sub, nameX, ty); ty += 5.5;
    }
    const contactParts = [
      data.candidate.email,
      [data.candidate.city, data.candidate.state].filter(Boolean).join(', '),
      data.candidate.phone,
    ].filter(Boolean) as string[];
    if (contactParts.length) {
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 198, 230);
      const cStr = contactParts.join('   ·   ');
      doc.text(doc.splitTextToSize(cStr, availW) as string[], nameX, ty);
    }
    return hdrH;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FUNÇÃO: CABEÇALHO DE SEÇÃO (nova página)
  // ══════════════════════════════════════════════════════════════════════════
  function sectionPageHeader(title: string, subtitle: string): number {
    doc.addPage();
    doc.setFillColor(...C.primary);
    doc.rect(0, 0, pageW, 24, 'F');
    doc.setFillColor(...C.accent);
    doc.rect(0, 22.5, pageW, 1.5, 'F');
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
    doc.text(title, ml, 15);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 178, 220);
    doc.text(subtitle, ml, 21);
    return 32; // y inicial do conteúdo
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FUNÇÃO: RODAPÉ EM TODAS AS PÁGINAS
  // ══════════════════════════════════════════════════════════════════════════
  function drawAllFooters(totalPages: number) {
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      const fY = pageH - 8;
      doc.setFillColor(...C.primary);
      doc.rect(0, fY - 4, pageW, 12, 'F');
      doc.setFillColor(...C.accent);
      doc.rect(0, fY - 4, pageW, 1, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 178, 220);
      doc.text('TALENT', ml, fY + 1);
      doc.setTextColor(...C.accent);
      doc.text('FORGE', ml + doc.getTextWidth('TALENT') + 1, fY + 1);
      doc.setTextColor(180, 178, 220);
      doc.text(`  ·  Relatório gerado em ${emitDate}`, ml + doc.getTextWidth('TALENTFORGE') + 2, fY + 1);
      const pg = `${p} / ${totalPages}`;
      doc.text(pg, pageW - mr - doc.getTextWidth(pg), fY + 1);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PÁGINA 1: CURRÍCULO
  // ══════════════════════════════════════════════════════════════════════════
  const hdrH = drawHeader(true);
  const leftW = 60;
  const rightX = ml + leftW + 8;
  const rightW = contentW - leftW - 8;

  // Fundo coluna esquerda (p.1)
  doc.setFillColor(...C.bg);
  doc.rect(0, hdrH + 1.5, ml + leftW + 5, pageH - hdrH - 1.5, 'F');

  let yLeft = hdrH + 11;
  let yRight = hdrH + 11;

  function ensureSpaceLeft(needed: number) {
    if (yLeft + needed > pageH - 14) {
      doc.addPage();
      doc.setFillColor(...C.bg);
      doc.rect(0, 0, ml + leftW + 5, pageH, 'F');
      yLeft = 12;
    }
  }

  function ensureSpaceRight(needed: number) {
    if (yRight + needed > pageH - 14) {
      doc.addPage();
      doc.setFillColor(...C.bg);
      doc.rect(0, 0, ml + leftW + 5, pageH, 'F');
      yRight = 12;
    }
  }

  function sectionLeft(label: string) {
    ensureSpaceLeft(12);
    doc.setFillColor(...C.primary);
    doc.rect(ml, yLeft, leftW, 6.5, 'F');
    doc.setTextColor(...C.white); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text(label, ml + 3, yLeft + 4.5);
    yLeft += 10;
  }

  function rowLeft(label: string, value: string) {
    if (!value) return;
    ensureSpaceLeft(14);
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text(label.toUpperCase(), ml, yLeft); yLeft += 4;
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
    const lines = doc.splitTextToSize(value, leftW - 1) as string[];
    doc.text(lines, ml, yLeft); yLeft += lines.length * 4.8 + 4;
  }

  function sectionRight(label: string) {
    ensureSpaceRight(12);
    doc.setFillColor(...C.primary);
    doc.rect(rightX, yRight, rightW, 6.5, 'F');
    doc.setTextColor(...C.white); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text(label, rightX + 3, yRight + 4.5);
    yRight += 10;
  }

  // Esquerda: contato
  sectionLeft('CONTATO');
  if (data.candidate.email) rowLeft('E-mail', data.candidate.email);
  if (data.candidate.phone) rowLeft('Telefone', data.candidate.phone);
  const loc = [data.candidate.city, data.candidate.state].filter(Boolean).join(', ');
  if (loc) rowLeft('Localização', loc);
  if (data.candidate.linkedinUrl) rowLeft('LinkedIn', data.candidate.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, ''));
  if (data.candidate.salaryExpectation) rowLeft('Pretensão', fmtSalary(data.candidate.salaryExpectation));
  yLeft += 6;

  // Esquerda: formação
  if (data.education.length > 0) {
    sectionLeft('FORMAÇÃO ACADÊMICA');
    for (const edu of data.education.slice(0, 4)) {
      ensureSpaceLeft(22);
      const period = edu.is_current ? `${edu.start_year || '—'} – Atual` : `${edu.start_year || '—'} – ${edu.end_year || '—'}`;
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
      const cl = doc.splitTextToSize(edu.course_name, leftW - 1) as string[];
      doc.text(cl, ml, yLeft); yLeft += cl.length * 4.5;
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
      doc.text(edu.institution, ml, yLeft); yLeft += 4.5;
      doc.setFontSize(7); doc.setTextColor(...C.accent);
      doc.text(`${DEGREE_PT[edu.degree_level] || edu.degree_level}  ·  ${period}`, ml, yLeft); yLeft += 9;
    }
  }

  // Direita: experiência
  if (data.experiences.length > 0) {
    sectionRight('EXPERIÊNCIA PROFISSIONAL');
    for (const exp of data.experiences) {
      ensureSpaceRight(28);
      const period = exp.is_current
        ? `${fmtDate(exp.start_date)} – Atual`
        : `${fmtDate(exp.start_date)}${exp.end_date ? ` – ${fmtDate(exp.end_date)}` : ''}`.trim();

      doc.setDrawColor(...C.border); doc.setLineWidth(0.2);
      doc.line(rightX, yRight - 1, rightX + rightW, yRight - 1);

      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary);
      doc.text(exp.job_title, rightX, yRight + 4);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.accent);
      const pW = doc.getTextWidth(period);
      doc.text(period, rightX + rightW - pW, yRight + 4);
      yRight += 7;

      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.blue);
      doc.text(exp.company_name, rightX, yRight); yRight += 6;

      if (exp.description) {
        const desc = exp.description.trim().substring(0, 280);
        doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
        const dl = doc.splitTextToSize(desc + (exp.description.length > 280 ? '…' : ''), rightW) as string[];
        doc.text(dl, rightX, yRight); yRight += dl.length * 5;
      }
      if (exp.is_current) {
        doc.setFillColor(...C.accent);
        doc.roundedRect(rightX, yRight + 2, 16, 5, 2, 2, 'F');
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
        doc.text('ATUAL', rightX + 2.5, yRight + 5.5); yRight += 9;
      }
      yRight += 8;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SEÇÃO: RESULTADOS DOS TESTES
  // ══════════════════════════════════════════════════════════════════════════
  let y = sectionPageHeader('Resultados dos Testes Comportamentais', 'DISC · Avaliação de Cores · Predictive Index (PI)');

  const colW2 = (contentW - 8) / 2;

  // ── DISC ──────────────────────────────────────────────────────────────────
  if (data.disc) {
    // Card DISC
    doc.setFillColor(...C.bg);
    doc.setDrawColor(...C.border); doc.setLineWidth(0.3);
    doc.roundedRect(ml, y, contentW, 68, 3, 3, 'FD');

    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary);
    doc.text('DISC — Perfil Comportamental', ml + 4, y + 8);

    if (data.disc.primary_profile) {
      const badge = data.disc.primary_profile.toUpperCase();
      const bW = doc.getTextWidth(badge) + 8;
      doc.setFillColor(...C.purple);
      doc.roundedRect(ml + contentW - bW - 4, y + 3, bW, 7, 2, 2, 'F');
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
      doc.text(badge, ml + contentW - bW, y + 8);
    }

    const barColors: Record<string, [number,number,number]> = {
      D: C.red, I: C.yellow, S: C.green, C: C.blue,
    };
    const barLabels: Record<string, string> = {
      D: 'Dominância', I: 'Influência', S: 'Estabilidade', C: 'Conformidade',
    };
    const barValues = [
      { key: 'D', val: data.disc.D },
      { key: 'I', val: data.disc.I },
      { key: 'S', val: data.disc.S },
      { key: 'C', val: data.disc.C },
    ];

    let barY = y + 16;
    const barX = ml + 6;
    const barMaxW = contentW - 52;
    const barH = 7;

    for (const { key, val } of barValues) {
      // Label
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
      doc.text(`${key}`, barX, barY + 5.5);
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
      doc.text(barLabels[key], barX + 6, barY + 5.5);
      // Barra fundo
      doc.setFillColor(...C.border);
      doc.roundedRect(barX + 36, barY, barMaxW, barH, 2, 2, 'F');
      // Barra preenchida
      const filled = Math.max(2, (val / 100) * barMaxW);
      doc.setFillColor(...barColors[key]);
      doc.roundedRect(barX + 36, barY, filled, barH, 2, 2, 'F');
      // Valor
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
      doc.text(`${Math.round(val)}%`, barX + 36 + barMaxW + 3, barY + 5.5);
      barY += 12;
    }

    if (data.disc.description) {
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
      const dl = doc.splitTextToSize(data.disc.description, contentW - 8) as string[];
      doc.text(dl.slice(0, 2), ml + 4, barY + 2);
    }
    y += 74;
  } else {
    doc.setFillColor(...C.bg);
    doc.roundedRect(ml, y, contentW, 16, 3, 3, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text('DISC não realizado', ml + 4, y + 10);
    y += 22;
  }

  // ── Color Assessment + PI lado a lado ────────────────────────────────────
  const cardH2 = 44;

  // Card Color
  doc.setFillColor(...C.bg);
  doc.setDrawColor(...C.border); doc.setLineWidth(0.3);
  doc.roundedRect(ml, y, colW2, cardH2, 3, 3, 'FD');

  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary);
  doc.text('Avaliação de Cores', ml + 4, y + 9);

  if (data.colorAssessment?.primary_color) {
    const colorMap: Record<string, [number,number,number]> = {
      red: [239,68,68], blue: [59,130,246], yellow: [234,179,8],
      green: [34,197,94], purple: [124,58,237], orange: [249,115,22],
      vermelho: [239,68,68], azul: [59,130,246], amarelo: [234,179,8],
      verde: [34,197,94], roxo: [124,58,237], laranja: [249,115,22],
    };
    const pc = data.colorAssessment.primary_color.toLowerCase();
    const sc = (data.colorAssessment.secondary_color ?? '').toLowerCase();

    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text('Cor Primária:', ml + 4, y + 18);
    doc.setFillColor(...(colorMap[pc] ?? C.blue));
    doc.circle(ml + 34, y + 16.5, 3.5, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
    doc.text(data.colorAssessment.primary_color, ml + 40, y + 18);

    if (sc) {
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
      doc.text('Cor Secundária:', ml + 4, y + 29);
      doc.setFillColor(...(colorMap[sc] ?? C.gray));
      doc.circle(ml + 38, y + 27.5, 3.5, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
      doc.text(data.colorAssessment.secondary_color!, ml + 44, y + 29);
    }
  } else {
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text('Não realizado', ml + 4, y + 20);
  }

  // Card PI
  const piX = ml + colW2 + 8;
  doc.setFillColor(...C.bg);
  doc.setDrawColor(...C.border);
  doc.roundedRect(piX, y, colW2, cardH2, 3, 3, 'FD');
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary);
  doc.text('Predictive Index (PI)', piX + 4, y + 9);

  if (data.piAssessment?.scores_natural) {
    const entries = Object.entries(data.piAssessment.scores_natural).slice(0, 4);
    let piY = y + 16;
    for (const [k, v] of entries) {
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
      doc.text(`${k}:`, piX + 4, piY);
      doc.setFillColor(...C.border);
      doc.roundedRect(piX + 24, piY - 4.5, colW2 - 34, 6, 1.5, 1.5, 'F');
      const pFill = Math.max(2, ((Number(v) / 10) * (colW2 - 34)));
      doc.setFillColor(...C.purple);
      doc.roundedRect(piX + 24, piY - 4.5, pFill, 6, 1.5, 1.5, 'F');
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
      doc.text(String(Math.round(Number(v))), piX + colW2 - 10, piY);
      piY += 9;
    }
  } else {
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text('Não realizado', piX + 4, y + 20);
  }

  y += cardH2 + 6;

  // ══════════════════════════════════════════════════════════════════════════
  // SEÇÃO: PARECER TÉCNICO
  // ══════════════════════════════════════════════════════════════════════════
  y = sectionPageHeader('Parecer Técnico com IA', 'Análise gerada automaticamente com base no perfil, testes e histórico do candidato');

  if (data.review) {
    // Cards de score
    const scores = [
      { label: 'Score Total',    value: data.review.score_total,       color: C.primary   },
      { label: 'Testes (40%)',   value: data.review.score_testes,      color: C.purple    },
      { label: 'Experiência (35%)', value: data.review.score_experiencia, color: C.blue   },
      { label: 'Nota IA (25%)',  value: data.review.score_recrutador,  color: C.green     },
    ];
    const cardW = (contentW - 6) / 4;
    for (let i = 0; i < scores.length; i++) {
      const cx = ml + i * (cardW + 2);
      doc.setFillColor(...scores[i].color);
      doc.roundedRect(cx, y, cardW, 20, 3, 3, 'F');
      doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
      const vStr = String(Math.round(scores[i].value));
      doc.text(vStr, cx + cardW / 2 - doc.getTextWidth(vStr) / 2, y + 13);
      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(220,220,240);
      const lStr = scores[i].label;
      doc.text(lStr, cx + cardW / 2 - doc.getTextWidth(lStr) / 2, y + 18.5);
    }
    y += 26;

    // Barra de progresso
    doc.setFillColor(...C.border);
    doc.roundedRect(ml, y, contentW, 5, 2, 2, 'F');
    doc.setFillColor(...scoreColor(data.review.score_total));
    doc.roundedRect(ml, y, (data.review.score_total / 100) * contentW, 5, 2, 2, 'F');
    y += 11;

    // Texto do parecer
    const reviewLines = data.review.ai_review
      .replace(/#{1,3} /g, '')       // remove markdown headers
      .replace(/\*\*/g, '')          // remove negrito markdown
      .replace(/\*/g, '')
      .split('\n')
      .filter(l => l.trim());

    for (const line of reviewLines) {
      const isTitle = /^[0-9]+\./.test(line.trim()) || line.trim().length < 60 && line.trim().endsWith(':');
      if (y > pageH - 18) {
        doc.addPage();
        // mini header
        doc.setFillColor(...C.primary);
        doc.rect(0, 0, pageW, 10, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.accent);
        doc.text('Parecer Técnico — continuação', ml, 7);
        y = 16;
      }
      if (isTitle) {
        doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary);
        doc.text(line.trim(), ml, y); y += 6;
      } else {
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.dark);
        const wrappedLines = doc.splitTextToSize(line.trim(), contentW) as string[];
        doc.text(wrappedLines, ml, y); y += wrappedLines.length * 5.5;
      }
      y += 1;
    }

    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.lightGray);
    doc.text(
      `Gerado em ${new Date(data.review.created_at).toLocaleString('pt-BR')} · Nota IA: ${data.review.recruiter_rating}/10`,
      ml, Math.min(y + 2, pageH - 18)
    );
  } else {
    doc.setFillColor(...C.bg);
    doc.roundedRect(ml, y, contentW, 20, 3, 3, 'F');
    doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text('Nenhum parecer técnico gerado ainda.', ml + 4, y + 12);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SEÇÃO: ANOTAÇÕES DO RECRUTADOR
  // ══════════════════════════════════════════════════════════════════════════
  y = sectionPageHeader('Anotações do Recrutador', 'Registros e observações do processo seletivo');

  if (data.notes.length > 0) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary);
    doc.text('Anotações salvas', ml, y); y += 8;

    for (let i = 0; i < data.notes.length; i++) {
      if (y > pageH - 28) {
        doc.addPage();
        doc.setFillColor(...C.primary); doc.rect(0, 0, pageW, 10, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.accent);
        doc.text('Anotações — continuação', ml, 7); y = 16;
      }
      // bullet
      doc.setFillColor(...C.accent);
      doc.circle(ml + 2, y - 1.5, 1.5, 'F');
      // data fictícia (só ordinal)
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.lightGray);
      doc.text(`#${i + 1}`, ml + 6, y);
      // texto
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.dark);
      const noteLines = doc.splitTextToSize(data.notes[i], contentW - 14) as string[];
      doc.text(noteLines, ml + 14, y);
      // linha separadora
      y += noteLines.length * 5.5 + 3;
      doc.setDrawColor(...C.border); doc.setLineWidth(0.15);
      doc.line(ml, y, ml + contentW, y);
      y += 6;
    }
  } else {
    doc.setFillColor(...C.bg);
    doc.roundedRect(ml, y, contentW, 16, 3, 3, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text('Sem anotações registradas.', ml + 4, y + 10);
    y += 22;
  }

  // ── Espaço em branco para novas anotações ─────────────────────────────────
  if (y > pageH - 80) { doc.addPage(); y = 16; }

  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary);
  doc.text('Espaço para novas anotações', ml, y + 8);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
  doc.text('Use este espaço para registros adicionais durante ou após a entrevista.', ml, y + 15);
  y += 22;

  const lineSpacing = 11;
  const nLines = Math.floor((pageH - y - 16) / lineSpacing);
  doc.setDrawColor(200, 200, 215); doc.setLineWidth(0.3);
  for (let i = 0; i < Math.max(nLines, 12); i++) {
    if (y + i * lineSpacing > pageH - 16) {
      doc.addPage(); y = 14;
    }
    doc.line(ml, y + i * lineSpacing, pageW - mr, y + i * lineSpacing);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RODAPÉS
  // ══════════════════════════════════════════════════════════════════════════
  const totalPages = (doc as any).getNumberOfPages?.() ?? 1;
  drawAllFooters(totalPages);

  // ── Download ──────────────────────────────────────────────────────────────
  const safeName = data.candidate.fullName.replace(/\s+/g, '_').toLowerCase();
  doc.save(`relatorio_${safeName}.pdf`);
}
