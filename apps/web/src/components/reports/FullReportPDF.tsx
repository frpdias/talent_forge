'use client';

import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface KPIData {
  id: string;
  label: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: string;
}

interface FunnelData {
  stage: string;
  candidates: number;
  conversion: number;
}

interface TimeToHireData {
  month: string;
  days: number;
  target: number;
}

interface SourceData {
  name: string;
  value: number;
  color: string;
}

interface ReportActivityData {
  name: string;
  job: string;
  stage: string;
  source: string;
  date: string;
}

interface StatsData {
  taxaAceitacao: string;
  satisfacao: string;
  custoMedio: string;
  retencao: string;
}

interface FullReportPDFProps {
  kpis: KPIData[];
  funnel: FunnelData[];
  timeToHire: TimeToHireData[];
  sources: SourceData[];
  activities: ReportActivityData[];
  stats: StatsData;
  dateRange?: { start: string; end: string };
}

export function FullReportPDF({ 
  kpis, 
  funnel, 
  timeToHire, 
  sources, 
  activities,
  stats,
  dateRange 
}: FullReportPDFProps) {
  
  const generateFullReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    // ===== HEADER / CAPA =====
    // Logo/Branding
    doc.setFillColor(31, 78, 216); // #1F4ED8
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('TALENT', 14, 30);
    
    doc.setTextColor(249, 115, 22); // #F97316
    doc.text('FORGE', 58, 30);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório Completo de Recrutamento', 14, 42);
    
    // Data do relatório
    doc.setFontSize(10);
    const dateText = dateRange?.start && dateRange?.end 
      ? `Período: ${formatDate(dateRange.start)} a ${formatDate(dateRange.end)}`
      : `Data: ${new Date().toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })}`;
    doc.text(dateText, pageWidth - 14 - doc.getTextWidth(dateText), 42);

    currentY = 65;

    // ===== SEÇÃO 1: KPIs PRINCIPAIS =====
    doc.setTextColor(31, 78, 216);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Indicadores Principais (KPIs)', 14, currentY);
    currentY += 10;

    // Desenhar KPIs em grid 2x2
    const kpiBoxWidth = (pageWidth - 42) / 2;
    const kpiBoxHeight = 28;
    
    kpis.forEach((kpi, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 14 + col * (kpiBoxWidth + 14);
      const y = currentY + row * (kpiBoxHeight + 8);

      // Box background
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(x, y, kpiBoxWidth, kpiBoxHeight, 3, 3, 'F');

      // Label
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(kpi.label, x + 8, y + 10);

      // Value
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(String(kpi.value), x + 8, y + 22);

      // Change indicator
      const changeColor = kpi.changeType === 'increase' ? [34, 197, 94] : [239, 68, 68];
      doc.setTextColor(changeColor[0], changeColor[1], changeColor[2]);
      doc.setFontSize(9);
      const changeSymbol = kpi.changeType === 'increase' ? '↑' : '↓';
      doc.text(`${changeSymbol} ${kpi.change}%`, x + kpiBoxWidth - 30, y + 22);
    });

    currentY += Math.ceil(kpis.length / 2) * (kpiBoxHeight + 8) + 15;

    // ===== SEÇÃO 2: FUNIL DE RECRUTAMENTO =====
    doc.setTextColor(31, 78, 216);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Funil de Recrutamento', 14, currentY);
    currentY += 8;

    // Tabela do funil
    autoTable(doc, {
      startY: currentY,
      head: [['Etapa', 'Candidatos', 'Conversão']],
      body: funnel.map(item => [
        item.stage,
        item.candidates.toString(),
        `${item.conversion}%`
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [31, 78, 216],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50, halign: 'center' },
        2: { cellWidth: 50, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Verificar se precisa de nova página
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }

    // ===== SEÇÃO 3: TEMPO DE CONTRATAÇÃO =====
    doc.setTextColor(31, 78, 216);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Tempo de Contratação por Mês', 14, currentY);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      head: [['Mês', 'Dias Realizados', 'Meta (dias)', 'Status']],
      body: timeToHire.map(item => {
        const status = item.days <= item.target ? '✓ Dentro da meta' : '✗ Acima da meta';
        return [
          item.month,
          item.days.toString(),
          item.target.toString(),
          status
        ];
      }),
      theme: 'grid',
      headStyles: {
        fillColor: [31, 78, 216],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      didParseCell: function(data) {
        if (data.column.index === 3 && data.section === 'body') {
          const text = data.cell.text[0];
          if (text.includes('✓')) {
            data.cell.styles.textColor = [34, 197, 94];
          } else {
            data.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Verificar se precisa de nova página
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 20;
    }

    // ===== SEÇÃO 4: FONTES DE CANDIDATOS =====
    doc.setTextColor(31, 78, 216);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Efetividade das Fontes de Recrutamento', 14, currentY);
    currentY += 8;

    const totalCandidates = sources.reduce((sum, s) => sum + s.value, 0);

    autoTable(doc, {
      startY: currentY,
      head: [['Fonte', 'Candidatos', 'Percentual', 'Barra']],
      body: sources.map(item => {
        const percent = ((item.value / totalCandidates) * 100).toFixed(1);
        const barLength = Math.round((item.value / totalCandidates) * 20);
        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
        return [
          item.name,
          item.value.toString(),
          `${percent}%`,
          bar
        ];
      }),
      theme: 'grid',
      headStyles: {
        fillColor: [31, 78, 216],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        3: { fontStyle: 'bold', textColor: [31, 78, 216] },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Verificar se precisa de nova página
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }

    // ===== SEÇÃO 5: ESTATÍSTICAS GERAIS =====
    doc.setTextColor(31, 78, 216);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Estatísticas Gerais', 14, currentY);
    currentY += 10;

    const statsItems = [
      { label: 'Taxa de Aceitação de Propostas', value: stats.taxaAceitacao, color: [59, 130, 246] },
      { label: 'Satisfação dos Candidatos', value: stats.satisfacao, color: [34, 197, 94] },
      { label: 'Custo Médio por Contratação', value: stats.custoMedio, color: [249, 115, 22] },
      { label: 'Retenção (6 meses)', value: stats.retencao, color: [147, 51, 234] },
    ];

    const statsBoxWidth = (pageWidth - 42) / 2;
    const statsBoxHeight = 24;

    statsItems.forEach((stat, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 14 + col * (statsBoxWidth + 14);
      const y = currentY + row * (statsBoxHeight + 8);

      // Box background with lighter color
      const lightColor = stat.color.map(c => Math.min(255, c + 180));
      doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
      doc.roundedRect(x, y, statsBoxWidth, statsBoxHeight, 3, 3, 'F');

      // Border
      doc.setDrawColor(stat.color[0], stat.color[1], stat.color[2]);
      doc.roundedRect(x, y, statsBoxWidth, statsBoxHeight, 3, 3, 'S');

      // Label
      doc.setTextColor(75, 85, 99);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(stat.label, x + 8, y + 10);

      // Value
      doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.value, x + 8, y + 20);
    });

    currentY += 2 * (statsBoxHeight + 8) + 15;

    // Verificar se precisa de nova página para atividades
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 20;
    }

    // ===== SEÇÃO 6: ATIVIDADE RECENTE =====
    doc.setTextColor(31, 78, 216);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Atividade Recente de Candidatos', 14, currentY);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      head: [['Candidato', 'Vaga', 'Etapa', 'Origem', 'Data']],
      body: activities.map(item => [
        item.name,
        item.job,
        item.stage,
        item.source,
        item.date
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [31, 78, 216],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 14, right: 14 },
    });

    // ===== FOOTER EM TODAS AS PÁGINAS =====
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linha separadora
      doc.setDrawColor(229, 231, 235);
      doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);
      
      // Texto do rodapé
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      // Logo no rodapé
      doc.text('Talent Forge - Sistema de Recrutamento', 14, pageHeight - 10);
      
      // Número da página
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - 14 - doc.getTextWidth(`Página ${i} de ${pageCount}`),
        pageHeight - 10
      );
      
      // Data de geração
      const generatedText = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
      doc.text(
        generatedText,
        (pageWidth - doc.getTextWidth(generatedText)) / 2,
        pageHeight - 10
      );
    }

    // Salvar o PDF
    const fileName = `relatorio_completo_talent_forge_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <button
      onClick={generateFullReport}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-[#1F4ED8] to-[#3B82F6] rounded-lg hover:from-[#1E40AF] hover:to-[#2563EB] transition-all shadow-md hover:shadow-lg"
    >
      <FileDown className="w-4 h-4" />
      <span>Relatório Completo PDF</span>
    </button>
  );
}
