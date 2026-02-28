'use client';

import { useState, useEffect } from 'react';
import { Lock, Shield, Plus, Search, ChevronRight, Users, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { API_V1_URL } from '@/lib/api-config';

interface Role {
  id: string;
  name: string;
  scope: string;
  created_at: string;
}

interface Permission {
  id: string;
  action: string;
  resource: string;
  created_at: string;
}

const scopeColors: Record<string, string> = {
  tenant: 'bg-blue-50 text-blue-700',
  global: 'bg-purple-50 text-purple-700',
  org: 'bg-green-50 text-green-700',
};

const actionColors: Record<string, string> = {
  create: 'bg-green-50 text-green-700',
  read: 'bg-blue-50 text-blue-700',
  update: 'bg-amber-50 text-amber-700',
  delete: 'bg-red-50 text-red-700',
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      const [rolesRes, permsRes] = await Promise.all([
        fetch(`${API_V1_URL}/roles`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
        fetch(`${API_V1_URL}/permissions`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
      ]);

      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (permsRes.ok) setPermissions(await permsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Group permissions by resource
  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#141042]">Roles & Permissões</h2>
          <p className="text-sm text-[#666666]">Gerencie papéis e permissões do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-[#F5F5F0] p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'roles' ? 'bg-white text-[#141042] shadow-sm' : 'text-[#666666] hover:text-[#141042]'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Roles ({roles.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'permissions' ? 'bg-white text-[#141042] shadow-sm' : 'text-[#666666] hover:text-[#141042]'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4" />
            <span>Permissões ({permissions.length})</span>
          </div>
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-[#E5E5DC] rounded-2xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      ) : activeTab === 'roles' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roles List */}
          <div className="bg-white border border-[#E5E5DC] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#E5E5DC]">
              <h3 className="font-semibold text-[#141042]">Papéis do Sistema</h3>
            </div>
            <div className="divide-y divide-[#E5E5DC]">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-[#FAFAF8] transition-colors ${
                    selectedRole?.id === role.id ? 'bg-[#FAFAF8]' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#141042]/5 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[#141042]" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-[#141042] capitalize">{role.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${scopeColors[role.scope] || 'bg-gray-50 text-gray-700'}`}>
                        {role.scope}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#999]" />
                </button>
              ))}
            </div>
          </div>

          {/* Role Details */}
          <div className="bg-white border border-[#E5E5DC] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#E5E5DC]">
              <h3 className="font-semibold text-[#141042]">
                {selectedRole ? `Permissões: ${selectedRole.name}` : 'Selecione um papel'}
              </h3>
            </div>
            <div className="p-4">
              {selectedRole ? (
                <div className="space-y-3">
                  <p className="text-sm text-[#666666] mb-4">
                    Permissões atribuídas ao papel <strong className="capitalize">{selectedRole.name}</strong>:
                  </p>
                  {Object.entries(permissionsByResource).map(([resource, perms]) => (
                    <div key={resource} className="p-3 bg-[#FAFAF8] rounded-xl">
                      <p className="font-medium text-[#141042] capitalize mb-2">{resource}</p>
                      <div className="flex flex-wrap gap-2">
                        {perms.map((perm) => (
                          <span
                            key={perm.id}
                            className={`text-xs px-2 py-1 rounded-lg ${actionColors[perm.action] || 'bg-gray-50 text-gray-700'}`}
                          >
                            {perm.action}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#999]">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione um papel para ver suas permissões</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Permissions Grid */
        <div className="bg-white border border-[#E5E5DC] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#E5E5DC]">
            <h3 className="font-semibold text-[#141042]">Todas as Permissões</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(permissionsByResource).map(([resource, perms]) => (
                <div key={resource} className="p-4 bg-[#FAFAF8] rounded-xl">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lock className="w-4 h-4 text-[#141042]" />
                    <p className="font-medium text-[#141042] capitalize">{resource}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((perm) => (
                      <span
                        key={perm.id}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium ${actionColors[perm.action] || 'bg-gray-50 text-gray-700'}`}
                      >
                        {perm.action}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
