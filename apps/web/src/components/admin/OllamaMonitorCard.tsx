'use client';

import { useState, useCallback } from 'react';
import {
  X,
  Cpu,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Terminal,
  Wifi,
  WifiOff,
  HelpCircle,
} from 'lucide-react';

interface OllamaStatus {
  configured: boolean;
  online: boolean;
  models: string[];
  url: string | null;
  model: string;
  error?: string;
}

const SCRIPT_MAC_MINI = `#!/bin/bash
# ~/start-ollama-tunnel.sh
# Sobe Ollama + ngrok para expor ao Vercel (planos free)

NGROK_URL="https://wakerife-noelle-merest.ngrok-free.dev"

pkill ollama 2>/dev/null
sleep 1

OLLAMA_ORIGINS="$NGROK_URL" \\
OLLAMA_HOST="0.0.0.0:11434" \\
ollama serve &

sleep 3
ngrok http 11434`;

const VERCEL_ENV = `OLLAMA_BASE_URL=https://wakerife-noelle-merest.ngrok-free.dev
OLLAMA_MODEL=gemma3:4b`;

const CMD_OLLAMA = `OLLAMA_ORIGINS="https://sua-url.ngrok-free.dev" \\
OLLAMA_HOST="0.0.0.0:11434" \\
ollama serve`;

const CMD_NGROK = `ngrok http 11434`;

const CMD_VERCEL_UPDATE = `cd apps/web

# Remover URL antiga
npx vercel env rm OLLAMA_BASE_URL production --yes

# Adicionar nova URL
printf 'https://NOVA-URL.ngrok-free.dev\\n' | \\
  npx vercel env add OLLAMA_BASE_URL production

# Forçar redeploy
cd ../..
git commit --allow-empty -m "chore: redeploy nova URL ngrok" && git push origin main`;

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-xl bg-[#0D0D1A] border border-white/10 overflow-hidden">
      {label && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <span className="text-xs text-[#888] font-mono">{label}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      )}
      {!label && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition-colors z-10"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      )}
      <pre className="p-4 text-sm text-[#A0E8AF] font-mono overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function StatusBadge({ status }: { status: OllamaStatus | null; }) {
  if (!status) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">
      <HelpCircle className="w-3.5 h-3.5" /> Não verificado
    </span>
  );
  if (!status.configured) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <AlertCircle className="w-3.5 h-3.5" /> Não configurado
    </span>
  );
  if (status.online) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      <CheckCircle2 className="w-3.5 h-3.5" /> Online
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      <XCircle className="w-3.5 h-3.5" /> Offline
    </span>
  );
}

export function OllamaMonitorCard() {
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'setup' | 'script'>('status');

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/admin/ollama-status');
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setChecking(false);
    }
  }, []);

  function handleOpenModal() {
    setShowModal(true);
    if (!status) checkStatus();
  }

  return (
    <>
      {/* Card */}
      <div className="bg-linear-to-r from-[#141042]/5 to-[#3B82F6]/5 border border-[#141042]/10 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-[#141042]/10">
              <Cpu className="w-5 h-5 text-[#141042]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-[#141042]">Monitor IA — Ollama</h3>
                <StatusBadge status={status} />
              </div>
              <p className="text-sm text-[#666666]">
                LLM local para organizações no plano <span className="font-medium text-[#141042]">free</span>.
                {status?.online && status.url && (
                  <span className="ml-1 text-[#999]">
                    Modelo: <span className="font-mono text-xs">{status.model}</span>
                  </span>
                )}
              </p>
              {status?.error && (
                <p className="mt-1 text-xs text-red-600 font-mono">{status.error}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={checkStatus}
              disabled={checking}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#141042] border border-[#E5E5DC] bg-white rounded-xl hover:bg-[#FAFAF8] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Verificando…' : 'Verificar'}
            </button>
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-[#141042] rounded-xl hover:bg-[#1e1a5e] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              Configuração
            </button>
          </div>
        </div>

        {/* Modelos disponíveis */}
        {status?.online && status.models.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#141042]/10">
            <p className="text-xs font-medium text-[#666] mb-2">Modelos disponíveis no Ollama:</p>
            <div className="flex flex-wrap gap-2">
              {status.models.map(m => (
                <span
                  key={m}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono border ${
                    m.startsWith(status.model.split(':')[0])
                      ? 'bg-green-50 text-green-700 border-green-200 font-semibold'
                      : 'bg-[#F5F5F0] text-[#666] border-[#E5E5DC]'
                  }`}
                >
                  {m === status.model && '★ '}{m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E5E5DC]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#141042]/10">
                  <Cpu className="w-5 h-5 text-[#141042]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#141042]">Ollama — Monitor & Configuração</h2>
                  <p className="text-xs text-[#666]">LLM local para planos free · ngrok tunnel</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-[#F5F5F0] rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-[#666]" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#E5E5DC] px-6">
              {([
                { id: 'status', label: 'Status atual', icon: Wifi },
                { id: 'setup', label: 'Como configurar', icon: Terminal },
                { id: 'script', label: 'Script completo', icon: ChevronRight },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#141042] text-[#141042]'
                      : 'border-transparent text-[#666] hover:text-[#141042]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* TAB: Status */}
              {activeTab === 'status' && (
                <div className="space-y-5">
                  {/* Status card */}
                  <div className={`rounded-2xl p-5 border-2 ${
                    !status ? 'border-gray-200 bg-gray-50'
                    : status.online ? 'border-green-200 bg-green-50'
                    : status.configured ? 'border-red-200 bg-red-50'
                    : 'border-amber-200 bg-amber-50'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {!status ? (
                          <HelpCircle className="w-7 h-7 text-gray-400" />
                        ) : status.online ? (
                          <Wifi className="w-7 h-7 text-green-600" />
                        ) : (
                          <WifiOff className="w-7 h-7 text-red-600" />
                        )}
                        <div>
                          <p className="font-semibold text-[#141042]">
                            {!status ? 'Status não verificado'
                             : status.online ? 'Ollama está online ✓'
                             : status.configured ? 'Ollama inacessível'
                             : 'OLLAMA_BASE_URL não configurado'}
                          </p>
                          {status?.error && (
                            <p className="text-sm text-red-600 font-mono mt-0.5">{status.error}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={checkStatus}
                        disabled={checking}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-[#E5E5DC] rounded-xl hover:bg-[#FAFAF8] text-[#141042] transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                        {checking ? 'Checando…' : 'Verificar agora'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/70 rounded-xl p-3">
                        <p className="text-xs text-[#666] mb-1">URL configurada</p>
                        <p className="text-sm font-mono text-[#141042] break-all">
                          {status?.url ?? <span className="text-[#999] italic">não definida</span>}
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-3">
                        <p className="text-xs text-[#666] mb-1">Modelo ativo</p>
                        <p className="text-sm font-mono text-[#141042]">
                          {status?.model ?? 'gemma3:4b'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Modelos */}
                  {status?.online && status.models.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-[#141042] mb-2">Modelos instalados no Mac Mini</p>
                      <div className="flex flex-col gap-2">
                        {status.models.map(m => (
                          <div key={m} className={`flex items-center justify-between p-3 rounded-xl border ${
                            m === status.model
                              ? 'bg-green-50 border-green-200'
                              : 'bg-[#FAFAF8] border-[#E5E5DC]'
                          }`}>
                            <span className="font-mono text-sm text-[#141042]">{m}</span>
                            {m === status.model && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-lg font-medium">
                                Em uso
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Roteamento IA */}
                  <div className="bg-[#F5F5F0] rounded-xl p-4">
                    <p className="text-sm font-medium text-[#141042] mb-3">Roteamento LLM por plano</p>
                    <div className="space-y-2">
                      {[
                        { plan: 'free', label: 'Plano Free', provider: 'Ollama (local)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                        { plan: 'pro', label: 'Plano Pro', provider: 'OpenAI gpt-4o', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                        { plan: 'enterprise', label: 'Enterprise', provider: 'OpenAI gpt-4o', color: 'bg-[#141042]/5 text-[#141042] border-[#141042]/10' },
                      ].map(r => (
                        <div key={r.plan} className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${r.color}`}>{r.label}</span>
                          <ChevronRight className="w-3 h-3 text-[#999]" />
                          <span className="text-sm font-mono text-[#141042]">{r.provider}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-[#999] mt-3">
                      Fallback automático para OpenAI se Ollama estiver offline.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB: Setup */}
              {activeTab === 'setup' && (
                <div className="space-y-6">
                  {/* Pré-requisitos */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    <p className="font-medium mb-1">Pré-requisitos</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-700">
                      <li>Ollama instalado no Mac Mini (<span className="font-mono">brew install ollama</span>)</li>
                      <li>Conta ngrok gratuita com authtoken configurado</li>
                      <li>Modelo baixado: <span className="font-mono">ollama pull gemma3:4b</span></li>
                    </ul>
                  </div>

                  {/* Passo 1 */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-[#141042] text-white text-xs flex items-center justify-center font-bold">1</span>
                      <h4 className="font-semibold text-[#141042]">Iniciar Ollama com suporte externo</h4>
                    </div>
                    <p className="text-sm text-[#666] mb-3">
                      O Ollama precisa do <code className="text-xs bg-[#F5F5F0] px-1 py-0.5 rounded">OLLAMA_ORIGINS</code> com a URL exata do ngrok e aceitar conexões de todos os IPs.
                    </p>
                    <CodeBlock code={CMD_OLLAMA} label="Terminal 1 — Mac Mini" />
                  </div>

                  {/* Passo 2 */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-[#141042] text-white text-xs flex items-center justify-center font-bold">2</span>
                      <h4 className="font-semibold text-[#141042]">Iniciar tunnel ngrok</h4>
                    </div>
                    <p className="text-sm text-[#666] mb-3">
                      URL ngrok free é <strong>permanente</strong> (vinculada ao authtoken). Não precisa atualizar o Vercel ao reiniciar.
                    </p>
                    <CodeBlock code={CMD_NGROK} label="Terminal 2 — Mac Mini" />
                  </div>

                  {/* Passo 3 */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-[#141042] text-white text-xs flex items-center justify-center font-bold">3</span>
                      <h4 className="font-semibold text-[#141042]">Variáveis de ambiente no Vercel</h4>
                    </div>
                    <p className="text-sm text-[#666] mb-3">
                      Valores atuais configurados em produção:
                    </p>
                    <CodeBlock code={VERCEL_ENV} label=".env (referência)" />
                  </div>

                  {/* Caso a URL mude */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">!</span>
                      <h4 className="font-semibold text-[#141042]">Se a URL do ngrok mudar</h4>
                    </div>
                    <p className="text-sm text-[#666] mb-3">
                      (Acontece apenas se o authtoken for resetado ou a conta deletada)
                    </p>
                    <CodeBlock code={CMD_VERCEL_UPDATE} label="Dev — atualizar Vercel" />
                  </div>
                </div>
              )}

              {/* TAB: Script */}
              {activeTab === 'script' && (
                <div className="space-y-5">
                  <div className="bg-[#F5F5F0] rounded-xl p-4">
                    <p className="text-sm text-[#666]">
                      Script salvo em <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-[#E5E5DC]">~/start-ollama-tunnel.sh</code> no Mac Mini.
                      Sobe o Ollama com as flags corretas e o ngrok em sequência.
                    </p>
                  </div>

                  <CodeBlock code={SCRIPT_MAC_MINI} label="~/start-ollama-tunnel.sh" />

                  <div className="bg-[#141042]/5 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-medium text-[#141042]">Como executar</p>
                    <CodeBlock code={`bash ~/start-ollama-tunnel.sh`} />
                    <p className="text-xs text-[#666] mt-2">
                      O script mata qualquer processo Ollama anterior, aguarda 1s, sobe o Ollama com as origens corretas
                      e então inicia o ngrok.
                    </p>
                  </div>

                  <div className="border border-[#E5E5DC] rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-[#141042]">Informações da conta ngrok</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#666]">Conta</span>
                        <span className="font-mono text-[#141042]">FR Full Stack (Free)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">URL permanente</span>
                        <span className="font-mono text-xs text-[#141042] break-all">wakerife-noelle-merest.ngrok-free.dev</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#E5E5DC] flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-[#141042] text-white rounded-xl hover:bg-[#1e1a5e] transition-colors text-sm font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
