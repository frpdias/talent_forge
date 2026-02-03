'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send, Copy, RefreshCw, X, CheckCircle, Clock, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Invitation {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_position: string;
  employee_department: string;
  status: string;
  status_label: string;
  invited_at: string;
  expires_at: string;
  days_until_expiry: number;
  access_link: string;
  token: string;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'expired'>('all');
  const [orgId, setOrgId] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<string>('');
  
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Buscar org_id do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Erro: Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      console.log('🔍 User ID:', user.id);

      // Tentar buscar org_id do org_members (para recruiters/admin)
      const { data: orgMember, error: orgError } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('📋 Org Member:', orgMember, 'Error:', orgError);

      if (orgError) {
        throw new Error('Erro ao buscar sua organização.');
      }

      if (!orgMember?.org_id) {
        alert('Erro: Você não está associado a nenhuma organização. Entre em contato com o administrador.');
        throw new Error('Você não está associado a nenhuma organização. Apenas membros da organização podem gerenciar convites.');
      }
      
      console.log('🏢 Org ID:', orgMember.org_id);
      setOrgId(orgMember.org_id);

      // Buscar convites
      console.log('🔄 Buscando convites...');
      await loadInvitations(orgMember.org_id);

      // Buscar funcionários disponíveis
      console.log('👥 Buscando funcionários...');
      const { data: emps, error: empError } = await supabase
        .from('employees')
        .select('id, full_name, position, department')
        .eq('organization_id', orgMember.org_id)
        .order('full_name');

      console.log('📊 Funcionários encontrados:', emps?.length || 0, 'Erro:', empError);

      setEmployees(emps || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async (org_id: string) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      console.log('🎫 Token presente:', !!token);
      
      const url = `/api/v1/php/nr1/invitations?org_id=${org_id}`;
      console.log('🌐 Chamando API:', url);
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-org-id': org_id,
        },
      });

      console.log('📡 Status da resposta:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Erro da API:', errorText);
        throw new Error('Erro ao buscar convites');
      }
      
      const json = await res.json();
      console.log('✅ Convites recebidos:', json.invitations?.length || 0);
      setInvitations(json.invitations || []);
    } catch (error) {
      console.error('❌ Erro ao buscar convites:', error);
      alert('Erro ao buscar convites. Veja o console para detalhes.');
    }
  };

  const handleCreateInvitations = async () => {
    if (selectedEmployees.length === 0) {
      alert('Selecione pelo menos um funcionário');
      return;
    }

    setCreating(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/v1/php/nr1/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-org-id': orgId,
        },
        body: JSON.stringify({
          org_id: orgId,
          employee_ids: selectedEmployees,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao criar convites');
      }

      alert('Convites enviados com sucesso!');
      setSelectedEmployees([]);
      await loadInvitations(orgId);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (invitation: Invitation) => {
    const fullLink = `${window.location.origin}${invitation.access_link}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedToken(invitation.id);
    setTimeout(() => setCopiedToken(''), 2000);
  };

  const handleResend = async (id: string) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`/api/v1/php/nr1/invitations/${id}/resend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-org-id': orgId,
        },
      });

      if (!res.ok) throw new Error('Erro ao reenviar convite');
      alert('Convite reenviado! Novo link gerado.');
      await loadInvitations(orgId);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este convite?')) return;

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`/api/v1/php/nr1/invitations/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-org-id': orgId,
        },
      });

      if (!res.ok) throw new Error('Erro ao cancelar convite');
      alert('Convite cancelado com sucesso');
      await loadInvitations(orgId);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredInvitations = filter === 'all' 
    ? invitations 
    : invitations.filter((inv) => inv.status === filter);

  const statusCounts = {
    all: invitations.length,
    pending: invitations.filter((i) => i.status === 'pending').length,
    accepted: invitations.filter((i) => i.status === 'accepted').length,
    completed: invitations.filter((i) => i.status === 'completed').length,
    expired: invitations.filter((i) => i.status === 'expired').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'accepted':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando convites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/php/nr1">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Convites NR-1</h1>
            <p className="text-gray-600 mt-1">Gerencie convites de auto-avaliação</p>
          </div>
        </div>
      </div>

      {/* Enviar Novos Convites */}
      <Card className="p-6 mb-6 border-2 border-blue-200 bg-blue-50">
        <div className="flex items-start gap-4">
          <Send className="w-6 h-6 text-blue-600 mt-1" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Enviar Novos Convites</h2>
            <p className="text-gray-600 mb-4">Selecione os funcionários para receber convite de auto-avaliação NR-1</p>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto mb-4">
              {employees.map((emp) => (
                <label key={emp.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmployees([...selectedEmployees, emp.id]);
                      } else {
                        setSelectedEmployees(selectedEmployees.filter((id) => id !== emp.id));
                      }
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{emp.full_name}</p>
                    <p className="text-sm text-gray-600">{emp.position} • {emp.department}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleCreateInvitations}
                disabled={creating || selectedEmployees.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {creating ? 'Enviando...' : `Enviar para ${selectedEmployees.length} funcionário(s)`}
              </Button>
              {selectedEmployees.length > 0 && (
                <Button variant="ghost" onClick={() => setSelectedEmployees([])}>
                  Limpar Seleção
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pending', label: 'Pendentes' },
          { key: 'accepted', label: 'Em Andamento' },
          { key: 'completed', label: 'Respondidos' },
          { key: 'expired', label: 'Expirados' },
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? 'primary' : 'outline'}
            onClick={() => setFilter(key as any)}
            className="whitespace-nowrap"
          >
            {label} ({statusCounts[key as keyof typeof statusCounts]})
          </Button>
        ))}
      </div>

      {/* Lista de Convites */}
      {filteredInvitations.length === 0 ? (
        <Card className="p-12 text-center">
          <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum convite encontrado</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'Envie convites para funcionários responderem a auto-avaliação NR-1' 
              : `Nenhum convite com status "${filter}"`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInvitations.map((invitation) => (
            <Card key={invitation.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(invitation.status)}
                    <h3 className="text-lg font-semibold text-gray-900">{invitation.employee_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(invitation.status)}`}>
                      {invitation.status_label}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <p>{invitation.employee_position} • {invitation.employee_department}</p>
                    <p>Enviado em: {new Date(invitation.invited_at).toLocaleDateString('pt-BR')}</p>
                    <p className={invitation.days_until_expiry < 7 ? 'text-red-600 font-medium' : ''}>
                      Expira em: {new Date(invitation.expires_at).toLocaleDateString('pt-BR')} 
                      {invitation.days_until_expiry > 0 && ` (${Math.floor(invitation.days_until_expiry)} dias restantes)`}
                      {invitation.days_until_expiry < 0 && ' (Expirado)'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(invitation)}
                      className="gap-2"
                    >
                      {copiedToken === invitation.id ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar Link
                        </>
                      )}
                    </Button>

                    {(invitation.status === 'pending' || invitation.status === 'expired') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResend(invitation.id)}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reenviar
                      </Button>
                    )}

                    {invitation.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(invitation.id)}
                        className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
