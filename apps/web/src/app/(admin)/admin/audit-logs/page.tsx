'use client';

import { useState, useEffect } from 'react';
import { Shield, Search, Filter, RefreshCw, Download, Clock, User, FileText, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  resource: string;
  metadata: Record<string, any>;
  created_at: string;
  actor?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filtros
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Buscar logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (actionFilter) params.append('action', actionFilter);
      if (resourceFilter) params.append('resource', resourceFilter);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, actionFilter, resourceFilter, dateRange]);

  // Função para formatar data
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

  // Função para obter cor da ação
  const getActionColor = (action: string): string => {
    if (action.includes('create') || action.includes('insert')) return 'text-[#00AA55]';
    if (action.includes('update') || action.includes('edit')) return 'text-[#FFB800]';
    if (action.includes('delete') || action.includes('remove')) return 'text-[#FF3B30]';
    if (action.includes('login') || action.includes('auth')) return 'text-[#007AFF]';
    return 'text-[#8E8E93]';
  };

  // Função para exportar logs (CSV)
  const exportLogs = () => {
    const headers = ['Data/Hora', 'Usuário', 'Ação', 'Recurso', 'Metadados'];
    const rows = logs.map(log => [
      formatDate(log.created_at),
      log.actor?.email || log.actor_id,
      log.action,
      log.resource,
      JSON.stringify(log.metadata)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString()}.csv`;
    link.click();
  };

  // Filtro de busca local (nome ou email)
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(lowerSearch) ||
      log.resource.toLowerCase().includes(lowerSearch) ||
      log.actor?.email?.toLowerCase().includes(lowerSearch) ||
      log.actor?.raw_user_meta_data?.full_name?.toLowerCase().includes(lowerSearch)
    );
  });

  // Listas únicas para filtros
  const uniqueActions = Array.from(new Set(logs.map(log => log.action))).sort();
  const uniqueResources = Array.from(new Set(logs.map(log => log.resource))).sort();

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-[#141042]" />
          <h1 className="text-3xl font-bold text-[#141042]">Logs de Auditoria</h1>
        </div>
        <p className="text-[#8E8E93]">
          Histórico completo de ações e eventos do sistema
        </p>
      </div>

      {/* Filtros e Ações */}
      <div className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Buscar por ação, recurso ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
            />
          </div>

          {/* Filtro de Ação */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
          >
            <option value="">Todas as ações</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          {/* Filtro de Recurso */}
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
          >
            <option value="">Todos os recursos</option>
            {uniqueResources.map(resource => (
              <option key={resource} value={resource}>{resource}</option>
            ))}
          </select>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1552] transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={exportLogs}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-[#141042] text-[#141042] rounded-lg hover:bg-[#FAFAF8] transition"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtros de Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#141042] mb-2">
              Data Início
            </label>
            <input
              type="datetime-local"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#141042] mb-2">
              Data Fim
            </label>
            <input
              type="datetime-local"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <Activity className="w-8 h-8 text-[#141042]" />
            <span className="text-2xl font-bold text-[#141042]">{pagination.total}</span>
          </div>
          <p className="text-sm text-[#8E8E93] mt-2">Total de Eventos</p>
        </div>

        <div className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <User className="w-8 h-8 text-[#007AFF]" />
            <span className="text-2xl font-bold text-[#141042]">
              {new Set(logs.map(l => l.actor_id)).size}
            </span>
          </div>
          <p className="text-sm text-[#8E8E93] mt-2">Usuários Ativos</p>
        </div>

        <div className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <FileText className="w-8 h-8 text-[#FFB800]" />
            <span className="text-2xl font-bold text-[#141042]">{uniqueActions.length}</span>
          </div>
          <p className="text-sm text-[#8E8E93] mt-2">Tipos de Ação</p>
        </div>

        <div className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <Clock className="w-8 h-8 text-[#00AA55]" />
            <span className="text-2xl font-bold text-[#141042]">{uniqueResources.length}</span>
          </div>
          <p className="text-sm text-[#8E8E93] mt-2">Recursos Monitorados</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 text-[#141042] animate-spin" />
        </div>
      )}

      {/* Tabela de Logs */}
      {!loading && (
        <div className="bg-white border border-[#E5E5DC] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFAF8] border-b border-[#E5E5DC]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#141042]">Data/Hora</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#141042]">Usuário</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#141042]">Ação</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#141042]">Recurso</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#141042]">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5DC]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#8E8E93]">
                      Nenhum log encontrado
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAFAF8] transition">
                      <td className="px-6 py-4 text-sm text-[#141042]">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#141042]">
                            {log.actor?.raw_user_meta_data?.full_name || 'Sem nome'}
                          </span>
                          <span className="text-xs text-[#8E8E93]">
                            {log.actor?.email || log.actor_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#141042]">
                        {log.resource}
                      </td>
                      <td className="px-6 py-4">
                        <details className="cursor-pointer">
                          <summary className="text-sm text-[#007AFF] hover:underline">
                            Ver metadados
                          </summary>
                          <pre className="mt-2 text-xs bg-[#FAFAF8] p-2 rounded border border-[#E5E5DC] overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E5DC]">
              <p className="text-sm text-[#8E8E93]">
                Página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 border border-[#E5E5DC] rounded-lg text-sm font-medium text-[#141042] hover:bg-[#FAFAF8] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 bg-[#141042] text-white rounded-lg text-sm font-medium hover:bg-[#1a1552] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
