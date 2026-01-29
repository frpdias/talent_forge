'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface HeatmapData {
  user_id: string;
  user_name: string;
  collaboration_avg: number;
  communication_avg: number;
  adaptability_avg: number;
  accountability_avg: number;
  leadership_avg: number;
  overall_avg: number;
  assessment_count: number;
}

export default function CycleHeatmapPage() {
  const params = useParams();
  const router = useRouter();
  const cycleId = params.id as string;

  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof HeatmapData>('overall_avg');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const dimensions = [
    { key: 'collaboration_avg', label: 'Colaboração', short: 'COL' },
    { key: 'communication_avg', label: 'Comunicação', short: 'COM' },
    { key: 'adaptability_avg', label: 'Adaptabilidade', short: 'ADA' },
    { key: 'accountability_avg', label: 'Responsabilidade', short: 'RES' },
    { key: 'leadership_avg', label: 'Liderança', short: 'LID' },
  ];

  useEffect(() => {
    fetchHeatmapData();
  }, [cycleId]);

  const fetchHeatmapData = async () => {
    try {
      const response = await fetch(`/api/v1/php/tfci/cycles/${cycleId}/heatmap`);
      if (response.ok) {
        const data = await response.json();
        setHeatmapData(data);
      }
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null || score === 0) return 'bg-gray-100 text-gray-400';
    if (score >= 4.5) return 'bg-green-600 text-white';
    if (score >= 4) return 'bg-green-500 text-white';
    if (score >= 3.5) return 'bg-yellow-400 text-gray-900';
    if (score >= 3) return 'bg-orange-400 text-white';
    if (score >= 2) return 'bg-red-400 text-white';
    return 'bg-red-600 text-white';
  };

  const handleSort = (key: keyof HeatmapData) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const sortedData = [...heatmapData].sort((a, b) => {
    const aValue = a[sortBy] || 0;
    const bValue = b[sortBy] || 0;
    return sortOrder === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button
          onClick={() => router.push(`/php/tfci/cycles/${cycleId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Ciclo
        </button>

        <h1 className="text-3xl font-bold text-gray-900">Heatmap Comportamental</h1>
        <p className="text-gray-600 mt-2">
          Visualização agregada das médias de avaliação por colaborador
        </p>
      </div>

      {/* Legenda */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Legenda de Cores</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-red-600"></div>
            <span className="text-sm text-gray-700">1.0 - 1.9</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-red-400"></div>
            <span className="text-sm text-gray-700">2.0 - 2.9</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-orange-400"></div>
            <span className="text-sm text-gray-700">3.0 - 3.4</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-yellow-400"></div>
            <span className="text-sm text-gray-700">3.5 - 3.9</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-green-500"></div>
            <span className="text-sm text-gray-700">4.0 - 4.4</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-green-600"></div>
            <span className="text-sm text-gray-700">4.5 - 5.0</span>
          </div>
        </div>
      </div>

      {/* Heatmap Table */}
      {sortedData.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <p className="text-gray-600">Nenhum dado disponível ainda</p>
          <p className="text-sm text-gray-500 mt-2">
            As avaliações aparecerão aqui após serem enviadas
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colaborador
                  </th>
                  {dimensions.map((dim) => (
                    <th
                      key={dim.key}
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort(dim.key as keyof HeatmapData)}
                      title={dim.label}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {dim.short}
                        {sortBy === dim.key && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {sortOrder === 'asc' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                  ))}
                  <th
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('overall_avg')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Média Geral
                      {sortBy === 'overall_avg' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortOrder === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('assessment_count')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Avaliações
                      {sortBy === 'assessment_count' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortOrder === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedData.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.user_name}</div>
                      <div className="text-xs text-gray-500">{user.assessment_count} avaliações</div>
                    </td>
                    {dimensions.map((dim) => {
                      const score = user[dim.key as keyof HeatmapData] as number;
                      return (
                        <td key={dim.key} className="px-4 py-4 text-center">
                          <div
                            className={`inline-flex items-center justify-center w-12 h-12 rounded font-bold text-sm ${getScoreColor(score)}`}
                            title={`${dim.label}: ${score ? score.toFixed(2) : 'N/A'}`}
                          >
                            {score ? score.toFixed(1) : '—'}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-4 text-center">
                      <div
                        className={`inline-flex items-center justify-center w-14 h-14 rounded-lg font-bold text-lg ${getScoreColor(user.overall_avg)}`}
                      >
                        {user.overall_avg ? user.overall_avg.toFixed(1) : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {user.assessment_count}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      {sortedData.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Colaboradores Avaliados</div>
            <div className="text-3xl font-bold text-gray-900">{sortedData.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Média Geral da Organização</div>
            <div className="text-3xl font-bold text-gray-900">
              {(sortedData.reduce((sum, user) => sum + user.overall_avg, 0) / sortedData.length).toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Total de Avaliações</div>
            <div className="text-3xl font-bold text-gray-900">
              {sortedData.reduce((sum, user) => sum + user.assessment_count, 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
