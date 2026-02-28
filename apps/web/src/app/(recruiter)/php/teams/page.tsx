'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Users,
  UserPlus,
  Trash2,
  Edit2,
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
          <p className="text-[#666666] mt-1">
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
        <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-[#1F4ED8]" />
            </div>
            <div>
              <p className="text-sm text-[#666666]">Total de Times</p>
              <p className="text-2xl font-bold text-[#141042]">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-5 h-5 text-[#F97316]" />
            </div>
            <div>
              <p className="text-sm text-[#666666]">Total de Membros</p>
              <p className="text-2xl font-bold text-[#141042]">{stats.totalMembers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#999999]" />
          <input
            type="text"
            placeholder="Buscar times..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4ED8]"
          />
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F4ED8]"></div>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-12 text-center">
          <Users className="w-12 h-12 text-[#999999] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#141042] mb-2">
            {search ? 'Nenhum time encontrado' : 'Nenhum time cadastrado'}
          </h3>
          <p className="text-[#666666] mb-4">
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
              className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-4 hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-px transition-all duration-300 cursor-pointer group"
              onClick={() => router.push(`/php/teams/${team.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1F4ED8]/10 rounded-lg">
                    <Users className="w-6 h-6 text-[#1F4ED8]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#141042]">{team.name}</h3>
                    <p className="text-sm text-[#999999]">{team.member_count} membro(s)</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/php/teams/${team.id}`);
                    }}
                    className="p-1.5 text-[#666666] hover:text-[#1F4ED8] hover:bg-[#FAFAF8] rounded"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeam(team.id, team.name);
                    }}
                    className="p-1.5 text-[#666666] hover:text-red-600 hover:bg-[#FAFAF8] rounded"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {team.description && (
                <p className="text-sm text-[#666666] mb-3 line-clamp-2">
                  {team.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-[#999999] pt-3 border-t border-[#E5E5DC]">
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
          <div className="bg-white rounded-xl shadow-[0_8px_32px_rgba(20,16,66,0.16)] w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#141042] mb-4">Criar Novo Time</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#666666] mb-1">
                    Nome do Time *
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Ex: Equipe de Vendas"
                    className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4ED8]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#666666] mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Descreva o propósito deste time..."
                    rows={3}
                    className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4ED8] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#666666] mb-1">
                    Gestor do Time
                  </label>
                  <select
                    value={createForm.manager_id}
                    onChange={(e) => setCreateForm({ ...createForm, manager_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4ED8]"
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
                    className="flex-1 px-4 py-2 border border-[#E5E5DC] text-[#666666] rounded-lg hover:bg-[#FAFAF8] transition-colors"
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
