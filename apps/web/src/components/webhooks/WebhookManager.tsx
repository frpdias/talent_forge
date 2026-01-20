'use client';

import { useState } from 'react';
import { Webhook, Plus, Trash2, Eye, EyeOff, Copy, Check } from 'lucide-react';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  createdAt: string;
}

const availableEvents = [
  { id: 'application.received', label: 'Nova Candidatura Recebida' },
  { id: 'application.stage_changed', label: 'Mudança de Etapa' },
  { id: 'interview.scheduled', label: 'Entrevista Agendada' },
  { id: 'interview.completed', label: 'Entrevista Concluída' },
  { id: 'assessment.completed', label: 'Avaliação Concluída' },
  { id: 'offer.sent', label: 'Proposta Enviada' },
  { id: 'candidate.hired', label: 'Candidato Contratado' },
  { id: 'candidate.rejected', label: 'Candidato Rejeitado' },
];

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showSecret, setShowSecret] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
  });

  const generateSecret = () => {
    const secret = 'whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setNewWebhook({ ...newWebhook, secret });
  };

  const handleCreate = () => {
    const webhook: WebhookConfig = {
      id: Math.random().toString(36).substring(7),
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events,
      active: true,
      secret: newWebhook.secret,
      createdAt: new Date().toISOString(),
    };

    setWebhooks([...webhooks, webhook]);
    setIsCreating(false);
    setNewWebhook({ name: '', url: '', events: [], secret: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este webhook?')) {
      setWebhooks(webhooks.filter(w => w.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, active: !w.active } : w
    ));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Webhooks</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure webhooks para receber eventos em tempo real
          </p>
        </div>
        
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Webhook
          </button>
        )}
      </div>

      {isCreating && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-blue-500">
          <h3 className="font-semibold text-gray-900 mb-4">Criar Novo Webhook</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                placeholder="Ex: Integração Slack"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL do Endpoint
              </label>
              <input
                type="url"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                placeholder="https://api.exemplo.com/webhooks"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eventos
              </label>
              <div className="space-y-2">
                {availableEvents.map((event) => (
                  <label key={event.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWebhook.events.includes(event.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWebhook({
                            ...newWebhook,
                            events: [...newWebhook.events, event.id],
                          });
                        } else {
                          setNewWebhook({
                            ...newWebhook,
                            events: newWebhook.events.filter(id => id !== event.id),
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret (Assinatura)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                  placeholder="whsec_..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  onClick={generateSecret}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Gerar
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewWebhook({ name: '', url: '', events: [], secret: '' });
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar Webhook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.length === 0 && !isCreating && (
          <div className="text-center py-12">
            <Webhook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum webhook configurado</p>
            <p className="text-sm text-gray-500 mt-1">
              Crie seu primeiro webhook para começar a receber eventos
            </p>
          </div>
        )}

        {webhooks.map((webhook) => (
          <div key={webhook.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-semibold text-gray-900">{webhook.name}</h4>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      webhook.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {webhook.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    {webhook.url}
                  </code>
                  <button
                    onClick={() => copyToClipboard(webhook.url, `url-${webhook.id}`)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {copiedId === `url-${webhook.id}` ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {webhook.secret && (
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded font-mono">
                      {showSecret === webhook.id ? webhook.secret : '••••••••••••••••'}
                    </code>
                    <button
                      onClick={() =>
                        setShowSecret(showSecret === webhook.id ? null : webhook.id)
                      }
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {showSecret === webhook.id ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(webhook.secret!, `secret-${webhook.id}`)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {copiedId === `secret-${webhook.id}` ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {webhook.events.map((eventId) => {
                    const event = availableEvents.find(e => e.id === eventId);
                    return (
                      <span
                        key={eventId}
                        className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
                      >
                        {event?.label || eventId}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => toggleActive(webhook.id)}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    webhook.active
                      ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                      : 'text-green-700 bg-green-100 hover:bg-green-200'
                  }`}
                >
                  {webhook.active ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => handleDelete(webhook.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Criado em {new Date(webhook.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
