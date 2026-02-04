'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Users, 
  User, 
  UserPlus,
  UserMinus,
  Trash2,
  Edit2,
  Save,
  X,
  Crown,
  Shield,
  Check,
} from 'lucide-react';
import { useOrgStore } from '@/lib/store';

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role_in_team: 'member' | 'lead' | 'coordinator';
  joined_at: string;
  user?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

interface Team {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
  members: TeamMember[];
  manager?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
}

interface AvailableMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

const roleLabels: Record<string, string> = {
  member: 'Membro',
  lead: 'Líder',
  coordinator: 'Coordenador',
};

const roleColors: Record<string, string> = {
  member: 'bg-gray-100 text-gray-700',
  lead: 'bg-blue-100 text-blue-700',
  coordinator: 'bg-purple-100 text-purple-700',
};

const roleIcons: Record<string, React.ReactNode> = {
  member: <User className="w-3 h-3" />,
  lead: <Shield className="w-3 h-3" />,
  coordinator: <Crown className="w-3 h-3" />,
};

export default function TeamDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;
  const { currentOrg } = useOrgStore();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  
  const [showAddMember, setShowAddMember] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'member' | 'lead' | 'coordinator'>('member');

  const loadTeam = useCallback(async () => {
    if (!currentOrg?.id || !teamId) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/php/teams/${teamId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'x-org-id': currentOrg.id,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTeam(data);
        setEditForm({ name: data.name, description: data.description || '' });
      } else if (res.status === 404) {
        router.push('/php/teams');
      }
    } catch (error) {
      console.error('Erro ao carregar time:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, teamId, router]);

  const loadAvailableMembers = useCallback(async () => {
    if (!currentOrg?.id || !teamId) return;
    
    try {
      setLoadingAvailable(true);
      const res = await fetch(`/api/v1/php/teams/${teamId}/available-members`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'x-org-id': currentOrg.id,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAvailableMembers(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar membros disponíveis:', error);
    } finally {
      setLoadingAvailable(false);
    }
  }, [currentOrg?.id, teamId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    if (showAddMember) {
      loadAvailableMembers();
    }
  }, [showAddMember, loadAvailableMembers]);

  const handleSaveEdit = async () => {
    if (!currentOrg?.id || !team) return;
    
    try {
      setSaving(true);
      const res = await fetch(`/api/v1/php/teams/${team.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'x-org-id': currentOrg.id,
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
        }),
      });

      if (res.ok) {
        await loadTeam();
        setEditing(false);
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao salvar');
      }
    } catch (error) {
      alert('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!currentOrg?.id || !team) return;
    
    try {
      setAddingMember(true);
      const res = await fetch(`/api/v1/php/teams/${team.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'x-org-id': currentOrg.id,
        },
        body: JSON.stringify({
          user_id: userId,
          role_in_team: selectedRole,
        }),
      });

      if (res.ok) {
        await loadTeam();
        await loadAvailableMembers();
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao adicionar membro');
      }
    } catch (error) {
      alert('Erro de conexão');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!currentOrg?.id || !team) return;
    if (!confirm(`Remover ${userName} do time?`)) return;
    
    try {
      const res = await fetch(`/api/v1/php/teams/${team.id}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'x-org-id': currentOrg.id,
        },
      });

      if (res.ok) {
        await loadTeam();
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao remover membro');
      }
    } catch (error) {
      alert('Erro de conexão');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'member' | 'lead' | 'coordinator') => {
    if (!currentOrg?.id || !team) return;
    
    try {
      const res = await fetch(`/api/v1/php/teams/${team.id}/members/${userId}/role?role=${newRole}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'x-org-id': currentOrg.id,
        },
      });

      if (res.ok) {
        await loadTeam();
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao atualizar papel');
      }
    } catch (error) {
      alert('Erro de conexão');
    }
  };

  const handleDeleteTeam = async () => {
    if (!currentOrg?.id || !team) return;
    if (!confirm(`Tem certeza que deseja excluir o time "${team.name}"? Esta ação não pode ser desfeita.`)) return;

    try {
      const res = await fetch(`/api/v1/php/teams/${team.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'x-org-id': currentOrg.id,
        },
      });

      if (res.ok) {
        router.push('/php/teams');
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao excluir time');
      }
    } catch (error) {
      alert('Erro de conexão');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F4ED8]"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Time não encontrado</p>
        <button 
          onClick={() => router.push('/php/teams')}
          className="mt-4 text-[#1F4ED8] hover:underline"
        >
          Voltar para Times
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/php/teams')}
        className="flex items-center gap-2 text-gray-600 hover:text-[#1F4ED8] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para Times
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editForm.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-[#1F4ED8] text-white rounded-lg hover:bg-[#1845B8] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditForm({ name: team.name, description: team.description || '' });
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#1F4ED8]/10 rounded-xl">
                <Users className="w-8 h-8 text-[#1F4ED8]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
                {team.description && (
                  <p className="text-gray-600 mt-1">{team.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{team.member_count} membro(s)</span>
                  <span>Criado em {new Date(team.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#1F4ED8] hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={handleDeleteTeam}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Members Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Membros do Time</h2>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1F4ED8] text-white text-sm rounded-lg hover:bg-[#1845B8] transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Membro
          </button>
        </div>

        {team.members.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Nenhum membro no time</p>
            <button
              onClick={() => setShowAddMember(true)}
              className="mt-3 text-[#1F4ED8] hover:underline text-sm"
            >
              Adicionar primeiro membro
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {team.members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {member.user?.raw_user_meta_data?.avatar_url ? (
                      <img 
                        src={member.user.raw_user_meta_data.avatar_url} 
                        alt="" 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.user?.raw_user_meta_data?.full_name || member.user?.email || 'Usuário'}
                    </p>
                    <p className="text-sm text-gray-500">{member.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={member.role_in_team}
                    onChange={(e) => handleUpdateRole(member.user_id, e.target.value as any)}
                    className={`px-3 py-1.5 text-sm rounded-full border-0 cursor-pointer ${roleColors[member.role_in_team]}`}
                  >
                    <option value="member">Membro</option>
                    <option value="lead">Líder</option>
                    <option value="coordinator">Coordenador</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(
                      member.user_id, 
                      member.user?.raw_user_meta_data?.full_name || member.user?.email || 'Usuário'
                    )}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover do time"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Adicionar Membro</h2>
              <button
                onClick={() => setShowAddMember(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Papel no Time
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
              >
                <option value="member">Membro</option>
                <option value="lead">Líder</option>
                <option value="coordinator">Coordenador</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingAvailable ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1F4ED8] mx-auto"></div>
                </div>
              ) : availableMembers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Todos os membros da organização já estão no time</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {availableMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleAddMember(member.id)}
                      disabled={addingMember}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {member.avatar_url ? (
                            <img 
                              src={member.avatar_url} 
                              alt="" 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            {member.full_name || member.email}
                          </p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="p-2 text-[#1F4ED8] hover:bg-[#1F4ED8]/10 rounded-full">
                        <UserPlus className="w-5 h-5" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
