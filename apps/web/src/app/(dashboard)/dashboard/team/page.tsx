'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  admin: 'bg-purple-100 text-purple-700',
  recruiter: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-700',
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's organization
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) return;

      // Get all team members from the same organization
      const { data: members, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, user_type, created_at')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTeamMembers(members || []);
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

      // In a real implementation, this would send an invitation email
      // For now, we'll just show a success message
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
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Membro da Equipe</DialogTitle>
                <DialogDescription>
                  Envie um convite para um novo membro se juntar à sua organização
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Função</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="recruiter">Recrutador</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-2">
                    Administradores têm acesso total. Recrutadores podem gerenciar vagas e candidatos.
                    Visualizadores têm acesso apenas de leitura.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={inviting}>
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

      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#141042]" />
          </div>
        ) : teamMembers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum membro na equipe
              </h3>
              <p className="text-gray-500 mb-6">
                Comece convidando membros para sua organização
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membros da Equipe ({teamMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {teamMembers.map((member) => (
                  <div key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-[#141042] text-white">
                          {member.full_name
                            ?.split(' ')
                            .map(n => n[0])
                            .join('')
                            .slice(0, 2) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {member.full_name || 'Sem nome'}
                          </h4>
                          <Badge className={roleColors[member.user_type as keyof typeof roleColors]}>
                            {roleLabels[member.user_type as keyof typeof roleLabels] || member.user_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Membro desde {formatDate(member.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Shield className="h-4 w-4 mr-2" />
                        Editar Função
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
