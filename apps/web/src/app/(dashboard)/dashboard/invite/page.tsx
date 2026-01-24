'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useOrgStore } from '@/lib/store';

type InviteLinkResponse = {
  token: string;
  expiresAt?: string | null;
  maxUses?: number | null;
  usesCount?: number | null;
};

export default function InvitePage() {
  const { currentOrg, setCurrentOrg } = useOrgStore();
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '');

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
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

  useEffect(() => {
    setError(null);
  }, [currentOrg?.id]);

  useEffect(() => {
    async function ensureOrg() {
      if (currentOrg?.id) return;
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) return;

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id, organizations(*)')
        .eq('user_id', sessionData.session.user.id)
        .limit(1)
        .maybeSingle();

      if (membership?.organizations) {
        setOrgName(membership.organizations.name || null);
        setCurrentOrg({
          id: membership.org_id,
          name: membership.organizations.name,
          orgType: membership.organizations.org_type,
          slug: membership.organizations.slug,
          role: membership.organizations.role,
        });
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', sessionData.session.user.id)
        .maybeSingle();
      if (profile?.full_name) {
        setRecruiterName(profile.full_name);
      }
    }

    ensureOrg();
  }, [currentOrg?.id, setCurrentOrg, supabase]);

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
    if (!apiBase) {
      setError('API URL nao configurada.');
      return;
    }
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

      const res = await fetch(`${apiBase}/api/v1/invite-links`, {
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
  }

  function handleSendEmail() {
    if (!inviteLink || !inviteEmail) return;
    const subject = encodeURIComponent('Convite para candidatura');
    const body = encodeURIComponent(inviteBody || '');
    window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#141042]">Convidar candidato</h1>
        <p className="text-sm text-[#666666] mt-1">
          Gere um link publico para cadastro do candidato.
        </p>
      </div>

      <div className="bg-white border border-[#E5E5DC] rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-sm text-[#666666]">Validade do convite</label>
          <p className="mt-1 text-sm text-[#333333]">48 horas · uso unico</p>
        </div>

        <button
          onClick={handleCreateInvite}
          disabled={loading}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#141042] text-white text-sm font-medium disabled:opacity-60"
        >
          {loading ? 'Gerando...' : 'Convidar'}
        </button>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {inviteLink && (
          <div className="space-y-2">
            <label className="text-sm text-[#666666]">Link gerado</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                className="flex-1 border border-[#E5E5DC] rounded-lg px-3 py-2 text-sm"
                value={inviteLink}
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 rounded-lg border border-[#E5E5DC] text-sm"
              >
                Copiar
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="email@exemplo.com"
                className="flex-1 border border-[#E5E5DC] rounded-lg px-3 py-2 text-sm"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <button
                onClick={handleSendEmail}
                className="px-3 py-2 rounded-lg border border-[#E5E5DC] text-sm"
                disabled={!inviteEmail}
              >
                Enviar email
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#666666]">Mensagem do email</label>
              <textarea
                className="w-full min-h-[220px] border border-[#E5E5DC] rounded-lg px-3 py-2 text-xs leading-relaxed"
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
  );
}
