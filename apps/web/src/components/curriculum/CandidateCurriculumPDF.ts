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
  const leftW = 58;                // coluna esquerda
  const rightX = ml + leftW + 6;  // início coluna direita
  const rightW = bodyW - leftW - 6; // coluna direita

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
  let yLeft  = hdrH + 7;
  let yRight = hdrH + 7;

  // ── Helpers de seção ───────────────────────────────────────────────────
  function sectionLabelLeft(label: string) {
    doc.setFillColor(...primary);
    doc.rect(ml, yLeft, leftW, 5.5, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(label, ml + 2.5, yLeft + 3.8);
    yLeft += 7;
  }

  function sectionLabelRight(label: string) {
    doc.setFillColor(...primary);
    doc.rect(rightX, yRight, rightW, 5.5, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(label, rightX + 2.5, yRight + 3.8);
    yRight += 7;
  }

  function rowLeft(label: string, value: string) {
    if (!value) return;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textGray);
    doc.text(label.toUpperCase(), ml, yLeft);
    yLeft += 3.5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    const lines = doc.splitTextToSize(value, leftW - 1) as string[];
    doc.text(lines, ml, yLeft);
    yLeft += lines.length * 4.2 + 1.5;
  }

  // ── COLUNA ESQUERDA: plano de fundo cinza claro ───────────────────────
  // (desenhado depois para não cobrir conteúdo — usamos fillRect antes de tudo)
  // na prática desenhamos agora com alpha=1 e posicionarmos conteúdo sobre
  doc.setFillColor(...bgLight);
  doc.rect(0, hdrH + 1.5, ml + leftW + 3, pageH - hdrH - 1.5, 'F');

  // ── COLUNA ESQUERDA: Contato ──────────────────────────────────────────
  sectionLabelLeft('CONTATO');
  if (data.email)       rowLeft('E-mail', data.email);
  if (data.phone)       rowLeft('Telefone', data.phone);
  if (loc)              rowLeft('Localização', loc);
  if (data.linkedinUrl) {
    rowLeft('LinkedIn', data.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, ''));
  }
  yLeft += 3;

  // ── COLUNA ESQUERDA: Formação ─────────────────────────────────────────
  if (data.education.length > 0) {
    sectionLabelLeft('FORMAÇÃO ACADÊMICA');
    for (const edu of data.education.slice(0, 4)) {
      const period = edu.is_current
        ? `${edu.start_year || '—'} – Atual`
        : `${edu.start_year || '—'} – ${edu.end_year || '—'}`;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      const courseLines = doc.splitTextToSize(edu.course_name, leftW - 1) as string[];
      doc.text(courseLines, ml, yLeft);
      yLeft += courseLines.length * 4;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textGray);
      doc.text(edu.institution, ml, yLeft);
      yLeft += 3.8;

      doc.setFontSize(6.5);
      doc.setTextColor(...accent);
      doc.text(`${DEGREE_PT[edu.degree_level] || edu.degree_level}  ·  ${period}`, ml, yLeft);
      yLeft += 5;
    }
  }
  yLeft += 2;

  // ── COLUNA ESQUERDA: Diferenciais / Tags ─────────────────────────────
  const tags: string[] = [];
  if (data.areaOfExpertise) tags.push(data.areaOfExpertise);
  if (data.seniorityLevel)  tags.push(`Nível ${data.seniorityLevel}`);
  if (data.employmentType?.length) tags.push(...data.employmentType.map((t) => t.replace(/_/g, ' ')));

  if (tags.length > 0) {
    sectionLabelLeft('DIFERENCIAIS');
    for (const tag of tags) {
      const tagW = Math.min(doc.getTextWidth(tag) + 4, leftW);
      doc.setFillColor(230, 230, 245);
      doc.roundedRect(ml, yLeft, tagW, 5, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primary);
      doc.text(tag, ml + 2, yLeft + 3.5);
      yLeft += 7;
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

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);
  const sumLines = doc.splitTextToSize(summaryText, rightW) as string[];
  doc.text(sumLines, rightX, yRight);
  yRight += sumLines.length * 4.5 + 4;

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
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primary);
      doc.text(exp.job_title, rightX, yRight + 3);

      // Período no canto direito
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...accent);
      const periodW = doc.getTextWidth(period);
      doc.text(period, rightX + rightW - periodW, yRight + 3);

      yRight += 5.5;

      // Empresa
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...blue);
      doc.text(exp.company_name, rightX, yRight);
      yRight += 5;

      // Descrição (limitada a 250 chars)
      if (exp.description) {
        const desc = exp.description.trim().substring(0, 280);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textGray);
        const descLines = doc.splitTextToSize(desc + (exp.description.length > 280 ? '…' : ''), rightW) as string[];
        doc.text(descLines, rightX, yRight);
        yRight += descLines.length * 4.2;
      }

      // Badge "Atual" se em curso
      if (exp.is_current) {
        doc.setFillColor(...accent);
        doc.roundedRect(rightX, yRight + 1, 14, 4, 1.5, 1.5, 'F');
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...white);
        doc.text('ATUAL', rightX + 2, yRight + 4);
        yRight += 6;
      }

      yRight += 5;
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
