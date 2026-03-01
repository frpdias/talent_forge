'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Users, UserPlus, Mail, Trash2, Shield } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  created_at: string;
}

const roleLabels = {
  admin: 'Administrador',
  recruiter: 'Recrutador',
  viewer: 'Visualizador',
};

const roleColors = {
  admin: 'bg-[#141042]/10 text-[#141042]',
  recruiter: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  viewer: 'bg-[#FAFAF8] text-[#666666] border border-[#E5E5DC]',
};

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('recruiter');
  const [dialogOpen, setDialogOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadTeamMembers();
  }, []);

  async function loadTeamMembers() {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/v1/team/members', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error(await res.text());

      const members = await res.json();
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();

    try {
      setInviting(true);
      alert(`Convite enviado para ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('recruiter');
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error inviting member:', error);
      alert(error.message || 'Erro ao enviar convite');
    } finally {
      setInviting(false);
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DashboardHeader
        title="Equipe"
        subtitle="Gerencie os membros da sua organização"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                  Envie um convite para um novo membro se juntar à sua organização
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-[#141042]">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="border-[#E5E5DC] focus:ring-[#141042]"
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="text-[#141042]">Função</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="border-[#E5E5DC]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="recruiter">Recrutador</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#666666] mt-2">
                    Administradores têm acesso total. Recrutadores podem gerenciar vagas e candidatos.
                    Visualizadores têm acesso apenas de leitura.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#E5E5DC] text-[#141042] hover:bg-[#FAFAF8]"
                    onClick={() => setDialogOpen(false)}
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
                    Enviar Convite
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

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
              <h2 className="font-semibold text-[#141042]">
                Membros da Equipe
              </h2>
              <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-[#141042]/10 text-[#141042] rounded-full">
                {teamMembers.length}
              </span>
            </div>
            <div className="divide-y divide-[#E5E5DC]">
              {teamMembers.map((member) => (
                <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#FAFAF8] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-[#141042] rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {member.full_name
                          ?.split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-[#141042]">
                          {member.full_name || 'Sem nome'}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[member.user_type as keyof typeof roleColors] || roleColors.viewer}`}>
                          {roleLabels[member.user_type as keyof typeof roleLabels] || member.user_type}
                        </span>
                      </div>
                      <p className="text-sm text-[#666666]">{member.email}</p>
                      <p className="text-xs text-[#999999] mt-0.5">
                        Membro desde {formatDate(member.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#141042] border border-[#E5E5DC] rounded-lg hover:bg-[#FAFAF8] transition-colors">
                      <Shield className="h-3.5 w-3.5" />
                      Editar Função
                    </button>
                    <button className="p-1.5 text-[#DC2626] border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
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
