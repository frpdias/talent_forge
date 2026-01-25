'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Building2, Save, User, Bell, Lock } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useOrgStore } from '@/lib/store';
import { WebhookManager } from '@/components';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orgData, setOrgData] = useState({
    name: '',
    description: '',
    website: '',
    industry: '',
  });
  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const { currentOrg } = useOrgStore();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserData({
          full_name: profile.full_name || '',
          email: user.email || '',
          phone: profile.phone || '',
        });

        const { data: membership } = await supabase
          .from('org_members')
          .select('org_id, organizations(*)')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (membership?.organizations) {
          const org = membership.organizations as { name?: string; description?: string; website?: string; industry?: string };
          setOrgData({
            name: org.name || '',
            description: org.description || '',
            website: org.website || '',
            industry: org.industry || '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveOrganization() {
    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let orgId = currentOrg?.id || null;
      if (!orgId) {
        const { data: membership } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        orgId = membership?.org_id || null;
      }

      if (!orgId) {
        throw new Error('Nenhuma organização vinculada ao usuário.');
      }

      const { data, error } = await supabase
        .from('organizations')
        .update(orgData)
        .eq('id', orgId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      if (!data) {
        throw new Error('Organizacao nao encontrada ou sem permissao.');
      }

      alert('Configurações da organização salvas com sucesso!');
    } catch (error: any) {
      console.error('Error saving organization:', error);
      const message =
        error?.message ||
        error?.details ||
        error?.hint ||
        'Erro ao salvar configurações';
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile() {
    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: userData.full_name,
          phone: userData.phone,
        })
        .eq('id', user.id);

      if (error) throw error;

      alert('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(error.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DashboardHeader
        title="Configurações"
        subtitle="Gerencie as configurações da sua conta e organização"
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="org-name">Nome da Organização</Label>
              <Input
                id="org-name"
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>

            <div>
              <Label htmlFor="org-industry">Setor</Label>
              <Input
                id="org-industry"
                value={orgData.industry}
                onChange={(e) => setOrgData({ ...orgData, industry: e.target.value })}
                placeholder="Ex: Tecnologia, Saúde, Educação"
              />
            </div>

            <div>
              <Label htmlFor="org-website">Website</Label>
              <Input
                id="org-website"
                type="url"
                value={orgData.website}
                onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                placeholder="https://www.exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="org-description">Descrição</Label>
              <Textarea
                id="org-description"
                rows={4}
                value={orgData.description}
                onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                placeholder="Descreva sua organização..."
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveOrganization} disabled={saving}>
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Organização
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil Pessoal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="user-name">Nome Completo</Label>
              <Input
                id="user-name"
                value={userData.full_name}
                onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                placeholder="Seu nome"
              />
            </div>

            <div>
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={userData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                O email não pode ser alterado
              </p>
            </div>

            <div>
              <Label htmlFor="user-phone">Telefone</Label>
              <Input
                id="user-phone"
                value={userData.phone}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Novas candidaturas</p>
                <p className="text-sm text-gray-500">
                  Receba emails quando houver novas candidaturas
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-[#141042] focus:ring-[#141042]"
                defaultChecked
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Avaliações concluídas</p>
                <p className="text-sm text-gray-500">
                  Notificações quando candidatos completarem avaliações
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-[#141042] focus:ring-[#141042]"
                defaultChecked
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Resumo semanal</p>
                <p className="text-sm text-gray-500">
                  Receba um resumo semanal das atividades
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-[#141042] focus:ring-[#141042]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline">
              Alterar Senha
            </Button>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <div className="col-span-1 md:col-span-2">
          <WebhookManager />
        </div>
      </div>
    </div>
  );
}
