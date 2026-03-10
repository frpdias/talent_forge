'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Building2, Save, User, Bell, Lock, Globe, ExternalLink, Upload, Instagram, Linkedin, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';
import { WebhookManager } from '@/components';

export default function SettingsPage() {
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
  const [careerPage, setCareerPage] = useState({
    career_page_enabled: false,
    career_page_headline: '',
    career_page_logo_url: '',
    career_page_color: '#141042',
    career_page_secondary_color: '#10B981',
    career_page_banner_url: '',
    career_page_about: '',
    career_page_whatsapp_url: '',
    career_page_instagram_url: '',
    career_page_linkedin_url: '',
    career_page_show_contact: false,
  });
  const [orgSlug, setOrgSlug] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [uploadingAsset, setUploadingAsset] = useState<'logo' | 'banner' | null>(null);
  const { currentOrg } = useOrgStore();

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

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
          const org = membership.organizations as any;
          setOrgData({
            name: org.name || '',
            description: org.description || '',
            website: org.website || '',
            industry: org.industry || '',
          });
          setCareerPage({
            career_page_enabled: org.career_page_enabled ?? false,
            career_page_headline: org.career_page_headline || '',
            career_page_logo_url: org.career_page_logo_url || '',
            career_page_color: org.career_page_color || '#141042',
            career_page_secondary_color: org.career_page_secondary_color || '#10B981',
            career_page_banner_url: org.career_page_banner_url || '',
            career_page_about: org.career_page_about || '',
            career_page_whatsapp_url: org.career_page_whatsapp_url || '',
            career_page_instagram_url: org.career_page_instagram_url || '',
            career_page_linkedin_url: org.career_page_linkedin_url || '',
            career_page_show_contact: org.career_page_show_contact ?? false,
          });
          setOrgSlug(org.slug || '');
          setOrgId(membership.org_id);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function handleSaveCareerPage() {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let resolvedOrgId = orgId || currentOrg?.id || null;
      if (!resolvedOrgId) {
        const { data: m } = await supabase.from('org_members').select('org_id').eq('user_id', user.id).limit(1).maybeSingle();
        resolvedOrgId = m?.org_id || null;
      }
      if (!resolvedOrgId) throw new Error('Organização não encontrada.');
      const { error } = await supabase.from('organizations').update(careerPage).eq('id', resolvedOrgId);
      if (error) throw error;
      alert('Página de carreiras atualizada!');
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadAsset(file: File, type: 'logo' | 'banner') {
    if (!orgId) { alert('Organização não carregada ainda.'); return; }
    const ext = file.name.split('.').pop();
    const path = `${orgId}/${type}.${ext}`;
    try {
      setUploadingAsset(type);
      const { error: upError } = await supabase.storage
        .from('org-assets')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upError) throw upError;
      const { data: { publicUrl } } = supabase.storage.from('org-assets').getPublicUrl(path);
      if (type === 'logo') {
        setCareerPage((prev) => ({ ...prev, career_page_logo_url: publicUrl }));
      } else {
        setCareerPage((prev) => ({ ...prev, career_page_banner_url: publicUrl }));
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao fazer upload');
    } finally {
      setUploadingAsset(null);
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

      <div className="px-6 py-6 space-y-6">
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

        {/* Career Page */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Página de Carreiras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg border border-[#E5E5DC]">
              <div>
                <p className="font-medium text-[#141042]">Habilitar página pública</p>
                <p className="text-sm text-[#666666]">Candidatos externos poderão ver suas vagas abertas</p>
              </div>
              <input
                type="checkbox"
                checked={careerPage.career_page_enabled}
                onChange={(e) => setCareerPage({ ...careerPage, career_page_enabled: e.target.checked })}
                className="h-5 w-5 rounded border-[#E5E5DC] text-[#141042] focus:ring-[#141042] cursor-pointer"
              />
            </div>

            {careerPage.career_page_enabled && orgSlug && (
              <div className="flex items-center gap-2 text-sm text-[#3B82F6] bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>URL pública:</span>
                <a
                  href={`/jobs/${orgSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono underline truncate"
                >
                  /jobs/{orgSlug}
                </a>
              </div>
            )}

            <div>
              <Label htmlFor="cp-headline">Título da página (hero)</Label>
              <Input
                id="cp-headline"
                value={careerPage.career_page_headline}
                onChange={(e) => setCareerPage({ ...careerPage, career_page_headline: e.target.value })}
                placeholder="Ex: Venha trabalhar conosco!"
              />
            </div>

            <div>
              <Label htmlFor="cp-logo">Logo da empresa</Label>
              <div className="flex items-center gap-3">
                {careerPage.career_page_logo_url && (
                  <img src={careerPage.career_page_logo_url} alt="Logo" className="h-10 w-10 object-contain rounded border border-[#E5E5DC]" />
                )}
                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm hover:bg-[#F5F5F0] transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploadingAsset === 'logo' ? 'Enviando...' : 'Upload logo'}
                  <input type="file" accept="image/*" className="hidden"
                    disabled={uploadingAsset !== null}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadAsset(f, 'logo'); }} />
                </label>
                <span className="text-xs text-[#999]">ou</span>
                <Input
                  id="cp-logo"
                  value={careerPage.career_page_logo_url}
                  onChange={(e) => setCareerPage({ ...careerPage, career_page_logo_url: e.target.value })}
                  placeholder="https://... (URL direta)"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Banner da empresa</Label>
              <div className="space-y-2">
                {careerPage.career_page_banner_url && (
                  <img src={careerPage.career_page_banner_url} alt="Banner" className="w-full h-24 object-cover rounded-lg border border-[#E5E5DC]" />
                )}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm hover:bg-[#F5F5F0] transition-colors">
                    <Upload className="w-4 h-4" />
                    {uploadingAsset === 'banner' ? 'Enviando...' : 'Upload banner'}
                    <input type="file" accept="image/*" className="hidden"
                      disabled={uploadingAsset !== null}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadAsset(f, 'banner'); }} />
                  </label>
                  <Input
                    value={careerPage.career_page_banner_url}
                    onChange={(e) => setCareerPage({ ...careerPage, career_page_banner_url: e.target.value })}
                    placeholder="https://... (URL direta)"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cp-color">Cor primária</Label>
                <div className="flex items-center gap-3">
                  <input type="color" id="cp-color" value={careerPage.career_page_color}
                    onChange={(e) => setCareerPage({ ...careerPage, career_page_color: e.target.value })}
                    className="h-10 w-14 rounded border border-[#E5E5DC] cursor-pointer p-1" />
                  <Input value={careerPage.career_page_color}
                    onChange={(e) => setCareerPage({ ...careerPage, career_page_color: e.target.value })}
                    placeholder="#141042" className="font-mono" />
                </div>
              </div>
              <div>
                <Label htmlFor="cp-secondary">Cor secundária</Label>
                <div className="flex items-center gap-3">
                  <input type="color" id="cp-secondary" value={careerPage.career_page_secondary_color}
                    onChange={(e) => setCareerPage({ ...careerPage, career_page_secondary_color: e.target.value })}
                    className="h-10 w-14 rounded border border-[#E5E5DC] cursor-pointer p-1" />
                  <Input value={careerPage.career_page_secondary_color}
                    onChange={(e) => setCareerPage({ ...careerPage, career_page_secondary_color: e.target.value })}
                    placeholder="#10B981" className="font-mono" />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="cp-about">Sobre a empresa</Label>
              <Textarea
                id="cp-about"
                rows={4}
                value={careerPage.career_page_about}
                onChange={(e) => setCareerPage({ ...careerPage, career_page_about: e.target.value })}
                placeholder="Conte um pouco sobre sua empresa, cultura e missão..."
              />
            </div>

            <div className="border-t border-[#E5E5DC] pt-4">
              <p className="text-sm font-medium text-[#141042] mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Links de contato e redes sociais
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                  <Input value={careerPage.career_page_whatsapp_url}
                    onChange={(e) => setCareerPage({ ...careerPage, career_page_whatsapp_url: e.target.value })}
                    placeholder="https://wa.me/5511..." />
                </div>
                <div className="flex items-center gap-3">
                  <Instagram className="w-4 h-4 text-[#E1306C] shrink-0" />
                  <Input value={careerPage.career_page_instagram_url}
                    onChange={(e) => setCareerPage({ ...careerPage, career_page_instagram_url: e.target.value })}
                    placeholder="https://instagram.com/empresa" />
                </div>
                <div className="flex items-center gap-3">
                  <Linkedin className="w-4 h-4 text-[#0077B5] shrink-0" />
                  <Input value={careerPage.career_page_linkedin_url}
                    onChange={(e) => setCareerPage({ ...careerPage, career_page_linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/company/empresa" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5DC]">
                <div>
                  <p className="text-sm font-medium text-[#141042]">Exibir links na página pública</p>
                  <p className="text-xs text-[#666666]">Candidatos poderão ver os links de contato</p>
                </div>
                <input type="checkbox"
                  checked={careerPage.career_page_show_contact}
                  onChange={(e) => setCareerPage({ ...careerPage, career_page_show_contact: e.target.checked })}
                  className="h-5 w-5 rounded border-[#E5E5DC] text-[#141042] focus:ring-[#141042] cursor-pointer" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              {orgSlug && careerPage.career_page_enabled ? (
                <a
                  href={`/jobs/${orgSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#3B82F6] hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver página pública
                </a>
              ) : <div />}
              <Button onClick={handleSaveCareerPage} disabled={saving}>
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Página de Carreiras
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
                className="bg-[#FAFAF8]"
              />
              <p className="text-xs text-[#999999] mt-1">
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
                <p className="font-medium text-[#141042]">Novas candidaturas</p>
                <p className="text-sm text-[#666666]">
                  Receba emails quando houver novas candidaturas
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-[#E5E5DC] text-[#141042] focus:ring-[#141042]"
                defaultChecked
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#141042]">Avaliações concluídas</p>
                <p className="text-sm text-[#666666]">
                  Notificações quando candidatos completarem avaliações
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-[#E5E5DC] text-[#141042] focus:ring-[#141042]"
                defaultChecked
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#141042]">Resumo semanal</p>
                <p className="text-sm text-[#666666]">
                  Receba um resumo semanal das atividades
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-[#E5E5DC] text-[#141042] focus:ring-[#141042]"
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
