'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Building2, Save, User, Bell, Lock, Globe, ExternalLink, Upload, Instagram, Linkedin, MessageCircle, Trash2, Plus, Star, Pencil, GripVertical, Lightbulb, Calendar, CheckCircle2, XCircle, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { DEFAULT_REVIEW_PROMPT } from '@/lib/defaults';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';
import { WebhookManager } from '@/components';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

function SettingsPageContent() {
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
    // Tipografia por seção
    career_page_hero_font_color: '#ffffff',
    career_page_hero_text_align: 'right',
    career_page_hero_font_size: 'md',
    career_page_about_font_color: '#374151',
    career_page_about_text_align: 'left',
    career_page_about_font_size: 'md',
    career_page_jobs_font_color: '#141042',
    career_page_jobs_text_align: 'left',
    career_page_jobs_font_size: 'md',
    career_page_talent_font_color: '#141042',
    career_page_talent_text_align: 'left',
    career_page_talent_font_size: 'md',
    career_page_testimonials_font_color: '#141042',
    career_page_testimonials_text_align: 'center',
    career_page_testimonials_font_size: 'md',
    career_page_process_font_color: '#141042',
    career_page_process_text_align: 'left',
    career_page_process_font_size: 'md',
  });
  const [orgSlug, setOrgSlug] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [uploadingAsset, setUploadingAsset] = useState<'logo' | 'banner' | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<'logo' | 'banner' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<'logo' | 'banner' | null>(null);
  const [confirmDeleteTestimonialId, setConfirmDeleteTestimonialId] = useState<string | null>(null);
  const [confirmDeleteTipId, setConfirmDeleteTipId] = useState<string | null>(null);

  // Depoimentos
  type Testimonial = { id?: string; author_name: string; author_role: string; text: string; avatar_color: string; rating: number; display_order: number; };
  const AVATAR_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6','#ef4444','#14b8a6'];
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [savingTestimonial, setSavingTestimonial] = useState(false);
  const emptyTestimonial = (): Testimonial => ({ author_name: '', author_role: '', text: '', avatar_color: AVATAR_COLORS[testimonials.length % AVATAR_COLORS.length], rating: 5, display_order: testimonials.length });

  // Dicas para candidatos
  type Tip = { id?: string; title: string; summary: string; content: string; display_order: number; };
  const [tips, setTips] = useState<Tip[]>([]);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [showTipForm, setShowTipForm] = useState(false);
  const [savingTip, setSavingTip] = useState(false);
  const emptyTip = (): Tip => ({ title: '', summary: '', content: '', display_order: tips.length });

  // Prompt IA de avaliação
  const [aiPrompt, setAiPrompt] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState(DEFAULT_REVIEW_PROMPT);
  const [savingAiPrompt, setSavingAiPrompt] = useState(false);
  const [aiPromptSaved, setAiPromptSaved] = useState(false);
  const [loadingAiPrompt, setLoadingAiPrompt] = useState(false);

  // Google Calendar
  const [gcal, setGcal] = useState<{ connected: boolean; email: string | null; loading: boolean; connecting: boolean; error: string | null }>({
    connected: false, email: null, loading: true, connecting: false, error: null,
  });
  const searchParams = useSearchParams();

  const { currentOrg } = useOrgStore();

  const supabase = createClient();

  const loadGcalStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/google-calendar/status');
      const data = await res.json();
      setGcal(prev => ({ ...prev, connected: data.connected, email: data.email, loading: false }));
    } catch {
      setGcal(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadGcalStatus();
  }, [loadGcalStatus]);

  // Lê resultado do callback OAuth (?google=connected | ?google=error)
  useEffect(() => {
    const google = searchParams.get('google');
    const reason = searchParams.get('reason');
    if (google === 'connected') {
      loadGcalStatus();
    } else if (google === 'error') {
      const msgMap: Record<string, string> = {
        redirect_uri_mismatch: 'URL de callback não autorizada no Google. Contate o suporte.',
        invalid_client:        'Credenciais do Google Calendar inválidas. Contate o suporte.',
        access_denied:         'Acesso negado pelo usuário.',
        invalid_grant:         'Código de autorização expirado ou já utilizado. Tente novamente.',
        missing_params:        'Parâmetros inválidos no retorno do Google.',
        invalid_state:         'Sessão expirada. Tente conectar novamente.',
        token_exchange:        'Falha ao obter token do Google. Tente novamente.',
      };
      const msg = (reason && msgMap[reason]) || 'Erro ao conectar com o Google Calendar. Tente novamente.';
      setGcal(prev => ({ ...prev, error: msg, loading: false }));
    }
  }, [searchParams, loadGcalStatus]);

  async function handleConnectGoogleCalendar() {
    setGcal(prev => ({ ...prev, connecting: true, error: null }));
    try {
      const res = await fetch('/api/google-calendar/authorize');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setGcal(prev => ({ ...prev, error: data.error || 'Erro ao iniciar conexão com Google Calendar.', connecting: false }));
      }
    } catch {
      setGcal(prev => ({ ...prev, error: 'Erro ao conectar com Google Calendar.', connecting: false }));
    }
  }

  async function handleDisconnectGoogleCalendar() {
    try {
      await fetch('/api/google-calendar/disconnect', { method: 'POST' });
      setGcal(prev => ({ ...prev, connected: false, email: null }));
    } catch {
      alert('Erro ao desconectar Google Calendar');
    }
  }

  useEffect(() => {
    loadData();
    loadAiSettings();
  }, []);

  async function loadAiSettings() {
    try {
      setLoadingAiPrompt(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const orgId = localStorage.getItem('selected_org_id');
      if (!orgId) return;
      const res = await fetch('/api/recruiter/settings', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-org-id': orgId,
        },
      });
      const data = await res.json();
      // Fallback garantido: usa constante local se a API não retornar
      setDefaultPrompt(data.default_prompt || DEFAULT_REVIEW_PROMPT);
      setAiPrompt(data.review_prompt ?? '');
    } catch (err) {
      console.error('loadAiSettings error:', err);
      // Garante que o prompt padrão apareça mesmo se a API falhar
      setDefaultPrompt(DEFAULT_REVIEW_PROMPT);
    } finally {
      setLoadingAiPrompt(false);
    }
  }

  async function saveAiPrompt() {
    try {
      setSavingAiPrompt(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const orgId = localStorage.getItem('selected_org_id');
      if (!orgId) return;
      const res = await fetch('/api/recruiter/settings', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-org-id': orgId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_prompt: aiPrompt }),
      });
      if (res.ok) {
        setAiPromptSaved(true);
        setTimeout(() => setAiPromptSaved(false), 3000);
      }
    } catch (err) {
      console.error('saveAiPrompt error:', err);
    } finally {
      setSavingAiPrompt(false);
    }
  }

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
            // Tipografia por seção
            career_page_hero_font_color: org.career_page_hero_font_color || '#ffffff',
            career_page_hero_text_align: org.career_page_hero_text_align || 'right',
            career_page_hero_font_size: org.career_page_hero_font_size || 'md',
            career_page_about_font_color: org.career_page_about_font_color || '#374151',
            career_page_about_text_align: org.career_page_about_text_align || 'left',
            career_page_about_font_size: org.career_page_about_font_size || 'md',
            career_page_jobs_font_color: org.career_page_jobs_font_color || '#141042',
            career_page_jobs_text_align: org.career_page_jobs_text_align || 'left',
            career_page_jobs_font_size: org.career_page_jobs_font_size || 'md',
            career_page_talent_font_color: org.career_page_talent_font_color || '#141042',
            career_page_talent_text_align: org.career_page_talent_text_align || 'left',
            career_page_talent_font_size: org.career_page_talent_font_size || 'md',
            career_page_testimonials_font_color: org.career_page_testimonials_font_color || '#141042',
            career_page_testimonials_text_align: org.career_page_testimonials_text_align || 'center',
            career_page_testimonials_font_size: org.career_page_testimonials_font_size || 'md',
            career_page_process_font_color: org.career_page_process_font_color || '#141042',
            career_page_process_text_align: org.career_page_process_text_align || 'left',
            career_page_process_font_size: org.career_page_process_font_size || 'md',
          });
          setOrgSlug(org.slug || '');
          setOrgId(membership.org_id);

          // Carregar depoimentos
          const { data: tData } = await supabase
            .from('org_testimonials')
            .select('*')
            .eq('org_id', membership.org_id)
            .order('display_order', { ascending: true });
          if (tData) setTestimonials(tData);

          // Carregar dicas para candidatos
          const { data: tipData } = await supabase
            .from('org_career_tips')
            .select('*')
            .eq('org_id', membership.org_id)
            .order('display_order', { ascending: true });
          if (tipData) setTips(tipData);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function handleSaveTestimonial() {
    if (!editingTestimonial || !orgId) return;
    if (!editingTestimonial.author_name.trim() || !editingTestimonial.text.trim()) {
      alert('Nome e depoimento são obrigatórios.');
      return;
    }
    try {
      setSavingTestimonial(true);
      if (editingTestimonial.id) {
        const { error } = await supabase.from('org_testimonials').update({
          author_name: editingTestimonial.author_name,
          author_role: editingTestimonial.author_role,
          text: editingTestimonial.text,
          avatar_color: editingTestimonial.avatar_color,
          rating: editingTestimonial.rating,
        }).eq('id', editingTestimonial.id);
        if (error) throw error;
        setTestimonials(prev => prev.map(t => t.id === editingTestimonial.id ? editingTestimonial : t));
      } else {
        const { data, error } = await supabase.from('org_testimonials').insert({
          org_id: orgId,
          author_name: editingTestimonial.author_name,
          author_role: editingTestimonial.author_role,
          text: editingTestimonial.text,
          avatar_color: editingTestimonial.avatar_color,
          rating: editingTestimonial.rating,
          display_order: editingTestimonial.display_order,
        }).select().single();
        if (error) throw error;
        setTestimonials(prev => [...prev, data]);
      }
      setShowTestimonialForm(false);
      setEditingTestimonial(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar depoimento');
    } finally {
      setSavingTestimonial(false);
    }
  }

  async function handleDeleteTestimonial(id: string) {
    const { error } = await supabase.from('org_testimonials').delete().eq('id', id);
    if (!error) setTestimonials(prev => prev.filter(t => t.id !== id));
    setConfirmDeleteTestimonialId(null);
  }

  async function handleSaveTip() {
    if (!editingTip || !orgId) return;
    if (!editingTip.title.trim() || !editingTip.content.trim()) {
      alert('Título e conteúdo são obrigatórios.');
      return;
    }
    try {
      setSavingTip(true);
      if (editingTip.id) {
        const { error } = await supabase.from('org_career_tips').update({
          title: editingTip.title,
          summary: editingTip.summary,
          content: editingTip.content,
        }).eq('id', editingTip.id);
        if (error) throw error;
        setTips(prev => prev.map(t => t.id === editingTip.id ? editingTip : t));
      } else {
        const { data, error } = await supabase.from('org_career_tips').insert({
          org_id: orgId,
          title: editingTip.title,
          summary: editingTip.summary,
          content: editingTip.content,
          display_order: editingTip.display_order,
        }).select().single();
        if (error) throw error;
        setTips(prev => [...prev, data]);
      }
      setShowTipForm(false);
      setEditingTip(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar dica');
    } finally {
      setSavingTip(false);
    }
  }

  async function handleDeleteTip(id: string) {
    const { error } = await supabase.from('org_career_tips').delete().eq('id', id);
    if (!error) setTips(prev => prev.filter(t => t.id !== id));
    setConfirmDeleteTipId(null);
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

  /** Extrai o path do Storage a partir da URL pública (ex: "orgId/logo_123.jpeg") */
  function extractStoragePath(url: string): string | null {
    const match = url.match(/org-assets\/(.+?)(?:\?|$)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  async function handleDeleteAsset(type: 'logo' | 'banner') {
    if (!orgId) return;
    setConfirmDelete(null);
    try {
      setDeletingAsset(type);
      const currentUrl = type === 'logo' ? careerPage.career_page_logo_url : careerPage.career_page_banner_url;
      // Remove pelo path exato extraído da URL (garante remover o arquivo com timestamp)
      const pathsToRemove: string[] = [];
      if (currentUrl) {
        const extracted = extractStoragePath(currentUrl);
        if (extracted) pathsToRemove.push(extracted);
      }
      // Fallback: tenta também o nome legado sem timestamp
      pathsToRemove.push(`${orgId}/${type}.jpeg`);
      await supabase.storage.from('org-assets').remove(pathsToRemove);
      // Limpa a URL no estado e salva no banco
      if (type === 'logo') {
        setCareerPage((prev) => ({ ...prev, career_page_logo_url: '' }));
      } else {
        setCareerPage((prev) => ({ ...prev, career_page_banner_url: '' }));
      }
      // Persiste a remoção no banco imediatamente
      await supabase.from('organizations').update(
        type === 'logo'
          ? { career_page_logo_url: null }
          : { career_page_banner_url: null }
      ).eq('id', orgId);
    } catch (err: any) {
      alert(err.message || 'Erro ao remover imagem');
    } finally {
      setDeletingAsset(null);
    }
  }

  async function compressImage(file: File, maxWidth: number, maxSizeBytes: number, mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        // Para PNG: preserva canal alpha (não preenche fundo)
        // Para JPEG: canvas já tem fundo preto por padrão, ok para banners
        ctx.drawImage(img, 0, 0, width, height);
        // PNG é lossless — usa qualidade máxima; JPEG reduz até caber
        let quality = 0.85;
        const tryBlob = (q: number) => {
          canvas.toBlob((blob) => {
            if (!blob) { reject(new Error('Falha ao comprimir imagem')); return; }
            if (blob.size <= maxSizeBytes || q <= 0.3) { resolve(blob); return; }
            tryBlob(q - 0.1);
          }, mimeType, mimeType === 'image/png' ? undefined : q);
        };
        tryBlob(quality);
      };
      img.onerror = () => reject(new Error('Falha ao ler imagem'));
      img.src = url;
    });
  }

  async function handleUploadAsset(file: File, type: 'logo' | 'banner') {
    if (!orgId) { alert('Organização não carregada ainda.'); return; }

    // Validação de tipo
    if (!file.type.startsWith('image/')) {
      alert('Apenas imagens são permitidas (JPEG, PNG, WebP).');
      return;
    }

    const MAX_BYTES = 4 * 1024 * 1024; // 4MB (margem de segurança abaixo do limite 5MB do bucket)
    const maxWidth = type === 'logo' ? 800 : 1920;

    // Para logos: preservar PNG para manter transparência; banners sempre JPEG
    const isPng = file.type === 'image/png';
    const uploadMime: 'image/jpeg' | 'image/png' = (type === 'logo' && isPng) ? 'image/png' : 'image/jpeg';
    const ext = uploadMime === 'image/png' ? 'png' : 'jpeg';

    try {
      setUploadingAsset(type);

      // Comprime se necessário (PNG: apenas redimensiona; JPEG: reduz qualidade)
      let uploadBlob: Blob = file;
      if (file.size > MAX_BYTES || (uploadMime === 'image/jpeg' && file.type !== 'image/jpeg')) {
        uploadBlob = await compressImage(file, maxWidth, MAX_BYTES, uploadMime);
      } else if (uploadMime === 'image/png' && file.size > MAX_BYTES) {
        uploadBlob = await compressImage(file, maxWidth, MAX_BYTES, 'image/png');
      }

      // Remove o arquivo anterior (garante que o CDN não sirvam a versão cacheada)
      const currentUrl = type === 'logo' ? careerPage.career_page_logo_url : careerPage.career_page_banner_url;
      if (currentUrl) {
        const oldPath = extractStoragePath(currentUrl);
        if (oldPath) await supabase.storage.from('org-assets').remove([oldPath]);
        // Fallback: remove também o nome legado
        await supabase.storage.from('org-assets').remove([`${orgId}/${type}.jpeg`, `${orgId}/${type}.png`]);
      }

      // Nome com timestamp garante URL única → bust de cache CDN
      const path = `${orgId}/${type}_${Date.now()}.${ext}`;
      const { error: upError } = await supabase.storage
        .from('org-assets')
        .upload(path, uploadBlob, { upsert: false, contentType: uploadMime });
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
    <>
    <ConfirmDialog
      open={confirmDeleteTestimonialId !== null}
      title="Remover depoimento"
      message="Esta ação não pode ser desfeita."
      confirmLabel="Remover"
      onConfirm={() => confirmDeleteTestimonialId && handleDeleteTestimonial(confirmDeleteTestimonialId)}
      onCancel={() => setConfirmDeleteTestimonialId(null)}
    />
    <ConfirmDialog
      open={confirmDeleteTipId !== null}
      title="Remover dica"
      message="Esta ação não pode ser desfeita."
      confirmLabel="Remover"
      onConfirm={() => confirmDeleteTipId && handleDeleteTip(confirmDeleteTipId)}
      onCancel={() => setConfirmDeleteTipId(null)}
    />
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
              <Label htmlFor="cp-headline">Chamada principal (linha 1 do hero)</Label>
              <Input
                id="cp-headline"
                value={careerPage.career_page_headline}
                onChange={(e) => setCareerPage({ ...careerPage, career_page_headline: e.target.value })}
                placeholder="Faça parte do time"
              />
              <p className="text-xs text-gray-400 mt-1">
                A linha 2 exibe automaticamente o nome da empresa na cor de destaque.
              </p>
            </div>

            <div>
              <Label htmlFor="cp-logo">Logo da empresa</Label>
              <div className="flex items-center gap-3">
                {careerPage.career_page_logo_url && (
                  <div className="relative group shrink-0">
                    <img src={careerPage.career_page_logo_url} alt="Logo" loading="lazy" className="h-10 w-10 object-contain rounded border border-[#E5E5DC]" />
                    {confirmDelete === 'logo' ? (
                      <div className="absolute -top-1 left-11 z-10 flex items-center gap-1 bg-white border border-[#E5E5DC] rounded-lg shadow-md px-2 py-1 whitespace-nowrap">
                        <span className="text-xs text-[#666] mr-1">Remover?</span>
                        <button type="button" onClick={() => handleDeleteAsset('logo')} disabled={deletingAsset !== null}
                          className="text-xs px-2 py-0.5 bg-[#EF4444] text-white rounded font-medium hover:bg-[#DC2626]">
                          {deletingAsset === 'logo' ? '...' : 'Sim'}
                        </button>
                        <button type="button" onClick={() => setConfirmDelete(null)}
                          className="text-xs px-2 py-0.5 border border-[#E5E5DC] rounded hover:bg-[#F5F5F0]">
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete('logo')}
                        disabled={deletingAsset !== null}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-[#EF4444] text-white rounded-full items-center justify-center hidden group-hover:flex transition-all"
                        title="Remover logo"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
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
                  <div className="relative group">
                    <img src={careerPage.career_page_banner_url} alt="Banner" loading="lazy" className="w-full h-24 object-cover rounded-lg border border-[#E5E5DC]" />
                    {confirmDelete === 'banner' ? (
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-white border border-[#E5E5DC] rounded-lg shadow-md px-2.5 py-1.5">
                        <span className="text-xs text-[#666]">Remover banner?</span>
                        <button type="button" onClick={() => handleDeleteAsset('banner')} disabled={deletingAsset !== null}
                          className="text-xs px-2.5 py-1 bg-[#EF4444] text-white rounded-md font-medium hover:bg-[#DC2626]">
                          {deletingAsset === 'banner' ? 'Removendo...' : 'Sim'}
                        </button>
                        <button type="button" onClick={() => setConfirmDelete(null)}
                          className="text-xs px-2.5 py-1 border border-[#E5E5DC] rounded-md hover:bg-[#F5F5F0]">
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete('banner')}
                        disabled={deletingAsset !== null}
                        className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-[#EF4444] text-white rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#DC2626]"
                        title="Remover banner"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remover banner
                      </button>
                    )}
                  </div>
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
                {/* WhatsApp — só número */}
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                  <div className="flex flex-1 rounded-lg border border-[#E5E5DC] overflow-hidden focus-within:ring-2 focus-within:ring-[#141042] bg-white">
                    <span className="px-3 py-2 bg-[#FAFAF8] text-[#999999] text-sm border-r border-[#E5E5DC] whitespace-nowrap select-none">
                      wa.me/
                    </span>
                    <input
                      type="tel"
                      className="flex-1 px-3 py-2 text-sm outline-none bg-white placeholder:text-[#CCCCCC]"
                      placeholder="5511999999999"
                      value={careerPage.career_page_whatsapp_url.replace('https://wa.me/', '')}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        setCareerPage({ ...careerPage, career_page_whatsapp_url: digits ? `https://wa.me/${digits}` : '' });
                      }}
                    />
                  </div>
                </div>

                {/* Instagram — só @username */}
                <div className="flex items-center gap-3">
                  <Instagram className="w-4 h-4 text-[#E1306C] shrink-0" />
                  <div className="flex flex-1 rounded-lg border border-[#E5E5DC] overflow-hidden focus-within:ring-2 focus-within:ring-[#141042] bg-white">
                    <span className="px-3 py-2 bg-[#FAFAF8] text-[#999999] text-sm border-r border-[#E5E5DC] whitespace-nowrap select-none">
                      instagram.com/
                    </span>
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 text-sm outline-none bg-white placeholder:text-[#CCCCCC]"
                      placeholder="nomedarede"
                      value={careerPage.career_page_instagram_url.replace('https://instagram.com/', '').replace(/^@/, '')}
                      onChange={(e) => {
                        const handle = e.target.value.replace(/^@/, '').replace(/\s/g, '');
                        setCareerPage({ ...careerPage, career_page_instagram_url: handle ? `https://instagram.com/${handle}` : '' });
                      }}
                    />
                  </div>
                </div>

                {/* LinkedIn — só slug da empresa */}
                <div className="flex items-center gap-3">
                  <Linkedin className="w-4 h-4 text-[#0077B5] shrink-0" />
                  <div className="flex flex-1 rounded-lg border border-[#E5E5DC] overflow-hidden focus-within:ring-2 focus-within:ring-[#141042] bg-white">
                    <span className="px-3 py-2 bg-[#FAFAF8] text-[#999999] text-sm border-r border-[#E5E5DC] whitespace-nowrap select-none">
                      linkedin.com/company/
                    </span>
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 text-sm outline-none bg-white placeholder:text-[#CCCCCC]"
                      placeholder="nome-da-empresa"
                      value={careerPage.career_page_linkedin_url.replace('https://linkedin.com/company/', '').replace(/\/$/, '')}
                      onChange={(e) => {
                        const slug = e.target.value.replace(/\s/g, '-').replace(/[^a-zA-Z0-9\-_]/g, '').replace(/\/+$/, '');
                        setCareerPage({ ...careerPage, career_page_linkedin_url: slug ? `https://linkedin.com/company/${slug}` : '' });
                      }}
                    />
                  </div>
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

            {/* Tipografia por seção */}
            <div className="border-t border-[#E5E5DC] pt-4">
              <p className="text-sm font-medium text-[#141042] mb-4">Tipografia por seção</p>
              <div className="space-y-5">
                {(
                  [
                    { key: 'hero',         label: 'Hero (cabeçalho)' },
                    { key: 'about',        label: 'Sobre a empresa' },
                    { key: 'jobs',         label: 'Vagas abertas' },
                    { key: 'talent',       label: 'Banco de talentos' },
                    { key: 'testimonials', label: 'Depoimentos' },
                    { key: 'process',      label: 'Processo seletivo / Dicas' },
                  ] as const
                ).map(({ key, label }) => {
                  const colorKey  = `career_page_${key}_font_color`  as keyof typeof careerPage;
                  const alignKey  = `career_page_${key}_text_align`  as keyof typeof careerPage;
                  const sizeKey   = `career_page_${key}_font_size`   as keyof typeof careerPage;
                  return (
                    <div key={key} className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5DC]">
                      <p className="text-xs font-semibold text-[#666666] uppercase tracking-wide mb-3">{label}</p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {/* Cor da fonte */}
                        <div>
                          <Label className="text-xs mb-1">Cor da fonte</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={careerPage[colorKey] as string}
                              onChange={(e) => setCareerPage({ ...careerPage, [colorKey]: e.target.value })}
                              className="h-9 w-12 rounded border border-[#E5E5DC] cursor-pointer p-1 shrink-0"
                            />
                            <Input
                              value={careerPage[colorKey] as string}
                              onChange={(e) => setCareerPage({ ...careerPage, [colorKey]: e.target.value })}
                              placeholder="#141042"
                              className="font-mono text-sm"
                            />
                          </div>
                        </div>
                        {/* Alinhamento */}
                        <div>
                          <Label className="text-xs mb-1">Alinhamento</Label>
                          <div className="flex gap-1">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                type="button"
                                onClick={() => setCareerPage({ ...careerPage, [alignKey]: align })}
                                className={`flex-1 py-2 text-xs rounded border transition-colors ${
                                  careerPage[alignKey] === align
                                    ? 'bg-[#141042] text-white border-[#141042]'
                                    : 'bg-white text-[#666666] border-[#E5E5DC] hover:border-[#141042]'
                                }`}
                              >
                                {align === 'left' ? 'Esq' : align === 'center' ? 'Centro' : 'Dir'}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Tamanho da fonte */}
                        <div>
                          <Label className="text-xs mb-1">Tamanho</Label>
                          <div className="flex gap-1">
                            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setCareerPage({ ...careerPage, [sizeKey]: size })}
                                className={`flex-1 py-2 text-xs rounded border transition-colors ${
                                  careerPage[sizeKey] === size
                                    ? 'bg-[#141042] text-white border-[#141042]'
                                    : 'bg-white text-[#666666] border-[#E5E5DC] hover:border-[#141042]'
                                }`}
                              >
                                {size.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

        {/* Depoimentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Depoimentos na Página de Carreiras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testimonials.length === 0 && !showTestimonialForm && (
              <p className="text-sm text-[#999999]">Nenhum depoimento cadastrado. Adicione para exibir na página de carreiras.</p>
            )}

            {/* Lista */}
            <div className="space-y-3">
              {testimonials.map((t) => (
                <div key={t.id} className="flex items-start gap-3 p-4 rounded-xl border border-[#E5E5DC] bg-[#FAFAF8]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
                    style={{ background: t.avatar_color }}>
                    {t.author_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#141042]">{t.author_name}</p>
                    {t.author_role && <p className="text-xs text-[#999999]">{t.author_role}</p>}
                    <p className="text-sm text-[#666666] mt-1 line-clamp-2">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex gap-0.5 mt-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-3 h-3 ${i <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditingTestimonial(t); setShowTestimonialForm(true); }}
                      className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#E5E5DC] text-[#666666] hover:text-[#141042] transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDeleteTestimonialId(t.id!)}
                      className="p-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 text-[#666666] hover:text-red-600 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulário inline */}
            {showTestimonialForm && editingTestimonial && (
              <div className="border border-[#E5E5DC] rounded-xl p-5 space-y-3 bg-white">
                <p className="font-semibold text-sm text-[#141042]">{editingTestimonial.id ? 'Editar depoimento' : 'Novo depoimento'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Nome *</Label>
                    <Input value={editingTestimonial.author_name}
                      onChange={e => setEditingTestimonial({ ...editingTestimonial, author_name: e.target.value })}
                      placeholder="Ex: Ana Carolina" />
                  </div>
                  <div>
                    <Label>Cargo / Título</Label>
                    <Input value={editingTestimonial.author_role}
                      onChange={e => setEditingTestimonial({ ...editingTestimonial, author_role: e.target.value })}
                      placeholder="Ex: Desenvolvedora de Software" />
                  </div>
                </div>
                <div>
                  <Label>Depoimento *</Label>
                  <Textarea rows={3} value={editingTestimonial.text}
                    onChange={e => setEditingTestimonial({ ...editingTestimonial, text: e.target.value })}
                    placeholder="O que essa pessoa diz sobre trabalhar na empresa..." />
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <Label>Estrelas</Label>
                    <div className="flex gap-1 mt-1">
                      {[1,2,3,4,5].map(i => (
                        <button key={i} type="button" onClick={() => setEditingTestimonial({ ...editingTestimonial, rating: i })}>
                          <Star className={`w-5 h-5 cursor-pointer transition-colors ${i <= editingTestimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Cor do avatar</Label>
                    <div className="flex gap-1.5 mt-1">
                      {AVATAR_COLORS.map(c => (
                        <button key={c} type="button"
                          onClick={() => setEditingTestimonial({ ...editingTestimonial, avatar_color: c })}
                          className={`w-6 h-6 rounded-full transition-all ${editingTestimonial.avatar_color === c ? 'ring-2 ring-offset-1 ring-[#141042] scale-110' : 'hover:scale-110'}`}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowTestimonialForm(false); setEditingTestimonial(null); }}>Cancelar</Button>
                  <Button onClick={handleSaveTestimonial} disabled={savingTestimonial}>
                    {savingTestimonial ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar
                  </Button>
                </div>
              </div>
            )}

            {!showTestimonialForm && (
              <Button variant="outline" onClick={() => { setEditingTestimonial(emptyTestimonial()); setShowTestimonialForm(true); }}
                className="w-full border-dashed">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar depoimento
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Dicas para Candidatos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Dicas para Candidatos na Página de Carreiras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tips.length === 0 && !showTipForm && (
              <p className="text-sm text-[#999999]">Nenhuma dica cadastrada. Adicione dicas personalizadas que os candidatos verão ao acessar sua página de carreiras.</p>
            )}

            {/* Lista */}
            <div className="space-y-3">
              {tips.map((t) => (
                <div key={t.id} className="flex items-start gap-3 p-4 rounded-xl border border-[#E5E5DC] bg-[#FAFAF8]">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#6366f115' }}>
                    <Lightbulb className="w-4 h-4 text-[#6366f1]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#141042]">{t.title}</p>
                    {t.summary && <p className="text-xs text-[#999999] mt-0.5 line-clamp-1">{t.summary}</p>}
                    {t.content && <p className="text-xs text-[#666666] mt-1 line-clamp-2">{t.content}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditingTip(t); setShowTipForm(true); }}
                      className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#E5E5DC] text-[#666666] hover:text-[#141042] transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDeleteTipId(t.id!)}
                      className="p-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 text-[#666666] hover:text-red-600 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulário inline */}
            {showTipForm && editingTip && (
              <div className="border border-[#E5E5DC] rounded-xl p-5 space-y-3 bg-white">
                <p className="font-semibold text-sm text-[#141042]">{editingTip.id ? 'Editar dica' : 'Nova dica'}</p>
                <div>
                  <Label>Título *</Label>
                  <Input value={editingTip.title}
                    onChange={e => setEditingTip({ ...editingTip, title: e.target.value })}
                    placeholder="Ex: Prepare seu currículo com atenção" />
                </div>
                <div>
                  <Label>Resumo <span className="text-[#999999] font-normal">(frase curta exibida no card)</span></Label>
                  <Input value={editingTip.summary}
                    onChange={e => setEditingTip({ ...editingTip, summary: e.target.value })}
                    placeholder="Ex: Destaque o que mais importa para a vaga" />
                </div>
                <div>
                  <Label>Conteúdo completo * <span className="text-[#999999] font-normal">(exibido quando o candidato clica na dica)</span></Label>
                  <Textarea rows={5} value={editingTip.content}
                    onChange={e => setEditingTip({ ...editingTip, content: e.target.value })}
                    placeholder="Explique em detalhes esta dica para os candidatos..." />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowTipForm(false); setEditingTip(null); }}>Cancelar</Button>
                  <Button onClick={handleSaveTip} disabled={savingTip}>
                    {savingTip ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar
                  </Button>
                </div>
              </div>
            )}

            {!showTipForm && (
              <Button variant="outline" onClick={() => { setEditingTip(emptyTip()); setShowTipForm(true); }}
                className="w-full border-dashed">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar dica
              </Button>
            )}
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

        {/* Google Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gcal.error && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{gcal.error}</span>
              </div>
            )}
            {gcal.loading ? (
              <div className="flex items-center gap-2 text-sm text-[#666666]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando conexão...
              </div>
            ) : gcal.connected ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">Conectado</p>
                    {gcal.email && (
                      <p className="text-sm text-green-600">{gcal.email}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnectGoogleCalendar}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 shrink-0"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg">
                <div>
                  <p className="font-medium text-[#141042]">Calendário não conectado</p>
                  <p className="text-sm text-[#666666]">Conecte para criar eventos de entrevista diretamente no Google Calendar</p>
                </div>
                <Button
                  onClick={handleConnectGoogleCalendar}
                  disabled={gcal.connecting}
                  className="shrink-0"
                >
                  {gcal.connecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  {gcal.connecting ? 'Redirecionando...' : 'Conectar Google Calendar'}
                </Button>
              </div>
            )}
            {searchParams.get('google') === 'error' && (
              <p className="mt-3 text-sm text-red-600">
                Erro ao conectar: {searchParams.get('reason') === 'token_exchange' ? 'falha ao trocar código de autorização' : searchParams.get('reason') ?? 'tente novamente'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Prompt IA de Avaliação */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Prompt de Avaliação por IA
            </CardTitle>
            <p className="text-sm text-[#666666] mt-1">
              Personalize as instruções que a IA usa ao gerar pareceres técnicos dos candidatos.
              Deixe em branco para usar o <strong>prompt padrão do sistema</strong>.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingAiPrompt ? (
              <div className="flex items-center gap-2 text-sm text-[#666666]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando configurações...
              </div>
            ) : (
              <>
                <div>
                  <Label className="mb-2 block">Seu prompt personalizado</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Deixe vazio para usar o prompt padrão do sistema."
                    rows={12}
                    className="font-mono text-sm resize-y"
                  />
                  <p className="text-xs text-[#999] mt-1">
                    Variáveis disponíveis: <code className="bg-gray-100 px-1 rounded">&#123;&#123;nome&#125;&#125;</code>,{' '}
                    <code className="bg-gray-100 px-1 rounded">&#123;&#123;cargo&#125;&#125;</code>,{' '}
                    <code className="bg-gray-100 px-1 rounded">&#123;&#123;disc&#125;&#125;</code>,{' '}
                    <code className="bg-gray-100 px-1 rounded">&#123;&#123;experiencias&#125;&#125;</code>,{' '}
                    <code className="bg-gray-100 px-1 rounded">&#123;&#123;anotacoes&#125;&#125;</code>,{' '}
                    <code className="bg-gray-100 px-1 rounded">&#123;&#123;contexto_recrutador&#125;&#125;</code>,{' '}
                    <code className="bg-gray-100 px-1 rounded">&#123;&#123;vagas&#125;&#125;</code>,{' '}
                    <code className="bg-gray-100 px-1 rounded">&#123;&#123;score_testes&#125;&#125;</code>,{' '}
                    <code className="bg-gray-100 px-1 rounded">&#123;&#123;score_experiencia&#125;&#125;</code> e outras.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={saveAiPrompt}
                    disabled={savingAiPrompt}
                  >
                    {savingAiPrompt ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                    ) : aiPromptSaved ? (
                      <><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />Salvo!</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" />Salvar Prompt</>  
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAiPrompt('')}
                    title="Limpar e usar o prompt padrão do sistema"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restaurar Padrão
                  </Button>
                </div>

                {/* Preview do prompt padrão */}
                <details className="group">
                  <summary className="cursor-pointer text-sm text-purple-600 hover:underline list-none flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Ver prompt padrão do sistema
                  </summary>
                  <div className="mt-3 rounded-xl bg-[#FAFAF8] border border-[#E5E5DC] p-4">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">{defaultPrompt}</pre>
                  </div>
                </details>
              </>
            )}
          </CardContent>
        </Card>

        {/* Webhooks */}
        <div className="col-span-1 md:col-span-2">
          <WebhookManager />
        </div>
      </div>
    </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <SettingsPageContent />
    </Suspense>
  );
}
