'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Users, 
  User, 
  UserPlus,
  Trash2,
  Edit2,
  MoreVertical,
  Building2,
} from 'lucide-react';
import { useOrgStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';

interface Team {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

interface CreateTeamForm {
  name: string;
  description: string;
  manager_id: string;
}

export default function TeamsPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTeamForm>({ name: '', description: '', manager_id: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);

  const loadTeams = useCallback(async () => {
    if (!currentOrg?.id) return;

    try {
      setLoading(true);
      const { data: { session } } = await createClient().auth.getSession();
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await fetch(`/api/v1/php/teams?${params}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token || ''}`,
          'x-org-id': currentOrg.id,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTeams(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar times:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, search]);

  const loadOrgMembers = useCallback(async () => {
    if (!currentOrg?.id) return;

    try {
      const { data: { session } } = await createClient().auth.getSession();
      const res = await fetch(`/api/v1/organizations/${currentOrg.id}/members`, {
        headers: {
          Authorization: `Bearer ${session?.access_token || ''}`,
          'x-org-id': currentOrg.id,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setOrgMembers(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    loadTeams();
    loadOrgMembers();
  }, [loadTeams, loadOrgMembers]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?.id || !createForm.name.trim()) return;

    try {
      setCreating(true);
      setError(null);
      const { data: { session } } = await createClient().auth.getSession();

      const res = await fetch('/api/v1/php/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
          'x-org-id': currentOrg.id,
        },
        body: JSON.stringify({
          organization_id: currentOrg.id,
          name: createForm.name.trim(),
          description: createForm.description.trim() || null,
          manager_id: createForm.manager_id || null,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({ name: '', description: '', manager_id: '' });
        loadTeams();
      } else {
        const err = await res.json();
        setError(err.message || 'Erro ao criar time');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!currentOrg?.id) return;
    if (!confirm(`Tem certeza que deseja excluir o time "${teamName}"? Esta ação não pode ser desfeita.`)) return;

    try {
      const { data: { session } } = await createClient().auth.getSession();
      const res = await fetch(`/api/v1/php/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token || ''}`,
          'x-org-id': currentOrg.id,
        },
      });

      if (res.ok) {
        loadTeams();
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao excluir time');
      }
    } catch (error) {
      alert('Erro de conexão');
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(search.toLowerCase()) ||
    team.description?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: teams.length,
    totalMembers: teams.reduce((acc, t) => acc + t.member_count, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1F4ED8]">Times</h1>
          <p className="text-gray-600 mt-1">
            Gestão de equipes e agrupamento de colaboradores
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1F4ED8] text-white rounded-lg hover:bg-[#1845B8] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Time
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-[#1F4ED8]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Times</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-5 h-5 text-[#F97316]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Membros</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar times..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
          />
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F4ED8]"></div>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {search ? 'Nenhum time encontrado' : 'Nenhum time cadastrado'}
          </h3>
          <p className="text-gray-600 mb-4">
            {search 
              ? 'Tente ajustar sua busca' 
              : 'Crie seu primeiro time para começar a organizar seus colaboradores'}
          </p>
          {!search && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F4ED8] text-white rounded-lg hover:bg-[#1845B8] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Time
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => (
            <div 
              key={team.id} 
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => router.push(`/php/teams/${team.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1F4ED8]/10 rounded-lg">
                    <Users className="w-6 h-6 text-[#1F4ED8]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-500">{team.member_count} membro(s)</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/php/teams/${team.id}`);
                    }}
                    className="p-1.5 text-gray-500 hover:text-[#1F4ED8] hover:bg-gray-100 rounded"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeam(team.id, team.name);
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {team.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {team.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                <span>Criado em {new Date(team.created_at).toLocaleDateString('pt-BR')}</span>
                <span className="flex items-center gap-1">
                  <UserPlus className="w-3 h-3" />
                  Gerenciar
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Criar Novo Time</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Time *
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Ex: Equipe de Vendas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Descreva o propósito deste time..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gestor do Time
                  </label>
                  <select
                    value={createForm.manager_id}
                    onChange={(e) => setCreateForm({ ...createForm, manager_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
                  >
                    <option value="">Selecione um gestor (opcional)</option>
                    {orgMembers.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.user_profiles?.full_name || member.user_profiles?.email || member.user_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setError(null);
                      setCreateForm({ name: '', description: '', manager_id: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={creating}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !createForm.name.trim()}
                    className="flex-1 px-4 py-2 bg-[#1F4ED8] text-white rounded-lg hover:bg-[#1845B8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Criando...' : 'Criar Time'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
