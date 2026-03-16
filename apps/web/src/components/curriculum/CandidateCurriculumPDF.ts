'use client';

import jsPDF from 'jspdf';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CurriculumData {
  fullName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  currentTitle?: string | null;
  areaOfExpertise?: string | null;
  seniorityLevel?: string | null;
  salaryExpectation?: number | null;
  employmentType?: string[] | null;
  linkedinUrl?: string | null;
  avatarUrl?: string | null;
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
}

// ─── Helper: converter URL de imagem para base64 circular via Canvas ──────────

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
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

// ─── Auxiliares de formatação ─────────────────────────────────────────────────

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
  ensino_medio: 'Ensino Médio',
  tecnico: 'Técnico',
  graduacao: 'Graduação',
  pos_graduacao: 'Pós-graduação',
  mestrado: 'Mestrado',
  doutorado: 'Doutorado',
  mba: 'MBA',
};

// ─── Geração do PDF ───────────────────────────────────────────────────────────

async function buildCurriculumPDF(data: CurriculumData): Promise<{ doc: jsPDF; safeName: string }> {
  const avatarB64 = data.avatarUrl ? await toCircularBase64(data.avatarUrl, 300) : null;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();   // 210
  const pageH = doc.internal.pageSize.getHeight();   // 297

  // ── Cores ────────────────────────────────────────────────────────────────
  const primary: [number, number, number]   = [20, 16, 66];    // #141042
  const accent: [number, number, number]    = [16, 185, 129];  // #10B981
  const blue: [number, number, number]      = [59, 130, 246];  // #3B82F6
  const white: [number, number, number]     = [255, 255, 255];
  const textDark: [number, number, number]  = [25, 25, 45];
  const textGray: [number, number, number]  = [100, 100, 120];
  const bgLight: [number, number, number]   = [248, 248, 252];
  const borderColor: [number, number, number] = [225, 225, 230];

  const ml = 14;   // margem esquerda
  const mr = 14;   // margem direita
  const bodyW = pageW - ml - mr;   // 182
  const leftW = 60;                // coluna esquerda
  const rightX = ml + leftW + 8;  // início coluna direita
  const rightW = bodyW - leftW - 8; // coluna direita

  // ══════════════════════════════════════════════════════════════════════
  // HEADER  (fundo roxo escuro, altura 52mm)
  // ══════════════════════════════════════════════════════════════════════
  const hdrH = 52;
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageW, hdrH, 'F');

  // Linha decorativa accent (verde) na base do header
  doc.setFillColor(...accent);
  doc.rect(0, hdrH - 1.5, pageW, 1.5, 'F');

  // ── Foto circular (ou iniciais) ──────────────────────────────────────
  const photoX = ml;
  const photoY = 8;
  const photoDia = 36;  // mm
  const photoCX = photoX + photoDia / 2;
  const photoCY = photoY + photoDia / 2;
  const photoR  = photoDia / 2;

  if (avatarB64) {
    // Círculo branco de borda
    doc.setFillColor(...white);
    doc.circle(photoCX, photoCY, photoR + 1, 'F');
    doc.addImage(avatarB64, 'PNG', photoX, photoY, photoDia, photoDia, '', 'FAST');
  } else {
    // Círculo placeholder com iniciais
    doc.setFillColor(40, 34, 90);
    doc.circle(photoCX, photoCY, photoR, 'F');
    doc.setFillColor(...accent);
    doc.circle(photoCX, photoCY, photoR - 1, 'F');

    const initials = data.fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

    doc.setTextColor(...white);
    doc.setFontSize(initials.length === 1 ? 18 : 14);
    doc.setFont('helvetica', 'bold');
    const iW = doc.getTextWidth(initials);
    doc.text(initials, photoCX - iW / 2, photoCY + 4);
  }

  // ── Nome ──────────────────────────────────────────────────────────────
  const nameX = photoX + photoDia + 7;
  const availNameW = pageW - nameX - mr;
  doc.setTextColor(...white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const nameLines = doc.splitTextToSize(data.fullName.toUpperCase(), availNameW) as string[];
  doc.text(nameLines, nameX, 17);

  let headerTextY = 17 + nameLines.length * 7;

  // ── Cargo / Título ────────────────────────────────────────────────────
  if (data.currentTitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...accent);
    doc.text(data.currentTitle, nameX, headerTextY);
    headerTextY += 6;
  }

  // ── Área · Senioridade ─────────────────────────────────────────────────
  if (data.areaOfExpertise || data.seniorityLevel) {
    const sub = [data.areaOfExpertise, data.seniorityLevel].filter(Boolean).join('  ·  ');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 178, 220);
    doc.text(sub, nameX, headerTextY);
    headerTextY += 5.5;
  }

  // ── Contato em linha (e-mail · cidade · telefone) ─────────────────────
  const contactParts: string[] = [];
  if (data.email) contactParts.push(data.email);
  const loc = [data.city, data.state].filter(Boolean).join(', ');
  if (loc) contactParts.push(loc);
  if (data.phone) contactParts.push(data.phone);

  if (contactParts.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 198, 230);
    const contactStr = contactParts.join('   ·   ');
    const contactLines = doc.splitTextToSize(contactStr, availNameW) as string[];
    doc.text(contactLines, nameX, headerTextY);
    headerTextY += contactLines.length * 4.5;
  }

  // ── LinkedIn e Pretensão salarial ────────────────────────────────────
  const extraParts: string[] = [];
  if (data.linkedinUrl) {
    extraParts.push(data.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ''));
  }
  if (data.salaryExpectation) {
    extraParts.push(`Pretensão: ${fmtSalary(data.salaryExpectation)}`);
  }
  if (extraParts.length > 0) {
    doc.setFontSize(7.5);
    doc.setTextColor(150, 148, 190);
    doc.text(extraParts.join('   ·   '), nameX, headerTextY);
  }

  // ══════════════════════════════════════════════════════════════════════
  // CORPO
  // ══════════════════════════════════════════════════════════════════════
  let yLeft  = hdrH + 11;
  let yRight = hdrH + 11;

  // ── Helpers de seção ───────────────────────────────────────────────────
  function sectionLabelLeft(label: string) {
    doc.setFillColor(...primary);
    doc.rect(ml, yLeft, leftW, 6.5, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(label, ml + 3, yLeft + 4.5);
    yLeft += 10;
  }

  function sectionLabelRight(label: string) {
    doc.setFillColor(...primary);
    doc.rect(rightX, yRight, rightW, 6.5, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(label, rightX + 3, yRight + 4.5);
    yRight += 10;
  }

  function rowLeft(label: string, value: string) {
    if (!value) return;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textGray);
    doc.text(label.toUpperCase(), ml, yLeft);
    yLeft += 4;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    const lines = doc.splitTextToSize(value, leftW - 1) as string[];
    doc.text(lines, ml, yLeft);
    yLeft += lines.length * 4.8 + 4;
  }

  // ── COLUNA ESQUERDA: plano de fundo cinza claro ───────────────────────
  // (desenhado depois para não cobrir conteúdo — usamos fillRect antes de tudo)
  // na prática desenhamos agora com alpha=1 e posicionarmos conteúdo sobre
  doc.setFillColor(...bgLight);
  doc.rect(0, hdrH + 1.5, ml + leftW + 5, pageH - hdrH - 1.5, 'F');

  // ── COLUNA ESQUERDA: Contato ──────────────────────────────────────────
  sectionLabelLeft('CONTATO');
  if (data.email)       rowLeft('E-mail', data.email);
  if (data.phone)       rowLeft('Telefone', data.phone);
  if (loc)              rowLeft('Localização', loc);
  if (data.linkedinUrl) {
    rowLeft('LinkedIn', data.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, ''));
  }
  yLeft += 6;

  // ── COLUNA ESQUERDA: Formação ─────────────────────────────────────────
  if (data.education.length > 0) {
    sectionLabelLeft('FORMAÇÃO ACADÊMICA');
    for (const edu of data.education.slice(0, 4)) {
      const period = edu.is_current
        ? `${edu.start_year || '—'} – Atual`
        : `${edu.start_year || '—'} – ${edu.end_year || '—'}`;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      const courseLines = doc.splitTextToSize(edu.course_name, leftW - 1) as string[];
      doc.text(courseLines, ml, yLeft);
      yLeft += courseLines.length * 4.5;

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textGray);
      doc.text(edu.institution, ml, yLeft);
      yLeft += 4.5;

      doc.setFontSize(7);
      doc.setTextColor(...accent);
      doc.text(`${DEGREE_PT[edu.degree_level] || edu.degree_level}  ·  ${period}`, ml, yLeft);
      yLeft += 8;
    }
  }
  yLeft += 5;

  // ── COLUNA ESQUERDA: Diferenciais / Tags ─────────────────────────────
  const tags: string[] = [];
  if (data.areaOfExpertise) tags.push(data.areaOfExpertise);
  if (data.seniorityLevel)  tags.push(`Nível ${data.seniorityLevel}`);
  if (data.employmentType?.length) tags.push(...data.employmentType.map((t) => t.replace(/_/g, ' ')));

  if (tags.length > 0) {
    sectionLabelLeft('DIFERENCIAIS');
    for (const tag of tags) {
      const tagW = Math.min(doc.getTextWidth(tag) + 6, leftW);
      doc.setFillColor(230, 230, 245);
      doc.roundedRect(ml, yLeft, tagW, 6, 2.5, 2.5, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primary);
      doc.text(tag, ml + 3, yLeft + 4.2);
      yLeft += 9;
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // COLUNA DIREITA
  // ══════════════════════════════════════════════════════════════════════

  // ── Resumo Profissional ────────────────────────────────────────────────
  sectionLabelRight('RESUMO PROFISSIONAL');

  const summaryText =
    `Profissional ${data.seniorityLevel ? `de nível ${data.seniorityLevel}` : 'experiente'} ` +
    `com foco em ${data.areaOfExpertise || 'sua área de atuação'}` +
    (data.currentTitle ? `, atuando como ${data.currentTitle}` : '') +
    `. Perfil orientado a resultados, com histórico de entregas consistentes ` +
    `e capacidade de adaptação a ambientes dinâmicos.` +
    (data.experiences.length > 0
      ? ` Experiência em ${data.experiences.slice(0, 3).map((e) => e.company_name).join(', ')}.`
      : '');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);
  const sumLines = doc.splitTextToSize(summaryText, rightW) as string[];
  doc.text(sumLines, rightX, yRight);
  yRight += sumLines.length * 5.2 + 7;

  // ── Experiência Profissional ──────────────────────────────────────────
  if (data.experiences.length > 0) {
    sectionLabelRight('EXPERIÊNCIA PROFISSIONAL');

    for (const exp of data.experiences) {
      // Guard: nova página se necessário
      if (yRight > pageH - 25) {
        doc.addPage();
        yRight = 14;
        // Fundo coluna esquerda na nova página
        doc.setFillColor(...bgLight);
        doc.rect(0, 0, ml + leftW + 3, pageH, 'F');
      }

      // Linha de separação
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.2);
      doc.line(rightX, yRight - 1, rightX + rightW, yRight - 1);

      const period = exp.is_current
        ? `${fmtDate(exp.start_date)} – Atual`
        : `${fmtDate(exp.start_date)}${exp.end_date ? ` – ${fmtDate(exp.end_date)}` : ''}`.trim();

      // Cargo
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primary);
      doc.text(exp.job_title, rightX, yRight + 4);

      // Período no canto direito
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...accent);
      const periodW = doc.getTextWidth(period);
      doc.text(period, rightX + rightW - periodW, yRight + 4);

      yRight += 7;

      // Empresa
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...blue);
      doc.text(exp.company_name, rightX, yRight);
      yRight += 6;

      // Descrição (limitada a 280 chars)
      if (exp.description) {
        const desc = exp.description.trim().substring(0, 280);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textGray);
        const descLines = doc.splitTextToSize(desc + (exp.description.length > 280 ? '…' : ''), rightW) as string[];
        doc.text(descLines, rightX, yRight);
        yRight += descLines.length * 5;
      }

      // Badge "Atual" se em curso
      if (exp.is_current) {
        doc.setFillColor(...accent);
        doc.roundedRect(rightX, yRight + 2, 16, 5, 2, 2, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...white);
        doc.text('ATUAL', rightX + 2.5, yRight + 5.5);
        yRight += 9;
      }

      yRight += 8;
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // RODAPÉ EM TODAS AS PÁGINAS
  // ══════════════════════════════════════════════════════════════════════
  const totalPages = (doc as any).getNumberOfPages?.() ?? 1;
  const emitDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const fY = pageH - 8;
    doc.setFillColor(...primary);
    doc.rect(0, fY - 4, pageW, 12, 'F');
    doc.setFillColor(...accent);
    doc.rect(0, fY - 4, pageW, 1, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 178, 220);
    doc.text(`TALENT`, ml, fY + 1);
    doc.setTextColor(...accent);
    doc.text(`FORGE`, ml + doc.getTextWidth('TALENT') + 1, fY + 1);
    doc.setTextColor(180, 178, 220);
    doc.text(`  ·  Currículo gerado em ${emitDate}`, ml + doc.getTextWidth('TALENTFORGE') + 2, fY + 1);
    const pgText = `${p} / ${totalPages}`;
    doc.text(pgText, pageW - mr - doc.getTextWidth(pgText), fY + 1);
  }

  // ── Retorna o doc e o nome seguro ────────────────────────────────────────────
  const safeName = data.fullName.replace(/\s+/g, '_').toLowerCase();
  return { doc, safeName };
}

// ── Download direto ─────────────────────────────────────────────────────────────
export async function generateCurriculumPDF(data: CurriculumData): Promise<void> {
  const { doc, safeName } = await buildCurriculumPDF(data);
  doc.save(`curriculo_${safeName}.pdf`);
}

// ── Abre o PDF no browser como visualização (nova aba) ───────────────────────────
export async function previewCurriculumPDF(data: CurriculumData): Promise<void> {
  const { doc } = await buildCurriculumPDF(data);
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RELATÓRIO COMPLETO (Currículo + Testes + Scores + Parecer IA + Anotações)
// ═══════════════════════════════════════════════════════════════════════════════

export interface FullReportData extends CurriculumData {
  report?: {
    disc?: {
      D: number; I: number; S: number; C: number;
      primary?: string | null;
      secondary?: string | null;
      description?: string | null;
    } | null;
    color?: {
      primary_color?: string | null;
      secondary_color?: string | null;
      scores?: Record<string, number> | null;
    } | null;
    pi?: {
      scores_natural?: Record<string, number> | null;
      scores_adapted?: Record<string, number> | null;
    } | null;
    scores?: {
      total: number;
      testes: number;
      experiencia: number;
      recrutador: number;
      rating: number;
    } | null;
    recruiterNote?: string | null;
    aiReview?: string | null;
    reviewDate?: string | null;
    jobApplied?: string | null;
  };
}

// ── Paleta de cores para os perfis DISC ──────────────────────────────────────
const DISC_COLORS: Record<string, [number, number, number]> = {
  D: [239, 68, 68],   // vermelho
  I: [234, 179, 8],   // amarelo
  S: [34, 197, 94],   // verde
  C: [59, 130, 246],  // azul
};

// ── Paleta de cores para o teste de cores ─────────────────────────────────────
const COLOR_MAP: Record<string, [number, number, number]> = {
  red:    [239, 68, 68],
  yellow: [234, 179, 8],
  green:  [34, 197, 94],
  blue:   [59, 130, 246],
  vermelho: [239, 68, 68],
  amarelo:  [234, 179, 8],
  verde:    [34, 197, 94],
  azul:     [59, 130, 246],
};

function colorForName(name?: string | null): [number, number, number] {
  if (!name) return [150, 150, 160];
  return COLOR_MAP[name.toLowerCase()] ?? [150, 150, 160];
}

function scoreColor(score: number): [number, number, number] {
  if (score >= 75) return [16, 185, 129];   // verde
  if (score >= 50) return [234, 179, 8];    // amarelo
  return [239, 68, 68];                     // vermelho
}

// ── Página de Relatório ────────────────────────────────────────────────────────
async function appendReportPages(doc: jsPDF, data: FullReportData): Promise<void> {
  const report = data.report;
  const pageW = 210;
  const pageH = 297;
  const primary: [number, number, number]  = [20, 16, 66];
  const accent: [number, number, number]   = [16, 185, 129];
  const white: [number, number, number]    = [255, 255, 255];
  const textDark: [number, number, number] = [25, 25, 45];
  const textGray: [number, number, number] = [100, 100, 120];
  const bgLight: [number, number, number]  = [248, 248, 252];

  const ml = 14;
  const mr = 14;
  const contentW = pageW - ml - mr;
  const emitDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  function footer() {
    const fy = pageH - 8;
    doc.setFillColor(...primary);
    doc.rect(0, fy - 4, pageW, 12, 'F');
    doc.setFillColor(...accent);
    doc.rect(0, fy - 4, pageW, 1, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 178, 220);
    doc.text('TALENT', ml, fy + 1);
    doc.setTextColor(...accent);
    doc.text('FORGE', ml + doc.getTextWidth('TALENT') + 1, fy + 1);
    doc.setTextColor(180, 178, 220);
    doc.text(`  ·  Relatório gerado em ${emitDate}`, ml + doc.getTextWidth('TALENTFORGE') + 2, fy + 1);
    const totalPages = (doc as any).getNumberOfPages?.() ?? 1;
    const pgText = `${totalPages} / ${totalPages}`;
    doc.text(pgText, pageW - mr - doc.getTextWidth(pgText), fy + 1);
  }

  function sectionHeader(y: number, label: string): number {
    doc.setFillColor(...primary);
    doc.rect(ml, y, contentW, 7.5, 'F');
    doc.setFillColor(...accent);
    doc.rect(ml, y + 7.5 - 1.5, contentW, 1.5, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(label.toUpperCase(), ml + 4, y + 5);
    return y + 13;
  }

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA: SCORE + TESTES
  // ══════════════════════════════════════════════════════════════════════
  doc.addPage();
  let y = 0;

  // ── Header roxo com nome ──────────────────────────────────────────────
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageW, 26, 'F');
  doc.setFillColor(...accent);
  doc.rect(0, 24.5, pageW, 1.5, 'F');

  doc.setTextColor(...white);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DO CANDIDATO', ml, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 198, 230);
  let subLine = data.fullName;
  if (report?.jobApplied) subLine += `  ·  Vaga: ${report.jobApplied}`;
  doc.text(subLine, ml, 19);

  y = 32;

  // ══ Scores ════════════════════════════════════════════════════════════
  if (report?.scores) {
    y = sectionHeader(y, 'Score TalentForge');
    const s = report.scores;
    const cols = [
      { label: 'Score Total', value: Math.round(s.total), sub: 'de 100' },
      { label: 'Testes Comportamentais', value: Math.round(s.testes), sub: 'peso 40%' },
      { label: 'Experiência', value: Math.round(s.experiencia), sub: 'peso 35%' },
      { label: 'Avaliação Recrutador', value: Math.round(s.recrutador), sub: `nota ${s.rating}/10 · peso 25%` },
    ];
    const colW = contentW / cols.length;
    cols.forEach((col, i) => {
      const cx = ml + i * colW;
      const color = scoreColor(col.value);
      // Card bg
      doc.setFillColor(...bgLight);
      doc.roundedRect(cx + 1, y - 2, colW - 2, 22, 2, 2, 'F');
      // Valor
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...color);
      const valStr = String(col.value);
      const valW = doc.getTextWidth(valStr);
      doc.text(valStr, cx + (colW - valW) / 2, y + 12);
      // Label
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      const lblLines = doc.splitTextToSize(col.label, colW - 4) as string[];
      const lblW = Math.max(...lblLines.map((l) => doc.getTextWidth(l)));
      doc.text(lblLines, cx + (colW - lblW) / 2, y + 15.5);
      // Sub
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textGray);
      const subW = doc.getTextWidth(col.sub);
      doc.text(col.sub, cx + (colW - subW) / 2, y + 19.5);
    });
    y += 28;
  }

  // ══ DISC ══════════════════════════════════════════════════════════════
  if (report?.disc) {
    y = sectionHeader(y, 'Perfil DISC');
    const d = report.disc;
    const barW = (contentW - 60) / 4 - 4;

    (['D', 'I', 'S', 'C'] as const).forEach((key, i) => {
      const score = d[key] ?? 0;
      const barX = ml + 60 + i * ((contentW - 60) / 4);
      const barColor = DISC_COLORS[key];
      const barMaxH = 30;
      const barH = Math.max(2, (score / 100) * barMaxH);
      const barY = y + barMaxH - barH;

      // Barra
      doc.setFillColor(230, 230, 245);
      doc.roundedRect(barX, y, barW, barMaxH, 2, 2, 'F');
      doc.setFillColor(...barColor);
      doc.roundedRect(barX, barY, barW, barH, 2, 2, 'F');

      // Letter
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...barColor);
      const kW = doc.getTextWidth(key);
      doc.text(key, barX + (barW - kW) / 2, y + barMaxH + 6);

      // Percentual
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textDark);
      const pct = `${Math.round(score)}%`;
      const pctW = doc.getTextWidth(pct);
      doc.text(pct, barX + (barW - pctW) / 2, y + barMaxH + 11);
    });

    // Perfil à esquerda dos gráficos
    const leftX = ml;
    const leftAvailW = 56;
    let ly = y + 2;

    if (d.primary) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textGray);
      doc.text('PERFIL PRIMÁRIO', leftX, ly);
      ly += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primary);
      const pLines = doc.splitTextToSize(d.primary, leftAvailW) as string[];
      doc.text(pLines, leftX, ly);
      ly += pLines.length * 5.5 + 3;
    }
    if (d.secondary) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textGray);
      doc.text('PERFIL SECUNDÁRIO', leftX, ly);
      ly += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accent);
      doc.text(d.secondary, leftX, ly);
      ly += 8;
    }
    if (d.description) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textGray);
      const dLines = doc.splitTextToSize(d.description.substring(0, 200), leftAvailW) as string[];
      doc.text(dLines, leftX, ly);
    }

    y += 50;
  }

  // ══ Teste de Cores ════════════════════════════════════════════════════
  if (report?.color) {
    y = sectionHeader(y, 'Perfil de Cores');
    const c = report.color;
    const colorNames = ['Vermelho', 'Amarelo', 'Verde', 'Azul'];
    const colorKeys = ['red', 'yellow', 'green', 'blue'];

    // Swatches de cor primária/secundária
    if (c.primary_color) {
      const pColor = colorForName(c.primary_color);
      doc.setFillColor(...pColor);
      doc.roundedRect(ml, y, 20, 12, 3, 3, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...white);
      doc.text('PRIMÁRIA', ml + 2, y + 5);
      doc.setFontSize(8);
      doc.text(c.primary_color.charAt(0).toUpperCase() + c.primary_color.slice(1), ml + 2, y + 10);
    }
    if (c.secondary_color) {
      const sColor = colorForName(c.secondary_color);
      doc.setFillColor(...sColor);
      doc.roundedRect(ml + 24, y, 20, 12, 3, 3, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...white);
      doc.text('SECUNDÁRIA', ml + 26, y + 5);
      doc.setFontSize(8);
      doc.text(c.secondary_color.charAt(0).toUpperCase() + c.secondary_color.slice(1), ml + 26, y + 10);
    }

    // Barras de scores por cor
    if (c.scores && Object.keys(c.scores).length > 0) {
      const scoreBarX = ml + 52;
      const scoreBarW = contentW - 52;
      colorKeys.forEach((key, i) => {
        const val = c.scores?.[key] ?? c.scores?.[colorNames[i].toLowerCase()] ?? 0;
        const bX = scoreBarX;
        const bY = y + i * 8;
        const bColor = DISC_COLORS[['D', 'I', 'S', 'C'][i]] ?? [150, 150, 160];
        // Label cor
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorForName(key)[0], colorForName(key)[1], colorForName(key)[2]);
        doc.text(colorNames[i], bX, bY + 4.5);
        // Bar bg
        doc.setFillColor(230, 230, 245);
        doc.roundedRect(bX + 22, bY + 1, scoreBarW - 30, 5, 2, 2, 'F');
        // Bar fill
        doc.setFillColor(...colorForName(key));
        const fillW = Math.max(2, (Number(val) / 100) * (scoreBarW - 30));
        doc.roundedRect(bX + 22, bY + 1, fillW, 5, 2, 2, 'F');
        // Pct
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textDark);
        doc.text(`${Math.round(Number(val))}%`, bX + 22 + (scoreBarW - 30) + 2, bY + 5.5);
      });
    }
    y += 22;
  }

  // ══ PI ════════════════════════════════════════════════════════════════
  if (report?.pi && (report.pi.scores_natural || report.pi.scores_adapted)) {
    y = sectionHeader(y, 'Predictive Index (PI)');
    const pi = report.pi;
    const piColW = contentW / 2 - 4;

    const renderPiScores = (scores: Record<string, number> | null | undefined, label: string, startX: number) => {
      if (!scores) return;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primary);
      doc.text(label.toUpperCase(), startX, y);
      let piY = y + 6;
      Object.entries(scores).slice(0, 6).forEach(([k, v]) => {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textDark);
        doc.text(k, startX, piY);
        doc.setFillColor(230, 230, 245);
        doc.roundedRect(startX + 30, piY - 4, piColW - 40, 6, 1.5, 1.5, 'F');
        doc.setFillColor(...accent);
        const fw = Math.max(2, (Number(v) / 100) * (piColW - 40));
        doc.roundedRect(startX + 30, piY - 4, fw, 6, 1.5, 1.5, 'F');
        doc.setFontSize(6.5);
        doc.setTextColor(...textGray);
        doc.text(`${Math.round(Number(v))}`, startX + piColW - 8, piY);
        piY += 8;
      });
    };

    renderPiScores(pi.scores_natural as Record<string, number>, 'Natural', ml);
    renderPiScores(pi.scores_adapted as Record<string, number>, 'Adaptado', ml + piColW + 8);
    y += 14 + Math.max(
      Object.keys(pi.scores_natural ?? {}).slice(0, 6).length,
      Object.keys(pi.scores_adapted ?? {}).slice(0, 6).length,
    ) * 8;
  }

  // ══ Rodapé desta página ═══════════════════════════════════════════════
  footer();

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA: PARECER TÉCNICO + ANOTAÇÕES
  // ══════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = 0;

  // Header
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageW, 26, 'F');
  doc.setFillColor(...accent);
  doc.rect(0, 24.5, pageW, 1.5, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('PARECER TÉCNICO', ml, 11);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 198, 230);
  doc.text(data.fullName, ml, 19);

  y = 32;

  // ══ Anotações do Recrutador ═══════════════════════════════════════════
  if (report?.recruiterNote) {
    y = sectionHeader(y, 'Anotações do Recrutador');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    const noteLines = doc.splitTextToSize(report.recruiterNote, contentW) as string[];
    doc.text(noteLines, ml, y);
    y += noteLines.length * 5.5 + 10;
  }

  // ══ Parecer com IA ════════════════════════════════════════════════════
  if (report?.aiReview) {
    y = sectionHeader(y, 'Parecer Técnico com IA (GPT-4o)');
    if (report.reviewDate) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textGray);
      doc.text(`Gerado em: ${new Date(report.reviewDate).toLocaleDateString('pt-BR')}`, ml, y);
      y += 6;
    }

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);

    // Dividir em parágrafos separados por \n\n
    const paragraphs = report.aiReview.split(/\n{2,}/);
    for (const para of paragraphs) {
      if (!para.trim()) continue;
      if (y > pageH - 35) {
        footer();
        doc.addPage();
        y = 14;
      }
      const paraLines = doc.splitTextToSize(para.trim(), contentW) as string[];
      doc.text(paraLines, ml, y);
      y += paraLines.length * 5.2 + 5;
    }
    y += 8;
  }

  // ══ Linhas para Anotações ═════════════════════════════════════════════
  if (y > pageH - 70) {
    footer();
    doc.addPage();
    y = 14;
  }

  y = sectionHeader(y, 'Anotações');
  const lineSpacing = 10;
  const numLines = Math.floor((pageH - y - 20) / lineSpacing);
  for (let i = 0; i < numLines; i++) {
    const lineY = y + i * lineSpacing;
    doc.setDrawColor(200, 200, 210);
    doc.setLineWidth(0.3);
    doc.line(ml, lineY, pageW - mr, lineY);
  }

  footer();
}

// ── Gera o PDF completo (currículo + relatório) ────────────────────────────────
export async function generateFullReportPDF(data: FullReportData): Promise<void> {
  const { doc, safeName } = await buildCurriculumPDF(data);
  await appendReportPages(doc, data);

  // Corrigir rodapé de todas as páginas do currículo com numeração total final
  const totalPages = (doc as any).getNumberOfPages?.() ?? 1;
  const pageH = 297;
  const pageW = 210;
  const primary: [number, number, number] = [20, 16, 66];
  const accent: [number, number, number]  = [16, 185, 129];
  const ml = 14;
  const mr = 14;
  const emitDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const fY = pageH - 8;
    doc.setFillColor(...primary);
    doc.rect(0, fY - 4, pageW, 12, 'F');
    doc.setFillColor(...accent);
    doc.rect(0, fY - 4, pageW, 1, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 178, 220);
    doc.text('TALENT', ml, fY + 1);
    doc.setTextColor(...accent);
    doc.text('FORGE', ml + doc.getTextWidth('TALENT') + 1, fY + 1);
    doc.setTextColor(180, 178, 220);
    doc.text(`  ·  Relatório gerado em ${emitDate}`, ml + doc.getTextWidth('TALENTFORGE') + 2, fY + 1);
    const pgText = `${p} / ${totalPages}`;
    doc.text(pgText, pageW - mr - doc.getTextWidth(pgText), fY + 1);
  }

  doc.save(`relatorio_${safeName}.pdf`);
}
