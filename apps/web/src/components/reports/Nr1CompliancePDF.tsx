'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';

const NR1_DIMENSIONS = [
  { key: 'workload_pace_risk', label: 'Carga e Ritmo de Trabalho' },
  { key: 'goal_pressure_risk', label: 'Pressão por Metas' },
  { key: 'role_clarity_risk', label: 'Clareza de Papéis' },
  { key: 'autonomy_control_risk', label: 'Autonomia e Controle' },
  { key: 'leadership_support_risk', label: 'Suporte da Liderança' },
  { key: 'peer_collaboration_risk', label: 'Colaboração entre Pares' },
  { key: 'recognition_justice_risk', label: 'Reconhecimento e Justiça' },
  { key: 'communication_change_risk', label: 'Comunicação e Mudanças' },
  { key: 'conflict_harassment_risk', label: 'Conflitos e Assédio' },
  { key: 'recovery_boundaries_risk', label: 'Recuperação e Limites' },
];

const RISK_LABELS: Record<number, string> = { 1: 'Baixo', 2: 'Médio', 3: 'Alto' };
const RISK_LEVEL_LABELS: Record<string, string> = {
  low: 'Baixo', medium: 'Médio', high: 'Alto',
};

interface Nr1Assessment {
  id: string;
  org_id: string;
  assessment_date: string;
  overall_risk_level: 'low' | 'medium' | 'high';
  overall_risk?: string;
  campaign_name?: string;
  is_campaign?: boolean;
  total_invited?: number;
  total_responded?: number;
  workload_pace_risk: number;
  goal_pressure_risk: number;
  role_clarity_risk: number;
  autonomy_control_risk: number;
  leadership_support_risk: number;
  peer_collaboration_risk: number;
  recognition_justice_risk: number;
  communication_change_risk: number;
  conflict_harassment_risk: number;
  recovery_boundaries_risk: number;
  action_plan?: string | null;
  action_plan_status?: string | null;
  [key: string]: unknown;
}

interface ComplianceReport {
  org_id: string;
  report_date: string;
  period: string;
  summary: {
    total_assessments: number;
    high_risk: number;
    medium_risk: number;
    low_risk: number;
    compliance_status: 'compliant' | 'requires_action';
  };
  critical_dimensions: Array<{ dimension: string; average: number }>;
  recommendations: string[];
  legal_evidence: {
    nr1_version: string;
    assessment_frequency: string;
    action_plans_generated: boolean;
  };
}

interface Nr1CompliancePDFProps {
  assessments: Nr1Assessment[];
  complianceReport?: ComplianceReport | null;
  orgName?: string;
  cnpj?: string;
}

function getRiskColor(level: number | string): [number, number, number] {
  const n = typeof level === 'string' ? (level === 'high' ? 3 : level === 'medium' ? 2 : 1) : level;
  if (n >= 3) return [220, 38, 38];   // red
  if (n >= 2) return [217, 119, 6];   // amber
  return [16, 185, 129];              // green
}

export function Nr1CompliancePDF({ assessments, complianceReport, orgName, cnpj }: Nr1CompliancePDFProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = margin;

    // ─── Cabeçalho ──────────────────────────────────────────────────────
    doc.setFillColor(20, 16, 66); // #141042
    doc.rect(0, 0, pageW, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE COMPLIANCE NR-1', margin, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Saúde Mental e Riscos Psicossociais — Lei 14.831/2024', margin, 19);
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, 25);

    y = 36;

    // ─── Dados da Empresa ────────────────────────────────────────────────
    doc.setTextColor(20, 16, 66);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DA EMPRESA', margin, y);
    y += 5;

    doc.setDrawColor(229, 229, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    const companyInfo = [
      ['Empresa', orgName || 'Não informado'],
      ['CNPJ', cnpj || 'Não informado'],
      ['Período de Avaliação', complianceReport?.period || '90 dias'],
      ['Data do Relatório', new Date().toLocaleDateString('pt-BR')],
      ['Versão NR-1', complianceReport?.legal_evidence?.nr1_version || 'v1.0'],
    ];

    for (const [label, value] of companyInfo) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 45, y);
      y += 6;
    }

    y += 4;

    // ─── Status de Conformidade ──────────────────────────────────────────
    if (complianceReport) {
      const isCompliant = complianceReport.summary.compliance_status === 'compliant';
      const statusColor: [number, number, number] = isCompliant ? [16, 185, 129] : [220, 38, 38];

      doc.setFillColor(...statusColor);
      doc.roundedRect(margin, y, pageW - margin * 2, 14, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(
        isCompliant ? '✓  EMPRESA EM CONFORMIDADE COM A NR-1' : '⚠  EMPRESA REQUER AÇÕES CORRETIVAS — NR-1',
        margin + 4,
        y + 9,
      );
      y += 20;
    }

    // ─── Resumo Estatístico ──────────────────────────────────────────────
    doc.setTextColor(20, 16, 66);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO ESTATÍSTICO', margin, y);
    y += 5;
    doc.setDrawColor(229, 229, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    if (complianceReport) {
      const { summary } = complianceReport;
      const statsRows = [
        ['Total de Avaliações (90 dias)', String(summary.total_assessments)],
        ['Risco Alto', String(summary.high_risk)],
        ['Risco Médio', String(summary.medium_risk)],
        ['Risco Baixo', String(summary.low_risk)],
        ['Planos de Ação Gerados', complianceReport.legal_evidence.action_plans_generated ? 'Sim' : 'Não'],
      ];

      autoTable(doc, {
        startY: y,
        head: [['Indicador', 'Valor']],
        body: statsRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [20, 16, 66], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 248] },
        columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 40, halign: 'center' } },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    } else {
      const total = assessments.length;
      const high = assessments.filter(a => (a.overall_risk || a.overall_risk_level) === 'high').length;
      const medium = assessments.filter(a => (a.overall_risk || a.overall_risk_level) === 'medium').length;
      const low = total - high - medium;

      autoTable(doc, {
        startY: y,
        head: [['Indicador', 'Valor']],
        body: [
          ['Total de Avaliações', String(total)],
          ['Risco Alto', String(high)],
          ['Risco Médio', String(medium)],
          ['Risco Baixo', String(low)],
        ],
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [20, 16, 66], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 248] },
        columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 40, halign: 'center' } },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ─── Dimensões Críticas ──────────────────────────────────────────────
    if (complianceReport?.critical_dimensions && complianceReport.critical_dimensions.length > 0) {
      if (y > 220) { doc.addPage(); y = margin; }

      doc.setTextColor(20, 16, 66);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('DIMENSÕES CRÍTICAS', margin, y);
      y += 5;
      doc.setDrawColor(229, 229, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [['Dimensão', 'Média de Risco', 'Status']],
        body: complianceReport.critical_dimensions.map((d) => [
          d.dimension.replace(/_risk$/, '').replace(/_/g, ' '),
          d.average.toFixed(2),
          d.average >= 2.5 ? 'Crítico' : 'Atenção',
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 245, 245] },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 35, halign: 'center' },
        },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ─── Avaliações Detalhadas ───────────────────────────────────────────
    if (assessments.length > 0) {
      if (y > 200) { doc.addPage(); y = margin; }

      doc.setTextColor(20, 16, 66);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('AVALIAÇÕES DETALHADAS', margin, y);
      y += 5;
      doc.setDrawColor(229, 229, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      const assessmentRows = assessments.map((a) => {
        const riskLevel = (a.overall_risk || a.overall_risk_level) as string;
        const highDims = NR1_DIMENSIONS.filter((d) => (a[d.key] as number) >= 3).map((d) => d.label);
        return [
          a.campaign_name || new Date(a.assessment_date).toLocaleDateString('pt-BR'),
          new Date(a.assessment_date).toLocaleDateString('pt-BR'),
          RISK_LEVEL_LABELS[riskLevel] || riskLevel,
          highDims.length > 0 ? highDims.slice(0, 2).join(', ') + (highDims.length > 2 ? ` +${highDims.length - 2}` : '') : '—',
        ];
      });

      autoTable(doc, {
        startY: y,
        head: [['Campanha/Avaliação', 'Data', 'Risco Geral', 'Dimensões Críticas']],
        body: assessmentRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [20, 16, 66], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 248] },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 75 },
        },
        didParseCell: (data) => {
          if (data.column.index === 2 && data.section === 'body') {
            const val = data.cell.raw as string;
            if (val === 'Alto') data.cell.styles.textColor = [220, 38, 38];
            else if (val === 'Médio') data.cell.styles.textColor = [217, 119, 6];
            else data.cell.styles.textColor = [16, 185, 129];
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ─── Mapa de Risco por Dimensão ──────────────────────────────────────
    if (assessments.length > 0) {
      if (y > 200) { doc.addPage(); y = margin; }

      doc.setTextColor(20, 16, 66);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('MAPA DE RISCO POR DIMENSÃO (MÉDIA GERAL)', margin, y);
      y += 5;
      doc.setDrawColor(229, 229, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      const dimAverages = NR1_DIMENSIONS.map((dim) => {
        const values = assessments.map((a) => (a[dim.key] as number) || 0);
        const avg = values.reduce((s, v) => s + v, 0) / values.length;
        return { label: dim.label, avg };
      }).sort((a, b) => b.avg - a.avg);

      autoTable(doc, {
        startY: y,
        head: [['Dimensão', 'Média', 'Nível', 'Barra de Risco']],
        body: dimAverages.map((d) => {
          const level = d.avg >= 2.5 ? 'Alto' : d.avg >= 1.5 ? 'Médio' : 'Baixo';
          const bars = '█'.repeat(Math.round(d.avg)) + '░'.repeat(3 - Math.round(d.avg));
          return [d.label, d.avg.toFixed(2), level, bars];
        }),
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [20, 16, 66], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 248] },
        columnStyles: {
          0: { cellWidth: 85 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 42, halign: 'center', font: 'courier' },
        },
        didParseCell: (data) => {
          if (data.column.index === 2 && data.section === 'body') {
            const val = data.cell.raw as string;
            if (val === 'Alto') data.cell.styles.textColor = [220, 38, 38];
            else if (val === 'Médio') data.cell.styles.textColor = [217, 119, 6];
            else data.cell.styles.textColor = [16, 185, 129];
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ─── Recomendações ───────────────────────────────────────────────────
    if (complianceReport?.recommendations && complianceReport.recommendations.length > 0) {
      if (y > 220) { doc.addPage(); y = margin; }

      doc.setTextColor(20, 16, 66);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('RECOMENDAÇÕES', margin, y);
      y += 5;
      doc.setDrawColor(229, 229, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      for (const rec of complianceReport.recommendations) {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.text(`• ${rec}`, margin, y, { maxWidth: pageW - margin * 2 });
        y += 6;
      }
      y += 4;
    }

    // ─── Evidência Legal ─────────────────────────────────────────────────
    if (y > 240) { doc.addPage(); y = margin; }

    doc.setFillColor(250, 250, 248);
    doc.setDrawColor(229, 229, 220);
    doc.roundedRect(margin, y, pageW - margin * 2, 28, 2, 2, 'FD');

    doc.setTextColor(20, 16, 66);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DECLARAÇÃO DE CONFORMIDADE LEGAL', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(
      'Este relatório foi gerado automaticamente pelo sistema TalentForge em conformidade com a NR-1 (Portaria MTE)',
      margin + 4, y + 12, { maxWidth: pageW - margin * 2 - 8 }
    );
    doc.text(
      'e a Lei 14.831/2024 (Programa Empresa Promotora da Saúde Mental). As avaliações realizadas constituem',
      margin + 4, y + 17, { maxWidth: pageW - margin * 2 - 8 }
    );
    doc.text(
      'evidência documental do cumprimento das obrigações legais de monitoramento de riscos psicossociais.',
      margin + 4, y + 22, { maxWidth: pageW - margin * 2 - 8 }
    );

    // ─── Rodapé em todas as páginas ──────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(229, 229, 220);
      doc.line(margin, 285, pageW - margin, 285);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(153, 153, 153);
      doc.text('TalentForge — Relatório NR-1 Confidencial', margin, 290);
      doc.text(`Página ${i} de ${totalPages}`, pageW - margin, 290, { align: 'right' });
    }

    const filename = `NR1_Compliance_${orgName?.replace(/\s+/g, '_') || 'Relatorio'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 border border-[#E5E5DC] text-[#141042] rounded-lg hover:bg-[#FAFAF8] transition-colors text-sm font-medium disabled:opacity-70"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {loading ? 'Gerando…' : 'Exportar PDF NR-1'}
    </button>
  );
}
