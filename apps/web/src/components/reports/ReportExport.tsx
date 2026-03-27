'use client';

import { useState } from 'react';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';

export interface ReportColumn {
  header: string;
  dataKey: string;
}

export interface ReportData {
  [key: string]: any;
}

interface ReportExportProps {
  title: string;
  columns: ReportColumn[];
  data: ReportData[];
  fileName?: string;
}

export function ReportExport({ title, columns, data, fileName = 'report' }: ReportExportProps) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingXlsx, setLoadingXlsx] = useState(false);

  const exportToPDF = async () => {
    setLoadingPdf(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

      const headers = columns.map(col => col.header);
      const rows = data.map(row => columns.map(col => row[col.dataKey] || '-'));

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [31, 78, 216], textColor: 255, fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }

      doc.save(`${fileName}_${Date.now()}.pdf`);
    } finally {
      setLoadingPdf(false);
    }
  };

  const exportToExcel = async () => {
    setLoadingXlsx(true);
    try {
      const XLSX = await import('xlsx');

      const ws = XLSX.utils.json_to_sheet(
        data.map(row => {
          const newRow: any = {};
          columns.forEach(col => { newRow[col.header] = row[col.dataKey] || '-'; });
          return newRow;
        })
      );
      ws['!cols'] = columns.map(() => ({ wch: 20 }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));
      wb.Props = { Title: title, Subject: 'Relatório', Author: 'Talent Forge', CreatedDate: new Date() };

      XLSX.writeFile(wb, `${fileName}_${Date.now()}.xlsx`);
    } finally {
      setLoadingXlsx(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToPDF}
        disabled={loadingPdf}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70"
      >
        {loadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        <span>{loadingPdf ? 'Gerando…' : 'Exportar PDF'}</span>
      </button>

      <button
        onClick={exportToExcel}
        disabled={loadingXlsx}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70"
      >
        {loadingXlsx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
        <span>{loadingXlsx ? 'Gerando…' : 'Exportar Excel'}</span>
      </button>
    </div>
  );
}
