'use client';

import { useState } from 'react';
import { FileDown, Loader2, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CandidateReportData {
  // Candidatura
  applicationId: string;
  appliedAt: string;
  status: string;
  rating?: number;
  jobTitle: string;
  currentStage?: string | null;

  // Candidato
  candidateName: string;
  candidateEmail: string;

  // Perfil (pode ser null se não carregado)
  phone?: string | null;
  linkedinUrl?: string | null;
  city?: string | null;
  state?: string | null;
  currentTitle?: string | null;
  experienceYears?: number | null;
  profileCompletionPercentage?: number | null;

  // Documentos de admissão
  admissionDocs?: Array<{ document_type: string; file_name: string }>;

  // Organização / Recrutador
  orgName?: string;
  recruiterName?: string;
}

const STATUS_PT: Record<string, string> = {
  applied: 'Nova Candidatura',
  in_process: 'Em Avaliação',
  interview_hr: 'Entrevista com o RH',
  interview_manager: 'Entrevista com o Gestor',
  in_documentation: 'Em Documentação',
  hired: 'Contratado',
  rejected: 'Não Aprovado',
};

const DOC_LABELS: Record<string, string> = {
  rg: 'RG / Identidade',
  cpf: 'CPF',
  ctps: 'Carteira de Trabalho (CTPS)',
  pis: 'PIS / PASEP / NIT',
  comprovante_residencia: 'Comprovante de Residência',
  certidao_civil: 'Certidão de Nascimento/Casamento',
  foto: 'Foto 3×4',
  titulo_eleitor: 'Título de Eleitor',
  reservista: 'Certificado de Reservista',
  escolaridade: 'Comprovante de Escolaridade',
  cnh: 'CNH',
  aso: 'Exame Admissional (ASO)',
  dados_bancarios: 'Dados Bancários',
  certidao_filhos: 'Certidão dos Filhos',
  outros: 'Outros',
};

// ─── Geração do PDF ───────────────────────────────────────────────────────────

function generatePDF(data: CandidateReportData, recruiterNotes: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 0;

  const primary: [number, number, number] = [20, 16, 66];      // #141042
  const accent: [number, number, number] = [16, 185, 129];      // #10B981
  const blue: [number, number, number] = [59, 130, 246];        // #3B82F6
  const textDark: [number, number, number] = [30, 30, 30];
  const textGray: [number, number, number] = [100, 100, 100];
  const borderGray: [number, number, number] = [229, 229, 220];

  const emitDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // ── Helper: nova página ------------------------------------------------
  function checkPage(neededHeight: number) {
    if (y + neededHeight > pageH - 20) {
      doc.addPage();
      y = margin;
    }
  }

  // ── Helper: seção título ───────────────────────────────────────────────
  function sectionTitle(title: string) {
    checkPage(14);
    y += 4;
    doc.setFillColor(...primary);
    doc.rect(margin, y, 3, 7, 'F');
    doc.setTextColor(...primary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 6, y + 5.5);
    y += 10;
    doc.setDrawColor(...borderGray);
    doc.line(margin, y, pageW - margin, y);
    y += 4;
  }

  // ── Helper: campo chave/valor ──────────────────────────────────────────
  function field(label: string, value: string | undefined | null, colX?: number, colW?: number) {
    if (!value) return;
    const x = colX ?? margin;
    checkPage(8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textGray);
    doc.text(label.toUpperCase(), x, y);
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    const maxW = (colW ?? pageW - margin * 2) - 1;
    const lines = doc.splitTextToSize(value, maxW) as string[];
    doc.text(lines[0], x, y + 4.5);
    y += 10;
  }

  // ══════════════════════════════════════════════════════════════════════
  // CABEÇALHO
  // ══════════════════════════════════════════════════════════════════════
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageW, 36, 'F');

  // Coluna esq: TalentForge
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TALENT', margin, 16);
  doc.setTextColor(...accent);
  doc.text('FORGE', margin + 36, 16);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Plataforma de Recrutamento & Seleção', margin, 22);

  // Coluna dir: título do documento
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const docTitle = 'PARECER DO RECRUTADOR';
  const docTitleW = doc.getTextWidth(docTitle);
  doc.text(docTitle, pageW - margin - docTitleW, 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const dateLabel = `Emitido em: ${emitDate}`;
  const dateLabelW = doc.getTextWidth(dateLabel);
  doc.text(dateLabel, pageW - margin - dateLabelW, 21);

  if (data.recruiterName) {
    const recruiterLine = `Recrutador: ${data.recruiterName}`;
    const recruiterLineW = doc.getTextWidth(recruiterLine);
    doc.text(recruiterLine, pageW - margin - recruiterLineW, 27);
  }

  if (data.orgName) {
    const orgLine = `Empresa: ${data.orgName}`;
    const orgLineW = doc.getTextWidth(orgLine);
    doc.text(orgLine, pageW - margin - orgLineW, 33);
  }

  y = 44;

  // ══════════════════════════════════════════════════════════════════════
  // SEÇÃO 1 — DADOS DO CANDIDATO
  // ══════════════════════════════════════════════════════════════════════
  sectionTitle('1. DADOS DO CANDIDATO');

  // Nome (destaque)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primary);
  doc.text(data.candidateName, margin, y);
  y += 7;

  if (data.currentTitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...textGray);
    doc.text(data.currentTitle, margin, y);
    y += 7;
  }

  // Grid 2 colunas
  const col1x = margin;
  const col2x = pageW / 2 + 2;
  const colW = pageW / 2 - margin - 4;
  const yBefore = y;

  // Coluna 1
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const leftFields: Array<[string, string | null | undefined]> = [
    ['E-mail', data.candidateEmail],
    ['Telefone', data.phone],
    ['Localização', [data.city, data.state].filter(Boolean).join(', ') || null],
  ];

  let yLeft = y;
  for (const [label, value] of leftFields) {
    if (!value) continue;
    doc.setTextColor(...textGray);
    doc.setFontSize(7.5);
    doc.text(label.toUpperCase(), col1x, yLeft);
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(value, colW) as string[];
    doc.text(lines[0], col1x, yLeft + 4.5);
    doc.setFont('helvetica', 'normal');
    yLeft += 11;
  }

  // Coluna 2
  let yRight = y;
  const rightFields: Array<[string, string | null | undefined]> = [
    ['LinkedIn', data.linkedinUrl
      ? data.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, 'linkedin.com/in/')
      : null],
    ['Experiência', data.experienceYears != null && data.experienceYears > 0
      ? `${data.experienceYears} ${data.experienceYears === 1 ? 'ano' : 'anos'}`
      : null],
    ['Completude do perfil', data.profileCompletionPercentage != null && data.profileCompletionPercentage > 0
      ? `${data.profileCompletionPercentage}%`
      : null],
  ];

  for (const [label, value] of rightFields) {
    if (!value) continue;
    doc.setTextColor(...textGray);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(label.toUpperCase(), col2x, yRight);
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(value, col2x, yRight + 4.5);
    doc.setFont('helvetica', 'normal');
    yRight += 11;
  }

  y = Math.max(yLeft, yRight) + 4;

  // ══════════════════════════════════════════════════════════════════════
  // SEÇÃO 2 — CANDIDATURA
  // ══════════════════════════════════════════════════════════════════════
  sectionTitle('2. CANDIDATURA');

  const applyDate = new Date(data.appliedAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', cellPadding: 3 },
    bodyStyles: { fontSize: 9, textColor: textDark, cellPadding: 4 },
    alternateRowStyles: { fillColor: [250, 250, 248] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    body: [
      ['Vaga', data.jobTitle],
      ['Data da Candidatura', applyDate],
      ['Status Atual', STATUS_PT[data.status] ?? data.status],
      ...(data.currentStage ? [['Etapa do Pipeline', data.currentStage]] : []),
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ══════════════════════════════════════════════════════════════════════
  // SEÇÃO 3 — AVALIAÇÃO DO RECRUTADOR
  // ══════════════════════════════════════════════════════════════════════
  sectionTitle('3. AVALIAÇÃO DO RECRUTADOR');

  // Stars
  if (data.rating !== undefined && data.rating > 0) {
    checkPage(12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textGray);
    doc.text('PONTUAÇÃO', margin, y);
    y += 5;

    const starSize = 6;
    const starGap = 2;
    for (let i = 0; i < 5; i++) {
      const filled = i < data.rating;
      doc.setFillColor(filled ? 251 : 229, filled ? 191 : 229, filled ? 36 : 220);
      doc.setDrawColor(filled ? 217 : 200, filled ? 119 : 200, filled ? 6 : 200);
      doc.setLineWidth(0.3);
      doc.rect(margin + i * (starSize + starGap), y, starSize, starSize, 'FD');
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text(`${data.rating}/5`, margin + 5 * (starSize + starGap) + 3, y + 5);
    y += starSize + 6;
  }

  // Parecer técnico
  checkPage(20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textGray);
  doc.text('PARECER TÉCNICO', margin, y);
  y += 5;

  if (recruiterNotes.trim()) {
    const notesLines = doc.splitTextToSize(recruiterNotes.trim(), pageW - margin * 2) as string[];
    const boxH = notesLines.length * 5 + 8;
    checkPage(boxH + 4);
    doc.setFillColor(250, 250, 248);
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, pageW - margin * 2, boxH, 2, 2, 'FD');
    doc.setTextColor(...textDark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(notesLines, margin + 4, y + 6);
    y += boxH + 6;
  } else {
    checkPage(12);
    doc.setFillColor(255, 249, 235);
    doc.setDrawColor(253, 230, 138);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, pageW - margin * 2, 10, 2, 2, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhum parecer técnico registrado para esta candidatura.', margin + 4, y + 6.5);
    y += 14;
  }

  // ══════════════════════════════════════════════════════════════════════
  // SEÇÃO 4 — DOCUMENTOS RECEBIDOS (se houver)
  // ══════════════════════════════════════════════════════════════════════
  if (data.admissionDocs && data.admissionDocs.length > 0) {
    sectionTitle('4. DOCUMENTOS DE ADMISSÃO RECEBIDOS');

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: { fillColor: [88, 80, 130], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', cellPadding: 3 },
      bodyStyles: { fontSize: 8.5, textColor: textDark, cellPadding: 3.5 },
      alternateRowStyles: { fillColor: [250, 250, 248] },
      head: [['#', 'Documento', 'Arquivo']],
      body: data.admissionDocs.map((doc, i) => [
        `${i + 1}`,
        DOC_LABELS[doc.document_type] ?? doc.document_type,
        doc.file_name,
      ]),
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ══════════════════════════════════════════════════════════════════════
  // RODAPÉ EM TODAS AS PÁGINAS
  // ══════════════════════════════════════════════════════════════════════
  const totalPages = (doc as any).getNumberOfPages?.() ?? 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const fY = pageH - 10;
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.3);
    doc.line(margin, fY - 3, pageW - margin, fY - 3);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textGray);
    doc.text('TalentForge — Documento Confidencial | Uso exclusivo do recrutador', margin, fY);
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin - 20, fY);
  }

  // ── Salvar ──────────────────────────────────────────────────────────
  const safeName = data.candidateName.replace(/\s+/g, '_').toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`parecer_${safeName}_${dateStr}.pdf`);
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface CandidateReportPDFProps {
  data: CandidateReportData;
}

export function CandidateReportPDF({ data }: CandidateReportPDFProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  function handleGenerate() {
    setGenerating(true);
    try {
      generatePDF(data, notes);
    } finally {
      setTimeout(() => {
        setGenerating(false);
        setOpen(false);
      }, 600);
    }
  }

  return (
    <>
      {/* Botão de disparo */}
      <Button
        variant="outline"
        size="sm"
        className="w-full border-[#141042]/20 text-[#141042] hover:bg-[rgba(20,16,66,0.05)]"
        onClick={() => setOpen(true)}
      >
        <FileText className="h-4 w-4 mr-2" />
        Gerar Parecer PDF
      </Button>

      {/* Painel inline */}
      {open && (
        <div className="mt-3 p-4 rounded-xl border border-[#141042]/20 bg-[#FAFAF8] animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#141042] uppercase tracking-wider">
              Parecer Técnico do Recrutador
            </p>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-[rgba(20,16,66,0.06)] transition-colors"
            >
              <X className="h-3.5 w-3.5 text-[#94A3B8]" />
            </button>
          </div>

          <p className="text-xs text-[#94A3B8] mb-2">
            Este texto será incluído no PDF. Deixe em branco para exportar sem parecer.
          </p>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Candidato com sólida experiência em gestão de equipes, comunicação excelente e alinhamento cultural. Recomendado para avanço ao processo seletivo."
            rows={5}
            className="w-full px-3 py-2.5 text-sm bg-white border border-[#E5E5DC] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#141042] focus:border-transparent transition-all text-[#141042] placeholder-[#94A3B8]"
          />

          <div className="flex items-center gap-2 mt-3">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              size="sm"
              className="flex-1 bg-[#141042] hover:bg-[#1a164f] text-white"
            >
              {generating ? (
                <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Gerando...</>
              ) : (
                <><FileDown className="h-3.5 w-3.5 mr-2" />Exportar PDF</>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-[#94A3B8] hover:text-[#141042]"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
