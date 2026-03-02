'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowRightLeft,
  Users,
  User,
  Crown,
  Building2,
  Check,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────── */
interface EmployeeData {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  manager_id: string | null;
}

interface TeamOption {
  id: string;
  name: string;
  member_count: number;
}

interface ManagerOption {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
}

interface TransferEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: EmployeeData;
  currentTeamName: string;
  orgId: string;
  getToken: () => Promise<string | null>;
}

/* ── Position priority for sorting managers ─────────── */
const positionPriority = (pos: string | null): number => {
  if (!pos) return 99;
  const p = pos.toLowerCase();
  if (p.includes('diretor') || p.includes('ceo') || p.includes('presidente') || p.includes('vp')) return 1;
  if (p.includes('gerente') || p.includes('superintendente')) return 2;
  if (p.includes('coordenador') || p.includes('supervisor')) return 3;
  if (p.includes('líder') || p.includes('lider') || p.includes('especialista')) return 4;
  if (p.includes('analista') || p.includes('consultor')) return 5;
  return 6;
};

/* ── Main Component ────────────────────────────────────── */
export default function TransferEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  currentTeamName,
  orgId,
  getToken,
}: TransferEmployeeModalProps) {
  // State
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form
  const [selectedTeam, setSelectedTeam] = useState<string>('__same__');
  const [selectedManager, setSelectedManager] = useState<string>(employee.manager_id || '__none__');
  const [filterManagerByTeam, setFilterManagerByTeam] = useState(true);

  // Load teams + all potential managers
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoadingData(true);
      setError(null);
      setSuccessMsg(null);
      setSelectedTeam('__same__');
      setSelectedManager(employee.manager_id || '__none__');

      try {
        const token = await getToken();
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token ?? ''}`,
          'x-org-id': orgId,
        };

        // Load teams — API returns { data: Team[], total: number }
        const teamsRes = await fetch('/api/v1/php/teams', { headers });
        if (teamsRes.ok) {
          const teamsJson = await teamsRes.json();
          const teamsArr = Array.isArray(teamsJson) ? teamsJson : (teamsJson.data || teamsJson.teams || []);
          setTeams(teamsArr);
        }

        // Load all employees (potential managers) — use GET with large limit
        const empsRes = await fetch('/api/v1/php/employees?limit=500', { headers });
        if (empsRes.ok) {
          const empsRaw = await empsRes.json();
          const empsData = Array.isArray(empsRaw) ? empsRaw : (empsRaw.data || empsRaw.employees || []);
          const allEmps: ManagerOption[] = (empsData || [])
            .filter((e: any) => e.id !== employee.id && e.status === 'active')
            .map((e: any) => ({
              id: e.id,
              full_name: e.full_name,
              position: e.position,
              department: e.department,
            }));
          // Sort by position priority then name
          allEmps.sort((a, b) => {
            const pa = positionPriority(a.position);
            const pb = positionPriority(b.position);
            if (pa !== pb) return pa - pb;
            return a.full_name.localeCompare(b.full_name);
          });
          setManagers(allEmps);
        }
      } catch (err) {
        setError('Erro ao carregar dados');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [isOpen, orgId, employee.id, employee.manager_id, getToken]);

  // Target team name (for filtering managers)
  const targetTeamName = useMemo(() => {
    if (selectedTeam === '__same__') return currentTeamName;
    return teams.find((t) => t.id === selectedTeam)?.name || currentTeamName;
  }, [selectedTeam, teams, currentTeamName]);

  // Filtered managers
  const filteredManagers = useMemo(() => {
    if (!filterManagerByTeam) return managers;
    return managers.filter((m) => m.department === targetTeamName);
  }, [managers, filterManagerByTeam, targetTeamName]);

  // Check if there are changes
  const hasChanges = useMemo(() => {
    const teamChanged = selectedTeam !== '__same__';
    const managerChanged =
      selectedManager !== (employee.manager_id || '__none__');
    return teamChanged || managerChanged;
  }, [selectedTeam, selectedManager, employee.manager_id]);

  // Save transfer
  const handleSave = async () => {
    if (!hasChanges) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = await getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token ?? ''}`,
        'x-org-id': orgId,
      };

      const body: Record<string, any> = {};

      if (selectedTeam !== '__same__') {
        const targetName = teams.find((t) => t.id === selectedTeam)?.name;
        if (targetName) body.department = targetName;
      }

      if (selectedManager !== (employee.manager_id || '__none__')) {
        body.manager_id = selectedManager === '__none__' ? null : selectedManager;
      }

      const res = await fetch(`/api/v1/php/employees/${employee.id}/transfer`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao transferir');
        return;
      }

      const msgs = (data.changes || []) as string[];
      setSuccessMsg(`Transferência realizada: ${msgs.join(', ')}`);

      // Refresh parent after a short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#141042]/40 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5DC]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1F4ED8]/10 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-[#1F4ED8]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#141042]">Transferir Colaborador</h2>
              <p className="text-xs text-[#666666]">{employee.full_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#666666] hover:text-[#141042] hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#1F4ED8]" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Current info */}
            <div className="bg-[#FAFAF8] rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-[#666666] uppercase tracking-wide">Situação Atual</p>
              <div className="flex items-center gap-2 text-sm text-[#141042]">
                <Building2 className="w-4 h-4 text-[#666666]" />
                <span>Time: <strong>{currentTeamName}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#141042]">
                <Crown className="w-4 h-4 text-[#666666]" />
                <span>
                  Gestor:{' '}
                  <strong>
                    {employee.manager_id
                      ? managers.find((m) => m.id === employee.manager_id)?.full_name || 'Não identificado'
                      : 'Nenhum'}
                  </strong>
                </span>
              </div>
              {employee.position && (
                <div className="flex items-center gap-2 text-sm text-[#141042]">
                  <User className="w-4 h-4 text-[#666666]" />
                  <span>Cargo: <strong>{employee.position}</strong></span>
                </div>
              )}
            </div>

            {/* Team selector */}
            <div>
              <label className="block text-sm font-semibold text-[#141042] mb-2">
                Mover para Time
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl text-sm text-[#141042] bg-white focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
              >
                <option value="__same__">Manter no time atual ({currentTeamName})</option>
                {teams
                  .filter((t) => t.name !== currentTeamName)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.member_count} membros)
                    </option>
                  ))}
              </select>
            </div>

            {/* Manager selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-[#141042]">
                  Vincular a Gestor
                </label>
                <label className="flex items-center gap-2 text-xs text-[#666666] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterManagerByTeam}
                    onChange={(e) => setFilterManagerByTeam(e.target.checked)}
                    className="rounded border-[#E5E5DC] text-[#1F4ED8] focus:ring-[#1F4ED8]"
                  />
                  Filtrar por time destino
                </label>
              </div>
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl text-sm text-[#141042] bg-white focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
              >
                <option value="__none__">Sem gestor (topo da hierarquia)</option>
                {filteredManagers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                    {m.position ? ` — ${m.position}` : ''}
                    {m.department && m.department !== targetTeamName ? ` (${m.department})` : ''}
                  </option>
                ))}
              </select>
              {filteredManagers.length === 0 && filterManagerByTeam && (
                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Nenhum gestor encontrado neste time. Desmarque o filtro para ver todos.
                </p>
              )}
            </div>

            {/* Feedback */}
            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E5DC] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#666666] hover:text-[#141042] hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving || !!successMsg}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1F4ED8] rounded-lg hover:bg-[#1845B8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Transferindo...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                Confirmar Transferência
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
