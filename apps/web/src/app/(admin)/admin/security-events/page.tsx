'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Search, RefreshCw, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  created_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SeverityStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export default function SecurityEventsPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState<SeverityStats>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (typeFilter) params.append('type', typeFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);

      const response = await fetch(`/api/admin/security-events?${params}`);
      const data = await response.json();

      if (data.success) {
        setEvents(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [pagination.page, typeFilter, severityFilter, dateRange]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-[#FF3B30] bg-red-50 border-red-200';
      case 'high': return 'text-[#FF9500] bg-orange-50 border-orange-200';
      case 'medium': return 'text-[#FFB800] bg-yellow-50 border-yellow-200';
      case 'low': return 'text-[#007AFF] bg-blue-50 border-blue-200';
      default: return 'text-[#8E8E93] bg-gray-50 border-gray-200';
    }
  };

  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return (
      event.type.toLowerCase().includes(lowerSearch) ||
      event.severity.toLowerCase().includes(lowerSearch) ||
      JSON.stringify(event.details).toLowerCase().includes(lowerSearch)
    );
  });

  const uniqueTypes = Array.from(new Set(events.map(e => e.type))).sort();
  const severityOptions = ['low', 'medium', 'high', 'critical'];

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-8 h-8 text-[#FF3B30]" />
          <h1 className="text-3xl font-bold text-[#141042]">Eventos de Segurança</h1>
        </div>
        <p className="text-[#8E8E93]">
          Monitoramento de ameaças e eventos críticos do sistema
        </p>
      </div>

      <div className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
          >
            <option value="">Todos os tipos</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
          >
            <option value="">Todas as severidades</option>
            {severityOptions.map(sev => (
              <option key={sev} value={sev}>{sev}</option>
            ))}
          </select>

          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1552] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <XCircle className="w-8 h-8 text-[#FF3B30]" />
            <span className="text-2xl font-bold text-[#FF3B30]">{stats.critical}</span>
          </div>
          <p className="text-sm text-[#FF3B30] font-medium mt-2">Críticos</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <AlertTriangle className="w-8 h-8 text-[#FF9500]" />
            <span className="text-2xl font-bold text-[#FF9500]">{stats.high}</span>
          </div>
          <p className="text-sm text-[#FF9500] font-medium mt-2">Alto</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <AlertCircle className="w-8 h-8 text-[#FFB800]" />
            <span className="text-2xl font-bold text-[#FFB800]">{stats.medium}</span>
          </div>
          <p className="text-sm text-[#FFB800] font-medium mt-2">Médio</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <CheckCircle className="w-8 h-8 text-[#007AFF]" />
            <span className="text-2xl font-bold text-[#007AFF]">{stats.low}</span>
          </div>
          <p className="text-sm text-[#007AFF] font-medium mt-2">Baixo</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 text-[#141042] animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5DC] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFAF8] border-b border-[#E5E5DC]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#141042]">Data/Hora</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#141042]">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#141042]">Severidade</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#141042]">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5DC]">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[#8E8E93]">
                      Nenhum evento encontrado
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-[#FAFAF8] transition">
                      <td className="px-6 py-4 text-sm text-[#141042]">
                        {formatDate(event.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[#141042]">
                          {event.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(event.severity)}`}>
                          {event.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <details className="cursor-pointer">
                          <summary className="text-sm text-[#007AFF] hover:underline">
                            Ver detalhes
                          </summary>
                          <pre className="mt-2 text-xs bg-[#FAFAF8] p-2 rounded border border-[#E5E5DC] overflow-x-auto">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
