'use client';

import { useState } from 'react';
import { X, Globe, Search, ChevronDown, ChevronRight } from 'lucide-react';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiEndpoint {
  methods: Method[];
  path: string;
  desc?: string;
}

interface ApiGroup {
  label: string;
  color: string;         // badge color
  endpoints: ApiEndpoint[];
}

const METHOD_COLORS: Record<Method, string> = {
  GET:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  POST:   'bg-blue-50 text-blue-700 border-blue-200',
  PUT:    'bg-amber-50 text-amber-700 border-amber-200',
  PATCH:  'bg-orange-50 text-orange-700 border-orange-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
};

const API_GROUPS: ApiGroup[] = [
  {
    label: 'Auth',
    color: 'bg-slate-100 text-slate-700',
    endpoints: [
      { methods: ['GET'], path: '/api/auth/callback', desc: 'Callback OAuth Supabase' },
    ],
  },
  {
    label: 'Admin — Usuários & Tenants',
    color: 'bg-[#141042]/10 text-[#141042]',
    endpoints: [
      { methods: ['GET'], path: '/api/admin/users', desc: 'Listar usuários' },
      { methods: ['POST'], path: '/api/admin/create-user', desc: 'Criar usuário' },
      { methods: ['DELETE'], path: '/api/admin/delete-user', desc: 'Excluir usuário' },
      { methods: ['GET'], path: '/api/admin/tenants', desc: 'Listar tenants' },
      { methods: ['GET'], path: '/api/admin/tenants/[id]/members', desc: 'Membros do tenant' },
      { methods: ['PATCH'], path: '/api/admin/tenants/[id]/status', desc: 'Alterar status do tenant' },
      { methods: ['GET', 'POST'], path: '/api/admin/companies', desc: 'Listar / criar empresas' },
      { methods: ['PATCH', 'DELETE'], path: '/api/admin/companies/[id]', desc: 'Editar / excluir empresa' },
      { methods: ['GET'], path: '/api/admin/companies/[id]/metrics', desc: 'Métricas da empresa' },
      { methods: ['POST'], path: '/api/admin/companies/[id]/activate-php', desc: 'Ativar módulo PHP' },
      { methods: ['POST', 'DELETE'], path: '/api/admin/companies/[id]/php-module', desc: 'Configurar módulo PHP' },
      { methods: ['POST', 'DELETE'], path: '/api/admin/companies/[id]/recruitment-module', desc: 'Configurar módulo recrutamento' },
    ],
  },
  {
    label: 'Admin — Segurança',
    color: 'bg-red-50 text-red-700',
    endpoints: [
      { methods: ['GET'], path: '/api/admin/security/score', desc: 'Score de segurança' },
      { methods: ['GET'], path: '/api/admin/security/threats', desc: 'Ameaças detectadas' },
      { methods: ['GET'], path: '/api/admin/security/checks', desc: 'Verificações de segurança' },
      { methods: ['GET'], path: '/api/admin/security/sessions', desc: 'Sessões ativas' },
      { methods: ['GET', 'POST'], path: '/api/admin/security-events', desc: 'Eventos de segurança' },
      { methods: ['GET', 'POST'], path: '/api/admin/audit-logs', desc: 'Audit logs' },
    ],
  },
  {
    label: 'Admin — Sistema',
    color: 'bg-purple-50 text-purple-700',
    endpoints: [
      { methods: ['GET', 'POST'], path: '/api/admin/settings', desc: 'Configurações do sistema' },
      { methods: ['GET'], path: '/api/admin/smtp-status', desc: 'Status SMTP' },
      { methods: ['POST'], path: '/api/admin/send-test-email', desc: 'Enviar email de teste' },
      { methods: ['POST'], path: '/api/admin/resend-welcome-email', desc: 'Reenviar email de boas-vindas' },
      { methods: ['GET'], path: '/api/admin/ollama-status', desc: 'Status Ollama (LLM local)' },
      { methods: ['GET'], path: '/api/admin/metrics/api', desc: 'Métricas de uso de API' },
      { methods: ['GET'], path: '/api/admin/metrics/bi', desc: 'Métricas BI' },
      { methods: ['GET'], path: '/api/admin/metrics/database', desc: 'Métricas de banco de dados' },
      { methods: ['GET'], path: '/api/admin/metrics/php', desc: 'Métricas módulo PHP' },
      { methods: ['GET'], path: '/api/admin/metrics/users', desc: 'Métricas de usuários' },
    ],
  },
  {
    label: 'Recrutador',
    color: 'bg-cyan-50 text-cyan-700',
    endpoints: [
      { methods: ['GET', 'PUT'], path: '/api/recruiter/settings', desc: 'Configurações do recrutador' },
      { methods: ['GET'], path: '/api/recruiter/candidates/[id]/assessments', desc: 'Assessments do candidato' },
      { methods: ['GET', 'POST'], path: '/api/recruiter/candidates/[id]/it-test', desc: 'Gestão de teste IT' },
      { methods: ['GET', 'POST'], path: '/api/recruiter/candidates/[id]/technical-review', desc: 'Parecer técnico IA' },
    ],
  },
  {
    label: 'API v1 — Recrutamento',
    color: 'bg-green-50 text-green-700',
    endpoints: [
      { methods: ['GET', 'POST'], path: '/api/v1/applications', desc: 'Candidaturas' },
      { methods: ['PATCH'], path: '/api/v1/applications/[id]/status', desc: 'Alterar status da candidatura' },
      { methods: ['PATCH'], path: '/api/v1/applications/[id]/stage', desc: 'Mover estágio no pipeline' },
      { methods: ['GET', 'POST', 'DELETE'], path: '/api/v1/jobs/[id]/publish', desc: 'Publicar / despublicar vaga' },
      { methods: ['GET'], path: '/api/v1/jobs/[id]/channels', desc: 'Canais da vaga' },
      { methods: ['GET'], path: '/api/v1/career-page/[slug]', desc: 'Página de carreiras pública' },
      { methods: ['GET'], path: '/api/v1/recruitment/status', desc: 'Status do módulo de recrutamento' },
      { methods: ['GET'], path: '/api/v1/reports/dashboard', desc: 'Dashboard de relatórios' },
      { methods: ['GET'], path: '/api/v1/reports/pipelines', desc: 'Relatório de pipelines' },
      { methods: ['GET'], path: '/api/v1/reports/assessments', desc: 'Relatório de assessments' },
    ],
  },
  {
    label: 'API v1 — Organizações & Time',
    color: 'bg-indigo-50 text-indigo-700',
    endpoints: [
      { methods: ['GET', 'POST'], path: '/api/v1/organizations', desc: 'Organizações' },
      { methods: ['GET', 'PATCH', 'DELETE'], path: '/api/v1/organizations/[id]', desc: 'Organização específica' },
      { methods: ['GET', 'POST', 'PATCH'], path: '/api/v1/organizations/[id]/channels', desc: 'Canais da organização' },
      { methods: ['GET'], path: '/api/v1/team/members', desc: 'Membros do time' },
      { methods: ['PATCH', 'DELETE'], path: '/api/v1/team/members/[memberId]', desc: 'Membro específico' },
      { methods: ['POST'], path: '/api/v1/team/invite', desc: 'Convidar membro' },
      { methods: ['POST'], path: '/api/v1/invite-links', desc: 'Criar link de convite' },
      { methods: ['GET'], path: '/api/v1/invite-links/[token]', desc: 'Detalhes do convite' },
      { methods: ['POST'], path: '/api/v1/invite-links/[token]/register', desc: 'Registrar via convite' },
    ],
  },
  {
    label: 'API v1 — Módulo PHP',
    color: 'bg-violet-50 text-violet-700',
    endpoints: [
      { methods: ['GET'], path: '/api/v1/php/status', desc: 'Status do módulo PHP' },
      { methods: ['POST'], path: '/api/v1/php/activate', desc: 'Ativar módulo PHP' },
      { methods: ['POST'], path: '/api/v1/php/deactivate', desc: 'Desativar módulo PHP' },
      { methods: ['POST'], path: '/api/v1/php/scores/calculate', desc: 'Calcular scores integrados' },
      { methods: ['GET', 'POST'], path: '/api/v1/php/employees', desc: 'Colaboradores' },
      { methods: ['GET', 'PATCH', 'DELETE'], path: '/api/v1/php/employees/[id]', desc: 'Colaborador específico' },
      { methods: ['POST'], path: '/api/v1/php/employees/[id]/transfer', desc: 'Transferir colaborador' },
      { methods: ['GET', 'POST'], path: '/api/v1/php/teams', desc: 'Times PHP' },
      { methods: ['POST'], path: '/api/v1/php/teams/auto-create', desc: 'Auto-criar times' },
      { methods: ['GET', 'PATCH', 'DELETE'], path: '/api/v1/php/teams/[id]', desc: 'Time específico' },
      { methods: ['GET'], path: '/api/v1/php/teams/[id]/available-members', desc: 'Membros disponíveis' },
      { methods: ['POST'], path: '/api/v1/php/teams/[id]/members', desc: 'Adicionar membro ao time' },
      { methods: ['PATCH', 'DELETE'], path: '/api/v1/php/teams/[id]/members/[memberId]', desc: 'Membro do time' },
    ],
  },
  {
    label: 'API v1 — PHP · TFCI',
    color: 'bg-teal-50 text-teal-700',
    endpoints: [
      { methods: ['GET', 'POST'], path: '/api/v1/php/tfci/cycles', desc: 'Ciclos TFCI' },
      { methods: ['GET', 'PUT', 'DELETE'], path: '/api/v1/php/tfci/cycles/[id]', desc: 'Ciclo TFCI específico' },
      { methods: ['GET'], path: '/api/v1/php/tfci/cycles/[id]/assessments', desc: 'Assessments do ciclo' },
      { methods: ['GET'], path: '/api/v1/php/tfci/cycles/[id]/heatmap', desc: 'Heatmap do ciclo' },
      { methods: ['POST'], path: '/api/v1/php/tfci/assessments', desc: 'Criar assessment TFCI' },
    ],
  },
  {
    label: 'API v1 — PHP · NR-1',
    color: 'bg-amber-50 text-amber-700',
    endpoints: [
      { methods: ['GET', 'POST'], path: '/api/v1/php/nr1/assessments', desc: 'Avaliações NR-1' },
      { methods: ['GET', 'PUT', 'DELETE'], path: '/api/v1/php/nr1/assessments/[id]', desc: 'Avaliação NR-1 específica' },
      { methods: ['POST'], path: '/api/v1/php/nr1/assessments/[id]/aggregate', desc: 'Dados agregados da avaliação' },
      { methods: ['GET', 'POST'], path: '/api/v1/php/nr1/self-assessments', desc: 'Auto-avaliações NR-1' },
      { methods: ['GET'], path: '/api/v1/php/nr1/comparative-analysis/[orgId]', desc: 'Análise comparativa' },
      { methods: ['GET', 'POST'], path: '/api/v1/php/nr1/invitations', desc: 'Convites NR-1' },
      { methods: ['DELETE'], path: '/api/v1/php/nr1/invitations/[id]', desc: 'Excluir convite' },
      { methods: ['POST'], path: '/api/v1/php/nr1/invitations/[id]/resend', desc: 'Reenviar convite' },
      { methods: ['GET'], path: '/api/v1/php/nr1/invitations/token/[token]', desc: 'Convite por token' },
    ],
  },
  {
    label: 'API v1 — PHP · COPC',
    color: 'bg-rose-50 text-rose-700',
    endpoints: [
      { methods: ['GET', 'POST'], path: '/api/v1/php/copc/catalog', desc: 'Catálogo COPC' },
      { methods: ['GET', 'POST'], path: '/api/v1/php/copc/entries', desc: 'Entradas COPC' },
      { methods: ['GET', 'POST'], path: '/api/v1/php/copc/metrics', desc: 'Métricas COPC' },
      { methods: ['GET', 'PUT', 'DELETE'], path: '/api/v1/php/copc/metrics/[id]', desc: 'Métrica COPC específica' },
      { methods: ['GET'], path: '/api/v1/php/copc/scores/[orgId]', desc: 'Scores COPC da org' },
      { methods: ['GET'], path: '/api/v1/php/copc/dashboard/[orgId]', desc: 'Dashboard COPC' },
    ],
  },
  {
    label: 'IT Test',
    color: 'bg-sky-50 text-sky-700',
    endpoints: [
      { methods: ['GET'], path: '/api/it-test/[token]', desc: 'Acessar teste por token público' },
      { methods: ['POST'], path: '/api/it-test/[token]/submit', desc: 'Submeter respostas do teste' },
      { methods: ['GET'], path: '/api/candidate/it-test', desc: 'IT Test (view candidato)' },
    ],
  },
  {
    label: 'Google Calendar',
    color: 'bg-orange-50 text-orange-700',
    endpoints: [
      { methods: ['GET'], path: '/api/google-calendar/status', desc: 'Status da integração' },
      { methods: ['GET'], path: '/api/google-calendar/authorize', desc: 'Iniciar OAuth Google' },
      { methods: ['GET'], path: '/api/google-calendar/callback', desc: 'Callback OAuth Google' },
      { methods: ['POST'], path: '/api/google-calendar/create-event', desc: 'Criar evento no calendário' },
      { methods: ['POST'], path: '/api/google-calendar/disconnect', desc: 'Desconectar integração' },
    ],
  },
  {
    label: 'Utilitários',
    color: 'bg-gray-100 text-gray-600',
    endpoints: [
      { methods: ['GET'], path: '/api/cbo/search', desc: 'Busca CBO (ocupações)' },
      { methods: ['POST'], path: '/api/storage/signed-url', desc: 'URL assinada para storage' },
      { methods: ['POST'], path: '/api/pipeline/notify', desc: 'Notificação de pipeline' },
      { methods: ['POST'], path: '/api/alerts/subscribe', desc: 'Subscrição de alertas' },
    ],
  },
];

const TOTAL_ENDPOINTS = API_GROUPS.reduce((acc, g) => acc + g.endpoints.length, 0);

function MethodBadge({ method }: { method: Method }) {
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded border font-mono leading-none ${METHOD_COLORS[method]}`}>
      {method}
    </span>
  );
}

function EndpointRow({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 hover:bg-[#FAFAF8] transition-colors border-b border-[#F0F0E8] last:border-0">
      <div className="flex flex-wrap gap-1 shrink-0 mt-0.5" style={{ minWidth: 100 }}>
        {endpoint.methods.map(m => <MethodBadge key={m} method={m} />)}
      </div>
      <div className="flex-1 min-w-0">
        <code className="text-xs font-mono text-[#141042] break-all">{endpoint.path}</code>
        {endpoint.desc && (
          <p className="text-xs text-[#999] mt-0.5 truncate">{endpoint.desc}</p>
        )}
      </div>
    </div>
  );
}

function GroupSection({ group, searchQuery }: { group: ApiGroup; searchQuery: string }) {
  const [open, setOpen] = useState(true);

  const filtered = searchQuery
    ? group.endpoints.filter(e =>
        e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.desc?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        e.methods.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : group.endpoints;

  if (filtered.length === 0) return null;

  return (
    <div className="border border-[#E5E5DC] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#FAFAF8] hover:bg-[#F5F5F0] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${group.color}`}>
            {group.label}
          </span>
          <span className="text-xs text-[#999]">{filtered.length} endpoint{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-[#999]" /> : <ChevronRight className="w-4 h-4 text-[#999]" />}
      </button>
      {open && (
        <div>
          {filtered.map(ep => <EndpointRow key={ep.path + ep.methods.join()} endpoint={ep} />)}
        </div>
      )}
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export function ApiCatalogModal({ onClose }: Props) {
  const [search, setSearch] = useState('');

  const totalFiltered = API_GROUPS.reduce((acc, g) => {
    const f = !search
      ? g.endpoints.length
      : g.endpoints.filter(e =>
          e.path.toLowerCase().includes(search.toLowerCase()) ||
          (e.desc?.toLowerCase().includes(search.toLowerCase())) ||
          e.methods.some(m => m.toLowerCase().includes(search.toLowerCase()))
        ).length;
    return acc + f;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E5DC]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#141042]/10">
              <Globe className="w-5 h-5 text-[#141042]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#141042]">Catálogo de APIs</h2>
              <p className="text-xs text-[#666]">
                {TOTAL_ENDPOINTS} endpoints Next.js App Router
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F5F5F0] rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-[#666]" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-[#E5E5DC]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
            <input
              type="text"
              placeholder="Buscar por rota, método ou descrição…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042]/20 bg-[#FAFAF8]"
              autoFocus
            />
          </div>
          {search && (
            <p className="text-xs text-[#999] mt-2">
              {totalFiltered} endpoint{totalFiltered !== 1 ? 's' : ''} encontrado{totalFiltered !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Legend */}
        <div className="px-6 py-3 flex flex-wrap items-center gap-2 border-b border-[#E5E5DC] bg-[#FAFAF8]">
          <span className="text-xs text-[#999] mr-1">Métodos:</span>
          {(Object.keys(METHOD_COLORS) as Method[]).map(m => (
            <MethodBadge key={m} method={m} />
          ))}
        </div>

        {/* Groups list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {API_GROUPS.map(group => (
            <GroupSection key={group.label} group={group} searchQuery={search} />
          ))}
          {totalFiltered === 0 && (
            <div className="text-center py-12 text-[#999]">
              <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum endpoint encontrado para "<strong>{search}</strong>"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E5E5DC] flex justify-between items-center">
          <p className="text-xs text-[#999]">
            {API_GROUPS.length} grupos · {TOTAL_ENDPOINTS} endpoints
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#141042] text-white rounded-xl hover:bg-[#1e1a5e] transition-colors text-sm font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
