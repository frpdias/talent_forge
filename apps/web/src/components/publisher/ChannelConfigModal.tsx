'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { ChannelCode } from '@/lib/publisher/types';

interface ChannelConfigModalProps {
  orgId: string;
  channelCode: ChannelCode;
  channelName: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  helpUrl?: string;
  helpText?: string;
}

const CHANNEL_FIELDS: Record<ChannelCode, FieldDef[]> = {
  gupy: [
    {
      key: 'client_id',
      label: 'Client ID',
      placeholder: 'Seu client_id Gupy',
      helpText: 'Encontrado no painel de integrações da sua conta Gupy Enterprise',
    },
    {
      key: 'client_secret',
      label: 'Client Secret',
      placeholder: 'Seu client_secret Gupy',
      secret: true,
      helpText: 'Gerado junto ao Client ID no painel Gupy',
    },
    {
      key: 'company_id',
      label: 'Company ID',
      placeholder: 'ID da empresa na Gupy',
      helpText: 'Visível na URL do painel Gupy: gupy.io/companies/{company_id}',
    },
  ],
  vagas: [
    {
      key: 'api_key',
      label: 'API Key',
      placeholder: 'Sua API Key do Vagas.com for Business',
      secret: true,
      helpText: 'Disponível no painel de integrações da sua conta Vagas.com for Business',
    },
  ],
  linkedin: [
    {
      key: 'access_token',
      label: 'Access Token',
      placeholder: 'Token OAuth LinkedIn',
      secret: true,
      helpText: 'Requer participação no LinkedIn Talent Solutions Partner Program',
      helpUrl: 'https://developer.linkedin.com/product-catalog/talent',
    },
    {
      key: 'company_id',
      label: 'Company ID LinkedIn',
      placeholder: 'ID da empresa no LinkedIn',
      helpText: 'Visível na URL da página da empresa: linkedin.com/company/{id}',
    },
  ],
  indeed: [
    {
      key: 'api_key',
      label: 'API Key Indeed',
      placeholder: 'Sua API Key Indeed',
      secret: true,
    },
  ],
  catho: [
    {
      key: 'api_key',
      label: 'API Key Catho',
      placeholder: 'Sua API Key Catho',
      secret: true,
    },
  ],
  infojobs: [
    {
      key: 'api_key',
      label: 'API Key InfoJobs',
      placeholder: 'Sua API Key InfoJobs',
      secret: true,
    },
  ],
  facebook: [],
  instagram: [],
  custom: [
    {
      key: 'api_key',
      label: 'API Key',
      placeholder: 'Chave de autenticação',
      secret: true,
    },
  ],
};

const CHANNEL_ICONS: Record<ChannelCode, string> = {
  gupy: '🟣',
  vagas: '🔵',
  linkedin: '💼',
  facebook: '🔹',
  instagram: '📸',
  indeed: '🔷',
  catho: '🟠',
  infojobs: '🟡',
  custom: '🔧',
};

const TESTABLE_CHANNELS: ChannelCode[] = ['gupy', 'vagas'];

export function ChannelConfigModal({
  orgId,
  channelCode,
  channelName,
  isOpen,
  onClose,
  onSaved,
}: ChannelConfigModalProps) {
  const fields = CHANNEL_FIELDS[channelCode] || [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const supabase = createClient();

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTestResult(null);
  }

  function toggleSecret(key: string) {
    setShowSecret((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/v1/organizations/${orgId}/channels/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ channel_code: channelCode, credentials: values }),
      });

      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, message: 'Erro de conexão' });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    const hasValues = fields.some((f) => values[f.key]);
    if (!hasValues) {
      toast.error('Preencha ao menos um campo antes de salvar');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/v1/organizations/${orgId}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          channel_code: channelCode,
          display_name: channelName,
          credentials: values,
          config: {},
        }),
      });

      if (res.ok) {
        toast.success(`Canal ${channelName} configurado com sucesso`);
        onSaved();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setSaving(false);
    }
  }

  const isMetaOAuth = channelCode === 'facebook' || channelCode === 'instagram';

  function handleMetaOAuth() {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    if (!appId) {
      toast.error('META_APP_ID não configurado — contate o suporte');
      return;
    }
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/api/v1/organizations/${orgId}/channels/meta-oauth`
    );
    const scope = encodeURIComponent('pages_manage_posts,pages_read_engagement,instagram_content_publish');
    window.location.href = `https://www.facebook.com/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
  }

  if (!isOpen) return null;

  const canTest = TESTABLE_CHANNELS.includes(channelCode) && fields.some((f) => values[f.key]);

  return (
    <>
      <div
        className="fixed inset-0 z-70 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-71 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{CHANNEL_ICONS[channelCode]}</span>
              <div>
                <h2 className="text-sm font-semibold text-[#141042]">Configurar {channelName}</h2>
                <p className="text-xs text-gray-400">As credenciais ficam salvas com segurança</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Campos */}
          <div className="p-5 space-y-4">
            {isMetaOAuth && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  {channelCode === 'facebook'
                    ? 'Conecte sua Página do Facebook para publicar vagas automaticamente.'
                    : 'Conecte sua conta Instagram Business para publicar vagas.'}
                </p>
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  ⚠️ Requer aprovação do Meta para as permissões <code>pages_manage_posts</code>
                  {channelCode === 'instagram' ? ' e instagram_content_publish' : ''}. Processo: 14-28 dias.
                </p>
                <Button
                  className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm"
                  onClick={handleMetaOAuth}
                >
                  Conectar com Facebook
                </Button>
              </div>
            )}
            {!isMetaOAuth && fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">
                  {field.label}
                  {field.helpUrl && (
                    <a
                      href={field.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1.5 inline-flex items-center gap-0.5 text-[#3B82F6] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver docs
                    </a>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    type={field.secret && !showSecret[field.key] ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    value={values[field.key] || ''}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    className="text-sm pr-9"
                  />
                  {field.secret && (
                    <button
                      type="button"
                      onClick={() => toggleSecret(field.key)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecret[field.key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                {field.helpText && (
                  <p className="text-xs text-gray-400">{field.helpText}</p>
                )}
              </div>
            ))}

            {/* Resultado do teste */}
            {testResult && (
              <div
                className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                  testResult.ok
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 gap-3">
            {canTest ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleTest()}
                disabled={testing}
                className="text-xs"
              >
                {testing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                {testing ? 'Testando…' : 'Testar conexão'}
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                {isMetaOAuth ? 'Fechar' : 'Cancelar'}
              </Button>
              {!isMetaOAuth && (
                <Button
                  size="sm"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="bg-[#141042] hover:bg-[#1a1554] text-xs"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                  {saving ? 'Salvando…' : 'Salvar'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
