'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';
import { API_BASE_URL } from '@/lib/api-config';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Link2, Copy, Send } from 'lucide-react';

type InviteLinkResponse = {
  token: string;
  expiresAt?: string | null;
  maxUses?: number | null;
  usesCount?: number | null;
};

export default function InvitePage() {
  const { currentOrg, setCurrentOrg } = useOrgStore();
  const apiBase = API_BASE_URL;

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const maxUses = 1;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [details, setDetails] = useState<InviteLinkResponse | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteBody, setInviteBody] = useState('');
  const [recruiterName, setRecruiterName] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setError(null);
  }, [currentOrg?.id]);

  // Sempre busca dados do recrutador logado e da org, independente do store
  useEffect(() => {
    let ignore = false;
    async function loadRecruiterData() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;
      const userId = sessionData.session.user.id;

      // Busca nome do recrutador
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
      if (!ignore && profile?.full_name) {
        setRecruiterName(profile.full_name);
      }

      // Se org ainda não está no store, busca e preenche
      if (!currentOrg?.id) {
        const { data: membership } = await supabase
          .from('org_members')
          .select('org_id, organizations(*)')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

        if (!ignore && membership?.organizations) {
          const org = membership.organizations as { name?: string; org_type?: string; slug?: string; role?: string };
          setOrgName(org.name || null);
          setCurrentOrg({
            id: membership.org_id,
            name: org.name || '',
            orgType: org.org_type || '',
            slug: org.slug || '',
            role: org.role || '',
          });
        }
      } else if (!ignore) {
        // Org já está no store — sincroniza orgName
        setOrgName(currentOrg.name || null);
      }
    }

    loadRecruiterData();
    return () => { ignore = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    if (!inviteLink) return;
    const name = recruiterName || 'Recrutador';
    const org = orgName || currentOrg?.name || 'Organizacao';
    const defaultBody = [
      'Ola,',
      '',
      'E um prazer convidar voce para se cadastrar no Talent Forge, nossa plataforma desenvolvida para conectar talentos a oportunidades de forma inteligente, segura e transparente.',
      '',
      'Por meio do link abaixo, voce podera concluir seu cadastro e acessar o ambiente da plataforma:',
      '',
      `👉 ${inviteLink}`,
      '',
      'O processo e rapido e leva apenas alguns minutos. Apos o cadastro, voce ja podera explorar os recursos disponiveis e dar inicio a sua jornada conosco.',
      '',
      'Em caso de duvidas, fico a disposicao para ajudar.',
      '',
      'Atenciosamente,',
      `${name}`,
      `Recrutador | ${org} || Talent Forge |`,
      'Conheca nossas solucoes acessando: www.farteck.app.br',
    ].join('\n');
    setInviteBody(defaultBody);
  }, [inviteLink, recruiterName, orgName, currentOrg?.name]);

  async function handleCreateInvite() {
    if (!currentOrg?.id) {
      setError('Selecione uma organizacao para gerar o convite.');
      return;
    }

    setLoading(true);
    setError(null);
    setInviteLink(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        throw new Error('Sessao expirada. Faça login novamente.');
      }

      const res = await fetch(`/api/v1/invite-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-org-id': currentOrg.id,
        },
        body: JSON.stringify({ maxUses }),
      });

      const data = (await res.json()) as InviteLinkResponse & { token?: string; error?: string };
      if (!res.ok) {
        throw new Error(data?.error || 'Falha ao criar link');
      }

      const baseUrl = window.location.origin;
      const link = `${baseUrl}/register?type=candidate&invite=${data.token}`;
      setInviteLink(link);
      setDetails(data);
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar convite');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSendEmail() {
    if (!inviteLink || !inviteEmail) return;
    const subject = encodeURIComponent('Convite para candidatura');
    const body = encodeURIComponent(inviteBody || '');
    window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DashboardHeader
        title="Convidar candidato"
        subtitle="Gere um link público para cadastro do candidato"
      />

      <div className="px-6 py-6 max-w-3xl">
        <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-sm p-6 space-y-5">
          {/* Validade */}
          <div className="flex items-center gap-3 p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5DC]">
            <Link2 className="w-4 h-4 text-[#666666] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#141042]">Validade do convite</p>
              <p className="text-xs text-[#666666] mt-0.5">48 horas · uso único</p>
            </div>
          </div>

          {/* Botão gerar */}
          <button
            onClick={handleCreateInvite}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141042] text-white text-sm font-medium hover:bg-[#1a1554] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Link2 className="w-4 h-4" />
            {loading ? 'Gerando...' : 'Gerar convite'}
          </button>

          {error && (
            <p className="text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          {inviteLink && (
            <div className="space-y-4 pt-2 border-t border-[#E5E5DC]">
              {/* Link gerado */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#141042]">Link gerado</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    className="flex-1 border border-[#E5E5DC] rounded-lg px-3 py-2 text-sm bg-[#FAFAF8] text-[#141042] focus:outline-none"
                    value={inviteLink}
                  />
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E5DC] text-sm text-[#141042] hover:bg-[#FAFAF8] transition-colors whitespace-nowrap"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Enviar por email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#141042]">Enviar por email</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    className="flex-1 border border-[#E5E5DC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={!inviteEmail}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E5E5DC] text-sm text-[#141042] hover:bg-[#FAFAF8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar email
                  </button>
                </div>
              </div>

              {/* Mensagem do email */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#141042]">Mensagem do email</label>
                <p className="text-xs text-[#666666]">Edite o texto antes de enviar</p>
                <textarea
                  className="w-full min-h-55 border border-[#E5E5DC] rounded-lg px-3 py-2 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all"
                  value={inviteBody}
                  onChange={(e) => setInviteBody(e.target.value)}
                />
              </div>

              {details?.expiresAt && (
                <p className="text-xs text-[#666666]">
                  Expira em: {new Date(details.expiresAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
