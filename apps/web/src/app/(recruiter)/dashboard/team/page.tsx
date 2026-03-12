'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Users, UserPlus, Mail, Trash2, Shield, AlertCircle } from 'lucide-react';
import { getAuthToken, createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  role: string; // role em org_members
  created_at: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  recruiter: 'Recrutador',
  viewer: 'Visualizador',
};

const roleColors: Record<string, string> = {
  admin: 'bg-[#141042]/10 text-[#141042]',
  manager: 'bg-purple-100 text-purple-700',
  recruiter: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  viewer: 'bg-[#FAFAF8] text-[#666666] border border-[#E5E5DC]',
};

export default function TeamPage() {
  const { currentOrg } = useOrgStore();
  // orgId resolvido localmente para não depender do timing do store global
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(null);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite state
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('recruiter');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Edit role state
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState('recruiter');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  // Remove state
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Resolve orgId: prioriza store, fallback para busca direta
  useEffect(() => {
    if (currentOrg?.id) {
      setResolvedOrgId(currentOrg.id);
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .neq('status', 'inactive')
        .limit(1)
        .maybeSingle();
      if (data?.org_id) setResolvedOrgId(data.org_id);
    })();
  }, [currentOrg?.id]);

  useEffect(() => {
    if (resolvedOrgId) loadTeamMembers();
  }, [resolvedOrgId]);

  async function getHeaders() {
    const token = await getAuthToken();
    const orgId = resolvedOrgId ?? currentOrg?.id;
    if (!token || !orgId) return null;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-org-id': orgId,
    };
  }

  async function loadTeamMembers() {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch('/api/v1/team/members', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(await res.text());
      setTeamMembers(await res.json());
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Erro ao carregar membros da equipe');
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);

    const headers = await getHeaders();
    if (!headers) {
      setInviteError('Selecione uma organização antes de convidar.');
      return;
    }

    try {
      setInviting(true);
      const res = await fetch('/api/v1/team/invite', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error || 'Erro ao convidar membro');
        return;
      }

      toast.success(`${data.member.full_name || inviteEmail} adicionado(a) à equipe!`);
      setInviteEmail('');
      setInviteRole('recruiter');
      setInviteDialogOpen(false);
      await loadTeamMembers();
    } catch {
      setInviteError('Erro inesperado. Tente novamente.');
    } finally {
      setInviting(false);
    }
  }

  function openEditDialog(member: TeamMember) {
    setEditMember(member);
    setEditRole(member.role || member.user_type);
    setEditDialogOpen(true);
  }

  async function handleEditRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editMember) return;

    const headers = await getHeaders();
    if (!headers) return;

    try {
      setEditing(true);
      const res = await fetch(`/api/v1/team/members/${editMember.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role: editRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao atualizar função');
        return;
      }

      toast.success('Função atualizada com sucesso!');
      setEditDialogOpen(false);
      setEditMember(null);
      await loadTeamMembers();
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setEditing(false);
    }
  }

  function openRemoveDialog(member: TeamMember) {
    setRemoveMember(member);
    setRemoveDialogOpen(true);
  }

  async function handleRemove() {
    if (!removeMember) return;

    const headers = await getHeaders();
    if (!headers) return;

    try {
      setRemoving(true);
      const res = await fetch(`/api/v1/team/members/${removeMember.id}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao remover membro');
        return;
      }

      toast.success(`${removeMember.full_name || 'Membro'} removido(a) da equipe.`);
      setRemoveDialogOpen(false);
      setRemoveMember(null);
      await loadTeamMembers();
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setRemoving(false);
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DashboardHeader
        title="Equipe"
        subtitle="Gerencie os membros da sua organização"
        actions={
          <Dialog open={inviteDialogOpen} onOpenChange={(v) => { setInviteDialogOpen(v); setInviteError(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-[#141042] hover:bg-[#1a1554] text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-[#141042]">Convidar Membro da Equipe</DialogTitle>
                <DialogDescription className="text-[#666666]">
                  O usuário precisa ter uma conta no TalentForge para ser adicionado.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                {inviteError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {inviteError}
                  </div>
                )}
                <div>
                  <Label htmlFor="email" className="text-[#141042]">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="border-[#E5E5DC] focus:ring-[#141042] mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="text-[#141042]">Função</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="border-[#E5E5DC] mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="manager">Gestor</SelectItem>
                      <SelectItem value="recruiter">Recrutador</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#666666] mt-1.5">
                    Admins têm acesso total. Recrutadores gerenciam vagas e candidatos.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#E5E5DC] text-[#141042] hover:bg-[#FAFAF8]"
                    onClick={() => setInviteDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={inviting}
                    className="bg-[#141042] hover:bg-[#1a1554] text-white"
                  >
                    {inviting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Adicionar à Equipe
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#141042]">Editar Função</DialogTitle>
            <DialogDescription className="text-[#666666]">
              Altere a função de {editMember?.full_name || 'este membro'} na organização.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditRole} className="space-y-4">
            <div>
              <Label className="text-[#141042]">Nova Função</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="border-[#E5E5DC] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="recruiter">Recrutador</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-[#E5E5DC] text-[#141042]"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={editing}
                className="bg-[#141042] hover:bg-[#1a1554] text-white"
              >
                {editing && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#141042]">Remover Membro</DialogTitle>
            <DialogDescription className="text-[#666666]">
              Tem certeza que deseja remover{' '}
              <strong>{removeMember?.full_name || removeMember?.email}</strong> da organização?
              Esta ação pode ser desfeita readicionando o membro.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              className="border-[#E5E5DC] text-[#141042]"
              onClick={() => setRemoveDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              disabled={removing}
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRemove}
            >
              {removing && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              )}
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#E5E5DC] border-t-[#141042] mb-4" />
              <p className="text-sm text-[#666666]">Carregando equipe...</p>
            </div>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-sm p-12 text-center">
            <div className="w-14 h-14 bg-[#FAFAF8] border border-[#E5E5DC] rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-7 w-7 text-[#999999]" />
            </div>
            <h3 className="text-base font-semibold text-[#141042] mb-2">
              Nenhum membro na equipe
            </h3>
            <p className="text-sm text-[#666666]">
              Comece convidando membros para sua organização
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E5DC] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#141042]" />
              <h2 className="font-semibold text-[#141042]">Membros da Equipe</h2>
              <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-[#141042]/10 text-[#141042] rounded-full">
                {teamMembers.length}
              </span>
            </div>
            <div className="divide-y divide-[#E5E5DC]">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-[#141042] rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {(member.full_name || member.email)
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-[#141042]">
                          {member.full_name || 'Sem nome'}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[member.role] ?? roleColors[member.user_type] ?? roleColors.viewer}`}
                        >
                          {roleLabels[member.role] ?? roleLabels[member.user_type] ?? member.role}
                        </span>
                      </div>
                      <p className="text-sm text-[#666666]">{member.email}</p>
                      <p className="text-xs text-[#999999] mt-0.5">
                        Membro desde {formatDate(member.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditDialog(member)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#141042] border border-[#E5E5DC] rounded-lg hover:bg-[#FAFAF8] transition-colors"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Editar Função
                    </button>
                    <button
                      onClick={() => openRemoveDialog(member)}
                      className="p-1.5 text-[#DC2626] border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remover membro"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

