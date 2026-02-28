'use client';

import { useState } from 'react';
import { 
  KPICards, 
  RecruitmentFunnel, 
  TimeToHireChart, 
  SourceEffectiveness,
  ReportExport 
} from '@/components';

// Dados de exemplo
const kpisData = [
  {
    id: '1',
    label: 'Candidatos Ativos',
    value: 248,
    change: 12,
    changeType: 'increase' as const,
    icon: 'users' as const,
  },
  {
    id: '2',
    label: 'Vagas Abertas',
    value: 32,
    change: 8,
    changeType: 'increase' as const,
    icon: 'briefcase' as const,
  },
  {
    id: '3',
    label: 'Taxa de Conversão',
    value: '24%',
    change: 5,
    changeType: 'increase' as const,
    icon: 'target' as const,
  },
  {
    id: '4',
    label: 'Tempo Médio',
    value: '18 dias',
    change: 3,
    changeType: 'decrease' as const,
    icon: 'clock' as const,
  },
];

const funnelData = [
  { stage: 'Candidaturas', candidates: 500, conversion: 100 },
  { stage: 'Triagem', candidates: 250, conversion: 50 },
  { stage: 'Entrevista', candidates: 125, conversion: 25 },
  { stage: 'Proposta', candidates: 50, conversion: 10 },
  { stage: 'Contratação', candidates: 30, conversion: 6 },
];

const timeToHireData = [
  { month: 'Jan', days: 25, target: 20 },
  { month: 'Fev', days: 22, target: 20 },
  { month: 'Mar', days: 18, target: 20 },
  { month: 'Abr', days: 20, target: 20 },
  { month: 'Mai', days: 15, target: 20 },
  { month: 'Jun', days: 17, target: 20 },
];

const sourceData = [
  { name: 'LinkedIn', value: 120, color: '#0077B5' },
  { name: 'Site', value: 80, color: '#1F4ED8' },
  { name: 'Indicação', value: 60, color: '#F97316' },
  { name: 'Indeed', value: 40, color: '#2557A7' },
  { name: 'Outros', value: 30, color: '#6B7280' },
];

const reportColumns = [
  { header: 'Candidato', dataKey: 'name' },
  { header: 'Vaga', dataKey: 'job' },
  { header: 'Etapa', dataKey: 'stage' },
  { header: 'Origem', dataKey: 'source' },
  { header: 'Data', dataKey: 'date' },
];

const reportData = [
  {
    name: 'João Silva',
    job: 'Desenvolvedor Frontend',
    stage: 'Entrevista',
    source: 'LinkedIn',
    date: '15/01/2025',
  },
  {
    name: 'Maria Santos',
    job: 'UX Designer',
    stage: 'Proposta',
    source: 'Site',
    date: '14/01/2025',
  },
  {
    name: 'Pedro Costa',
    job: 'Backend Developer',
    stage: 'Triagem',
    source: 'Indicação',
    date: '13/01/2025',
  },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#141042]">
            <span className="text-[#1F4ED8] font-semibold">
              TALENT
            </span>
            {' '}
            <span className="text-[#F97316] font-bold">
              REPORTS
            </span>
          </h1>
          <p className="text-[#666666] mt-1">
            Análises e relatórios detalhados do processo de recrutamento
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm text-[#141042] bg-white focus:outline-none focus:ring-2 focus:ring-[#141042]"
            />
            <span className="text-[#666666]">até</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm text-[#141042] bg-white focus:outline-none focus:ring-2 focus:ring-[#141042]"
            />
          </div>

          {/* Export Button */}
          <ReportExport
            title="Relatório de Candidatos"
            columns={reportColumns}
            data={reportData}
            fileName="relatorio_candidatos"
          />
        </div>
      </div>

      {/* KPIs */}
      <KPICards kpis={kpisData} />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecruitmentFunnel data={funnelData} />
        <TimeToHireChart data={timeToHireData} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SourceEffectiveness data={sourceData} />
        
        {/* Additional Stats */}
        <div className="bg-white rounded-xl shadow-[var(--shadow-sm)] border border-[#E5E5DC] p-6">
          <h3 className="text-lg font-semibold text-[#141042] mb-4">
            Estatísticas Gerais
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-[#141042]">
                Taxa de Aceitação de Propostas
              </span>
              <span className="text-2xl font-bold text-blue-600">85%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-[#141042]">
                Satisfação dos Candidatos
              </span>
              <span className="text-2xl font-bold text-green-600">4.8/5</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-[#141042]">
                Custo Médio por Contratação
              </span>
              <span className="text-2xl font-bold text-orange-600">R$ 2.500</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-[#141042]">
                Retenção (6 meses)
              </span>
              <span className="text-2xl font-bold text-purple-600">92%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl shadow-[var(--shadow-sm)] border border-[#E5E5DC] p-6">
        <h3 className="text-lg font-semibold text-[#141042] mb-4">
          Atividade Recente
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E5DC]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#141042]">
                  Candidato
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#141042]">
                  Vaga
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#141042]">
                  Etapa
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#141042]">
                  Origem
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#141042]">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, index) => (
                <tr key={index} className="border-b border-[#E5E5DC]/60 hover:bg-[#FAFAF8]">
                  <td className="py-3 px-4 text-sm text-[#141042] font-medium">{row.name}</td>
                  <td className="py-3 px-4 text-sm text-[#666666]">{row.job}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-medium bg-[rgba(20,16,66,0.08)] text-[#141042] rounded-full">
                      {row.stage}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#666666]">{row.source}</td>
                  <td className="py-3 px-4 text-sm text-[#94A3B8]">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
