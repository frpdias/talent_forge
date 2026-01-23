'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Search, MoreVertical, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan_id: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Ativo', color: 'bg-green-50 text-green-700', icon: CheckCircle },
  inactive: { label: 'Inativo', color: 'bg-gray-50 text-gray-700', icon: XCircle },
  pending: { label: 'Pendente', color: 'bg-amber-50 text-amber-700', icon: Clock },
  suspended: { label: 'Suspenso', color: 'bg-red-50 text-red-700', icon: XCircle },
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', slug: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No session');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTenant),
      });
      
      if (res.ok) {
        setShowCreateModal(false);
        setNewTenant({ name: '', slug: '' });
        fetchTenants();
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
    } finally {
      setCreating(false);
    }
  }

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#141042]">Tenants</h2>
          <p className="text-sm text-[#666666]">Gerencie os tenants da plataforma</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 bg-[#141042] text-white px-4 py-2.5 rounded-xl hover:bg-[#141042]/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Tenant</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
        <input
          type="text"
          placeholder="Buscar por nome ou slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042]/20"
        />
      </div>

      {/* Tenants Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#E5E5DC] rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="bg-white border border-[#E5E5DC] rounded-2xl p-12 text-center">
          <Building2 className="w-12 h-12 text-[#999] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#141042] mb-2">Nenhum tenant encontrado</h3>
          <p className="text-[#666666] mb-4">Crie o primeiro tenant para começar</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 bg-[#141042] text-white px-4 py-2 rounded-xl hover:bg-[#141042]/90"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Tenant</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((tenant) => {
            const status = statusConfig[tenant.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <div 
                key={tenant.id} 
                className="bg-white border border-[#E5E5DC] rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#141042]/5 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#141042]" />
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="w-5 h-5 text-[#999]" />
                  </button>
                </div>
                
                <h3 className="text-lg font-semibold text-[#141042] mb-1">{tenant.name}</h3>
                <p className="text-sm text-[#666666] mb-4">/{tenant.slug}</p>
                
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-sm ${status.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span>{status.label}</span>
                  </div>
                  <span className="text-xs text-[#999]">
                    {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-[#141042] mb-6">Criar Novo Tenant</h3>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">Nome</label>
                <input
                  type="text"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  placeholder="Ex: Empresa ABC"
                  className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042]/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">Slug</label>
                <input
                  type="text"
                  value={newTenant.slug}
                  onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="empresa-abc"
                  className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042]/20"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-[#E5E5DC] rounded-xl text-[#666666] hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-3 bg-[#141042] text-white rounded-xl hover:bg-[#141042]/90 disabled:opacity-50"
                >
                  {creating ? 'Criando...' : 'Criar Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
