'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgStore } from '@/lib/store';
import { createClient, getAuthToken } from '@/lib/supabase/client';

type CsvRow = {
  quality_score: number;
  rework_rate: number;
  process_adherence_rate: number;
  average_handle_time: number;
  first_call_resolution_rate: number;
  delivery_consistency: number;
  customer_satisfaction_score: number;
  nps_score: number;
  absenteeism_rate: number;
  engagement_score: number;
  operational_stress_level: number;
  notes?: string;
};

const CSV_COLUMNS = [
  'quality_score',
  'rework_rate',
  'process_adherence_rate',
  'average_handle_time',
  'first_call_resolution_rate',
  'delivery_consistency',
  'customer_satisfaction_score',
  'nps_score',
  'absenteeism_rate',
  'engagement_score',
  'operational_stress_level',
  'notes',
] as const;

export default function NewCopcMetric() {
  const router = useRouter();
  const { currentOrg, phpContextOrgId } = useOrgStore();
  const effectiveOrgId = phpContextOrgId || currentOrg?.id;
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual');
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quality (35%)
  const [qualityScore, setQualityScore] = useState<number | ''>('');
  const [reworkRate, setReworkRate] = useState<number | ''>('');

  // Efficiency (20%)
  const [processAdherenceRate, setProcessAdherenceRate] = useState<number | ''>(
    '',
  );
  const [averageHandleTime, setAverageHandleTime] = useState<number | ''>('');

  // Effectiveness (20%)
  const [firstCallResolutionRate, setFirstCallResolutionRate] = useState<
    number | ''
  >('');
  const [deliveryConsistency, setDeliveryConsistency] = useState<number | ''>(
    '',
  );

  // CX (15%)
  const [customerSatisfactionScore, setCustomerSatisfactionScore] = useState<
    number | ''
  >('');
  const [npsScore, setNpsScore] = useState<number | ''>('');

  // People (10%)
  const [absenteeismRate, setAbsenteeismRate] = useState<number | ''>('');
  const [engagementScore, setEngagementScore] = useState<number | ''>('');
  const [operationalStressLevel, setOperationalStressLevel] = useState<
    number | ''
  >('');

  // Metadata
  const [notes, setNotes] = useState('');

  const calculatePreviewScore = (): number => {
    const quality = Number(qualityScore) || 0;
    const adherence = Number(processAdherenceRate) || 0;
    const fcr = Number(firstCallResolutionRate) || 0;
    const csat = Number(customerSatisfactionScore) || 0;
    const absRate = Number(absenteeismRate) || 0;

    return (
      quality * 0.35 +
      adherence * 0.2 +
      fcr * 0.2 +
      csat * 0.15 +
      (100 - absRate) * 0.1
    );
  };

  const isFormValid = (): boolean => {
    return (
      qualityScore !== '' &&
      reworkRate !== '' &&
      processAdherenceRate !== '' &&
      averageHandleTime !== '' &&
      firstCallResolutionRate !== '' &&
      deliveryConsistency !== '' &&
      customerSatisfactionScore !== '' &&
      npsScore !== '' &&
      absenteeismRate !== '' &&
      engagementScore !== '' &&
      operationalStressLevel !== ''
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert('Por favor, preencha todas as métricas obrigatórias.');
      return;
    }
    if (!effectiveOrgId) {
      alert('Selecione uma empresa primeiro');
      return;
    }

    setLoading(true);

    try {
      const token = await getAuthToken() ?? '';

      const payload = {
        org_id: effectiveOrgId!,
        quality_score: Number(qualityScore),
        rework_rate: Number(reworkRate),
        process_adherence_rate: Number(processAdherenceRate),
        average_handle_time: Number(averageHandleTime),
        first_call_resolution_rate: Number(firstCallResolutionRate),
        delivery_consistency: Number(deliveryConsistency),
        customer_satisfaction_score: Number(customerSatisfactionScore),
        nps_score: Number(npsScore),
        absenteeism_rate: Number(absenteeismRate),
        engagement_score: Number(engagementScore),
        operational_stress_level: Number(operationalStressLevel),
        notes: notes || null,
        metric_source: 'manual',
      };

      const res = await fetch('/api/v1/php/copc/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-org-id': effectiveOrgId!,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao criar métrica');
      }

      alert('✅ Métrica COPC criada com sucesso!');
      router.push('/php/copc');
    } catch (error: any) {
      console.error('Erro ao criar métrica:', error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- CSV IMPORT LOGIC ---
  const parseCsv = (text: string): { rows: CsvRow[]; errors: string[] } => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { rows: [], errors: ['CSV deve ter cabeçalho + pelo menos 1 linha de dados'] };

    const headerLine = lines[0].replace(/\r$/, '');
    const headers = headerLine.split(/[,;]/).map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

    const requiredCols = CSV_COLUMNS.filter((c) => c !== 'notes');
    const missing = requiredCols.filter((col) => !headers.includes(col));
    if (missing.length > 0) {
      return { rows: [], errors: [`Colunas obrigatórias ausentes: ${missing.join(', ')}`] };
    }

    const rows: CsvRow[] = [];
    const errors: string[] = [];
    const separator = headerLine.includes(';') ? ';' : ',';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].replace(/\r$/, '').trim();
      if (!line) continue;

      const values = line.split(separator).map((v) => v.trim().replace(/^['"]|['"]$/g, ''));
      const row: Record<string, number | string | undefined> = {};
      let lineHasError = false;

      headers.forEach((header, idx) => {
        if (CSV_COLUMNS.includes(header as (typeof CSV_COLUMNS)[number])) {
          if (header === 'notes') {
            row[header] = values[idx] || undefined;
          } else {
            const num = parseFloat(values[idx]);
            if (isNaN(num)) {
              errors.push(`Linha ${i + 1}: valor inválido para "${header}" = "${values[idx]}"`);
              lineHasError = true;
            } else {
              row[header] = num;
            }
          }
        }
      });

      if (!lineHasError) {
        const r = row as Record<string, number>;
        if (r.quality_score < 0 || r.quality_score > 100) { errors.push(`Linha ${i + 1}: quality_score deve ser 0-100`); lineHasError = true; }
        if (r.nps_score < -100 || r.nps_score > 100) { errors.push(`Linha ${i + 1}: nps_score deve ser -100 a 100`); lineHasError = true; }
        if (r.engagement_score < 1 || r.engagement_score > 5) { errors.push(`Linha ${i + 1}: engagement_score deve ser 1-5`); lineHasError = true; }
        if (r.operational_stress_level < 1 || r.operational_stress_level > 3) { errors.push(`Linha ${i + 1}: operational_stress_level deve ser 1-3`); lineHasError = true; }
      }

      if (!lineHasError) {
        rows.push(row as unknown as CsvRow);
      }
    }

    return { rows, errors };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvResult(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { rows, errors } = parseCsv(text);
      setCsvRows(rows);
      setCsvErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (!effectiveOrgId || csvRows.length === 0) return;
    setCsvImporting(true);
    let success = 0;
    let failed = 0;

    try {
      const token = (await getAuthToken()) ?? '';

      for (const row of csvRows) {
        try {
          const res = await fetch('/api/v1/php/copc/metrics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              'x-org-id': effectiveOrgId,
            },
            body: JSON.stringify({
              org_id: effectiveOrgId,
              ...row,
              notes: row.notes || null,
              metric_source: 'csv_import',
            }),
          });
          if (res.ok) success++;
          else failed++;
        } catch {
          failed++;
        }
      }

      setCsvResult({ success, failed });
      if (failed === 0) {
        setTimeout(() => router.push('/php/copc'), 2000);
      }
    } catch (error: any) {
      console.error('Erro na importação CSV:', error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setCsvImporting(false);
    }
  };

  return (
    <div className="p-6 bg-[#FAFAF8] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/php/copc"
            className="text-sm text-gray-600 hover:text-[#141042] mb-4 inline-block"
          >
            ← Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#141042]">Nova Métrica COPC</h1>
          <p className="text-gray-600 mt-1">
            Registre as 11 métricas operacionais e de bem-estar
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg border border-[#E5E5DC] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'manual'
                ? 'bg-[#141042] text-white'
                : 'text-gray-600 hover:text-[#141042] hover:bg-gray-50'
            }`}
          >
            ✏️ Entrada Manual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'csv'
                ? 'bg-[#141042] text-white'
                : 'text-gray-600 hover:text-[#141042] hover:bg-gray-50'
            }`}
          >
            📄 Importar CSV
          </button>
        </div>

        {/* === CSV Import Tab === */}
        {activeTab === 'csv' && (
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
              <h3 className="text-lg font-semibold text-[#141042] mb-4">📄 Upload de Arquivo CSV</h3>
              <p className="text-sm text-gray-600 mb-4">
                O CSV deve conter as 11 colunas obrigatórias. Separador: vírgula ou ponto-e-vírgula.
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E5E5DC] rounded-lg p-8 text-center cursor-pointer hover:border-[#141042] hover:bg-[#FAFAF8] transition-colors"
              >
                <div className="text-4xl mb-2">📁</div>
                <p className="text-sm text-gray-600">
                  Clique para selecionar um arquivo CSV
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  .csv — máx 1000 linhas
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Template */}
            <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
              <h3 className="text-lg font-semibold text-[#141042] mb-3">📋 Colunas Obrigatórias</h3>
              <div className="bg-[#FAFAF8] p-3 rounded-lg overflow-x-auto">
                <code className="text-xs text-gray-700 whitespace-nowrap">
                  quality_score,rework_rate,process_adherence_rate,average_handle_time,first_call_resolution_rate,delivery_consistency,customer_satisfaction_score,nps_score,absenteeism_rate,engagement_score,operational_stress_level,notes
                </code>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-500">
                <span>quality_score: 0-100</span>
                <span>rework_rate: 0-100</span>
                <span>process_adherence_rate: 0-100</span>
                <span>average_handle_time: segundos</span>
                <span>first_call_resolution_rate: 0-100</span>
                <span>delivery_consistency: 0-100</span>
                <span>customer_satisfaction_score: 0-100</span>
                <span>nps_score: -100 a 100</span>
                <span>absenteeism_rate: 0-100</span>
                <span>engagement_score: 1-5</span>
                <span>operational_stress_level: 1-3</span>
                <span>notes: texto (opcional)</span>
              </div>
            </div>

            {/* Errors */}
            {csvErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-800 mb-2">⚠️ Erros encontrados ({csvErrors.length})</h4>
                <ul className="text-xs text-red-600 space-y-1 max-h-40 overflow-y-auto">
                  {csvErrors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview */}
            {csvRows.length > 0 && (
              <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
                <h3 className="text-lg font-semibold text-[#141042] mb-3">
                  ✅ {csvRows.length} registro{csvRows.length > 1 ? 's' : ''} válido{csvRows.length > 1 ? 's' : ''}
                </h3>
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#FAFAF8] sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left text-gray-600">#</th>
                        <th className="px-2 py-1 text-left text-gray-600">Quality</th>
                        <th className="px-2 py-1 text-left text-gray-600">Rework</th>
                        <th className="px-2 py-1 text-left text-gray-600">Adherence</th>
                        <th className="px-2 py-1 text-left text-gray-600">AHT</th>
                        <th className="px-2 py-1 text-left text-gray-600">FCR</th>
                        <th className="px-2 py-1 text-left text-gray-600">Delivery</th>
                        <th className="px-2 py-1 text-left text-gray-600">CSAT</th>
                        <th className="px-2 py-1 text-left text-gray-600">NPS</th>
                        <th className="px-2 py-1 text-left text-gray-600">Absent.</th>
                        <th className="px-2 py-1 text-left text-gray-600">Engage.</th>
                        <th className="px-2 py-1 text-left text-gray-600">Stress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-2 py-1 text-gray-400">{i + 1}</td>
                          <td className="px-2 py-1">{row.quality_score}</td>
                          <td className="px-2 py-1">{row.rework_rate}</td>
                          <td className="px-2 py-1">{row.process_adherence_rate}</td>
                          <td className="px-2 py-1">{row.average_handle_time}</td>
                          <td className="px-2 py-1">{row.first_call_resolution_rate}</td>
                          <td className="px-2 py-1">{row.delivery_consistency}</td>
                          <td className="px-2 py-1">{row.customer_satisfaction_score}</td>
                          <td className="px-2 py-1">{row.nps_score}</td>
                          <td className="px-2 py-1">{row.absenteeism_rate}</td>
                          <td className="px-2 py-1">{row.engagement_score}</td>
                          <td className="px-2 py-1">{row.operational_stress_level}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvRows.length > 20 && (
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Mostrando 20 de {csvRows.length} registros
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Import Result */}
            {csvResult && (
              <div className={`p-4 rounded-lg border ${csvResult.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <p className="text-sm font-medium">
                  {csvResult.failed === 0
                    ? `✅ ${csvResult.success} métrica(s) importada(s) com sucesso! Redirecionando...`
                    : `⚠️ ${csvResult.success} sucesso, ${csvResult.failed} falha(s)`}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleCsvImport}
                disabled={csvRows.length === 0 || csvImporting || !effectiveOrgId}
                className="flex-1 px-6 py-3 bg-[#141042] text-white rounded-lg hover:bg-[#1a1554] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {csvImporting
                  ? 'Importando...'
                  : `📤 Importar ${csvRows.length} Registro${csvRows.length !== 1 ? 's' : ''}`}
              </button>
              <Link
                href="/php/copc"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancelar
              </Link>
            </div>
          </div>
        )}

        {/* === Manual Tab === */}
        {activeTab === 'manual' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quality (35%) */}
          <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
            <h3 className="text-lg font-semibold text-[#141042] mb-4">
              📊 Qualidade (35%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Score (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={qualityScore}
                  onChange={(e) => setQualityScore(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 92.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rework Rate (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={reworkRate}
                  onChange={(e) => setReworkRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 5.2"
                />
              </div>
            </div>
          </div>

          {/* Efficiency (20%) */}
          <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
            <h3 className="text-lg font-semibold text-[#141042] mb-4">
              ⚡ Eficiência (20%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Process Adherence Rate (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={processAdherenceRate}
                  onChange={(e) =>
                    setProcessAdherenceRate(Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 88.3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Average Handle Time (segundos)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={averageHandleTime}
                  onChange={(e) =>
                    setAverageHandleTime(Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 360"
                />
              </div>
            </div>
          </div>

          {/* Effectiveness (20%) */}
          <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
            <h3 className="text-lg font-semibold text-[#141042] mb-4">
              🎯 Efetividade (20%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Call Resolution Rate (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={firstCallResolutionRate}
                  onChange={(e) =>
                    setFirstCallResolutionRate(Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 78.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Consistency (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={deliveryConsistency}
                  onChange={(e) =>
                    setDeliveryConsistency(Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 94.2"
                />
              </div>
            </div>
          </div>

          {/* CX (15%) */}
          <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
            <h3 className="text-lg font-semibold text-[#141042] mb-4">
              😊 Customer Experience (15%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Satisfaction Score (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={customerSatisfactionScore}
                  onChange={(e) =>
                    setCustomerSatisfactionScore(Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 85.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NPS Score (-100 a 100)
                </label>
                <input
                  type="number"
                  min="-100"
                  max="100"
                  step="1"
                  value={npsScore}
                  onChange={(e) => setNpsScore(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 42"
                />
              </div>
            </div>
          </div>

          {/* People (10%) */}
          <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
            <h3 className="text-lg font-semibold text-[#141042] mb-4">
              👥 People & Bem-estar (10%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Absenteeism Rate (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={absenteeismRate}
                  onChange={(e) => setAbsenteeismRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 3.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Engagement Score (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={engagementScore}
                  onChange={(e) => setEngagementScore(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 4.2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operational Stress Level (1-3)
                </label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  step="1"
                  value={operationalStressLevel}
                  onChange={(e) =>
                    setOperationalStressLevel(Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="1, 2 ou 3"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
            <h3 className="text-lg font-semibold text-[#141042] mb-4">
              📝 Observações (Opcional)
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
              placeholder="Contexto adicional sobre as métricas..."
            />
          </div>

          {/* Preview Score */}
          {isFormValid() && (
            <div className="bg-linear-to-r from-blue-50 to-green-50 p-6 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    📊 Preview do COPC Score
                  </p>
                  <p className="text-4xl font-bold text-[#141042]">
                    {calculatePreviewScore().toFixed(1)}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-600">
                  <p>Qualidade: {(Number(qualityScore) * 0.35).toFixed(1)}</p>
                  <p>
                    Eficiência:{' '}
                    {(Number(processAdherenceRate) * 0.2).toFixed(1)}
                  </p>
                  <p>
                    Efetividade:{' '}
                    {(Number(firstCallResolutionRate) * 0.2).toFixed(1)}
                  </p>
                  <p>
                    CX: {(Number(customerSatisfactionScore) * 0.15).toFixed(1)}
                  </p>
                  <p>
                    People:{' '}
                    {((100 - Number(absenteeismRate)) * 0.1).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className="flex-1 px-6 py-3 bg-[#141042] text-white rounded-lg hover:bg-[#1a1554] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Salvando...' : '💾 Salvar Métrica'}
            </button>
            <Link
              href="/php/copc"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
