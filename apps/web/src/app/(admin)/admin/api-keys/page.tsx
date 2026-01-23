'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Search, Calendar, Check, X, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as string[],
    expires_in_days: 30,
  });

  const availablePermissions = [
    'jobs:read', 'jobs:write',
    'candidates:read', 'candidates:write',
    'assessments:read', 'assessments:write',
    'reports:read', 'reports:write',
  ];

  useEffect(() => {
    fetchApiKeys();
  }, []);

  async function fetchApiKeys() {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/api-keys`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formData.name) return;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          permissions: formData.permissions,
          expires_in_days: formData.expires_in_days,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key); // Show the full key only once
        fetchApiKeys();
        setFormData({ name: '', permissions: [], expires_in_days: 30 });
      }
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  }

  async function handleRevoke(keyId: string) {
    if (!confirm('Tem certeza que deseja revogar esta API key? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
    }
  }

  function handleTogglePermission(permission: string) {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  const filteredKeys = apiKeys.filter(key =>
    key.name.toLowerCase().includes(search.toLowerCase()) ||
    key.key_prefix.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = apiKeys.filter(k => k.is_active).length;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#141042]">API Keys</h2>
          <p className="text-sm text-[#666666]">Gerencie chaves de acesso para integrações</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#141042] text-white rounded-xl hover:bg-[#1e1a5e] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nova API Key</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4">
          <p className="text-2xl font-semibold text-[#141042]">{apiKeys.length}</p>
          <p className="text-sm text-[#666666]">Total de Keys</p>
        </div>
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4">
          <p className="text-2xl font-semibold text-green-600">{activeCount}</p>
          <p className="text-sm text-[#666666]">Ativas</p>
        </div>
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4">
          <p className="text-2xl font-semibold text-red-600">{apiKeys.length - activeCount}</p>
          <p className="text-sm text-[#666666]">Revogadas</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
        <input
          type="text"
          placeholder="Buscar API keys..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042]/20"
        />
      </div>

      {/* New Key Alert */}
      {newKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 mb-2">Sua nova API Key foi criada!</h3>
              <p className="text-sm text-amber-700 mb-4">
                Copie esta chave agora. Por segurança, ela não será exibida novamente.
              </p>
              <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-amber-200">
                <code className="flex-1 text-sm font-mono text-[#141042] break-all">{newKey}</code>
                <button
                  onClick={() => copyToClipboard(newKey)}
                  className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-amber-600" />
                </button>
              </div>
              <button
                onClick={() => setNewKey(null)}
                className="mt-4 text-sm text-amber-700 hover:text-amber-900 underline"
              >
                Entendido, já copiei
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="bg-white border border-[#E5E5DC] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-gray-200 rounded-full mb-4" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="w-12 h-12 text-[#999] mx-auto mb-4" />
            <p className="text-lg font-medium text-[#141042]">Nenhuma API Key</p>
            <p className="text-sm text-[#666666] mt-1">Crie uma API key para começar a integrar</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5DC]">
            {filteredKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-6 hover:bg-[#FAFAF8]">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-xl ${apiKey.is_active ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <Key className={`w-5 h-5 ${apiKey.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-[#141042]">{apiKey.name}</h3>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                          apiKey.is_active 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {apiKey.is_active ? 'Ativa' : 'Revogada'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <code className="text-sm font-mono text-[#666666] bg-[#F5F5F0] px-2 py-0.5 rounded">
                          {apiKey.key_prefix}...
                        </code>
                        <button
                          onClick={() => copyToClipboard(apiKey.key_prefix)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3 text-[#999]" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {apiKey.permissions.map(p => (
                          <span
                            key={p}
                            className="px-2 py-0.5 text-xs bg-[#F5F5F0] text-[#666666] rounded"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-[#999]">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Criada: {new Date(apiKey.created_at).toLocaleDateString('pt-BR')}</span>
                        </span>
                        {apiKey.last_used_at && (
                          <span>Último uso: {new Date(apiKey.last_used_at).toLocaleDateString('pt-BR')}</span>
                        )}
                        {apiKey.expires_at && (
                          <span>Expira: {new Date(apiKey.expires_at).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {apiKey.is_active && (
                    <button
                      onClick={() => handleRevoke(apiKey.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Revogar</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E5E5DC]">
              <h3 className="text-lg font-semibold text-[#141042]">Nova API Key</h3>
              <p className="text-sm text-[#666666]">Crie uma chave para integrações externas</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Integração CRM"
                  className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">Permissões</label>
                <div className="grid grid-cols-2 gap-2">
                  {availablePermissions.map(permission => (
                    <label
                      key={permission}
                      className="flex items-center space-x-2 p-2 border border-[#E5E5DC] rounded-lg cursor-pointer hover:bg-[#FAFAF8]"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => handleTogglePermission(permission)}
                        className="rounded border-gray-300 text-[#141042] focus:ring-[#141042]"
                      />
                      <span className="text-sm text-[#141042]">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">Expiração</label>
                <select
                  value={formData.expires_in_days}
                  onChange={(e) => setFormData({ ...formData, expires_in_days: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042]/20"
                >
                  <option value={7}>7 dias</option>
                  <option value={30}>30 dias</option>
                  <option value={90}>90 dias</option>
                  <option value={365}>1 ano</option>
                  <option value={0}>Nunca expira</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-[#E5E5DC] flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border border-[#E5E5DC] text-[#141042] rounded-xl hover:bg-[#FAFAF8] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleCreate();
                  setShowModal(false);
                }}
                disabled={!formData.name}
                className="px-5 py-2.5 bg-[#141042] text-white rounded-xl hover:bg-[#1e1a5e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar API Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
