'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-config';

type InviteStatus = {
  valid: boolean;
  orgId?: string;
  orgName?: string | null;
  expiresAt?: string | null;
  maxUses?: number | null;
  usesCount?: number | null;
  reason?: string;
};

type CandidateForm = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
};

export default function InviteCandidatePage() {
  const params = useParams();
  const token = useMemo(() => String(params?.token || ''), [params]);
  const apiBase = API_BASE_URL;

  const [status, setStatus] = useState<InviteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [form, setForm] = useState<CandidateForm>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    currentTitle: '',
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    if (!apiBase) {
      setError('API URL nao configurada.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/api/v1/invite-links/${token}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as InviteStatus;
        if (!res.ok) {
          throw new Error(data?.reason || 'Link invalido');
        }
        setStatus(data);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Erro ao validar convite');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [apiBase, token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!apiBase) {
      setError('API URL nao configurada.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/v1/invite-links/${token}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          location: form.location || undefined,
          currentTitle: form.currentTitle || undefined,
          tags: ['invite'],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Falha ao cadastrar');
      }

      setSuccessId(data?.id || 'ok');
    } catch (err: any) {
      setError(err?.message || 'Falha ao cadastrar');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#666666]">Validando convite...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white border border-[#E5E5DC] rounded-2xl p-6">
          <h1 className="text-xl font-semibold text-[#141042] mb-2">Convite</h1>
          <p className="text-[#666666]">{error}</p>
        </div>
      </div>
    );
  }

  if (!status?.valid) {
    const reason = status?.reason;
    const reasonText =
      reason === 'expired'
        ? 'Este link expirou.'
        : reason === 'inactive'
        ? 'Este link foi desativado.'
        : reason === 'max_uses'
        ? 'Este link ja foi utilizado o numero maximo de vezes.'
        : 'Este link nao esta mais ativo.';

    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white border border-[#E5E5DC] rounded-2xl p-6">
          <h1 className="text-xl font-semibold text-[#141042] mb-2">Convite invalido</h1>
          <p className="text-[#666666]">{reasonText}</p>
        </div>
      </div>
    );
  }

  if (successId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white border border-[#E5E5DC] rounded-2xl p-6 text-center">
          <h1 className="text-xl font-semibold text-[#141042] mb-2">Cadastro concluido</h1>
          <p className="text-[#666666]">Seu cadastro foi enviado com sucesso.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="max-w-md w-full bg-white border border-[#E5E5DC] rounded-2xl p-6">
        <h1 className="text-xl font-semibold text-[#141042] mb-2">Cadastro de Candidato</h1>
        <p className="text-sm text-[#666666] mb-6">
          Convite para {status.orgName || 'empresa'}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-[#666666]">Nome completo</label>
            <input
              className="w-full mt-1 border border-[#E5E5DC] rounded-lg px-3 py-2"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-[#666666]">Email</label>
            <input
              className="w-full mt-1 border border-[#E5E5DC] rounded-lg px-3 py-2"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-[#666666]">Telefone</label>
            <input
              className="w-full mt-1 border border-[#E5E5DC] rounded-lg px-3 py-2"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-[#666666]">Localizacao</label>
            <input
              className="w-full mt-1 border border-[#E5E5DC] rounded-lg px-3 py-2"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-[#666666]">Cargo atual</label>
            <input
              className="w-full mt-1 border border-[#E5E5DC] rounded-lg px-3 py-2"
              value={form.currentTitle}
              onChange={(e) => setForm({ ...form, currentTitle: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#141042] text-white rounded-lg py-2 mt-2 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? 'Enviando...' : 'Enviar cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
}
