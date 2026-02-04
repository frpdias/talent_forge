'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Save, RotateCcw, AlertTriangle, CheckCircle, Settings2, Bell, Brain, Sliders } from 'lucide-react';
import { useCurrentOrg } from '@/lib/hooks/useCurrentOrg';

interface PhpSettings {
  weights: {
    tfci: number;
    nr1: number;
    copc: number;
  };
  thresholds: {
    burnout_risk: number;
    conflict_latent: number;
    sudden_drop_percent: number;
    absenteeism_abnormal: number;
    php_score_critical: number;
    php_score_warning: number;
  };
  notifications: {
    email_enabled: boolean;
    email_recipients: string[];
    webhook_enabled: boolean;
    webhook_url?: string;
    critical_only: boolean;
  };
  ai_recommendations_enabled: boolean;
  auto_action_plans_enabled: boolean;
  action_plan_overdue_days: number;
}

const DEFAULT_SETTINGS: PhpSettings = {
  weights: { tfci: 30, nr1: 40, copc: 30 },
  thresholds: {
    burnout_risk: 2.5,
    conflict_latent: 2.0,
    sudden_drop_percent: 20,
    absenteeism_abnormal: 10,
    php_score_critical: 60,
    php_score_warning: 80,
  },
  notifications: {
    email_enabled: true,
    email_recipients: [],
    webhook_enabled: false,
    critical_only: false,
  },
  ai_recommendations_enabled: true,
  auto_action_plans_enabled: true,
  action_plan_overdue_days: 30,
};

export default function SettingsPage() {
  const { orgId, loading: orgLoading, error: orgError } = useCurrentOrg();
  const [settings, setSettings] = useState<PhpSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<PhpSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'weights' | 'thresholds' | 'notifications' | 'advanced'>('weights');

  useEffect(() => {
    if (orgId) {
      loadSettings(orgId);
    } else if (!orgLoading) {
      setLoading(false);
    }
  }, [orgId, orgLoading]);

  async function loadSettings(organizationId: string) {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get settings from php_module_activations
    const { data } = await supabase
      .from('php_module_activations')
      .select('settings')
      .eq('org_id', organizationId)
      .maybeSingle();

    if (data?.settings) {
      const merged = {
        weights: { ...DEFAULT_SETTINGS.weights, ...data.settings.weights },
        thresholds: { ...DEFAULT_SETTINGS.thresholds, ...data.settings.thresholds },
        notifications: { ...DEFAULT_SETTINGS.notifications, ...data.settings.notifications },
        ai_recommendations_enabled: data.settings.ai_recommendations_enabled ?? DEFAULT_SETTINGS.ai_recommendations_enabled,
        auto_action_plans_enabled: data.settings.auto_action_plans_enabled ?? DEFAULT_SETTINGS.auto_action_plans_enabled,
        action_plan_overdue_days: data.settings.action_plan_overdue_days ?? DEFAULT_SETTINGS.action_plan_overdue_days,
      };
      setSettings(merged);
      setOriginalSettings(merged);
    }

    setLoading(false);
  }

  async function saveSettings() {
    if (!orgId) return;

    // Validate weights sum to 100
    const weightsSum = settings.weights.tfci + settings.weights.nr1 + settings.weights.copc;
    if (weightsSum !== 100) {
      setError(`Os pesos devem somar 100%. Atualmente: ${weightsSum}%`);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error: updateError } = await supabase
        .from('php_module_activations')
        .update({
          settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', orgId);

      if (updateError) throw updateError;

      setOriginalSettings(settings);
      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }

  async function resetSettings() {
    if (!orgId) return;
    if (!confirm('Restaurar todas as configurações para os valores padrão?')) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error: updateError } = await supabase
        .from('php_module_activations')
        .update({
          settings: {},
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', orgId);

      if (updateError) throw updateError;

      setSettings(DEFAULT_SETTINGS);
      setOriginalSettings(DEFAULT_SETTINGS);
      setSuccess('Configurações restauradas para os valores padrão');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao restaurar configurações');
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
  const weightsSum = settings.weights.tfci + settings.weights.nr1 + settings.weights.copc;

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações do Módulo PHP</h1>
            <p className="text-gray-600 mt-1">
              Personalize pesos, alertas e notificações
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Padrão
            </button>
            <button
              onClick={saveSettings}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-[#1F4ED8] text-white rounded-lg hover:bg-[#1e40af] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b">
          {[
            { key: 'weights', label: 'Pesos', icon: Sliders },
            { key: 'thresholds', label: 'Alertas', icon: AlertTriangle },
            { key: 'notifications', label: 'Notificações', icon: Bell },
            { key: 'advanced', label: 'Avançado', icon: Brain },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'text-[#1F4ED8] border-[#1F4ED8]'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          {/* Weights Tab */}
          {activeTab === 'weights' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Pesos do PHP Score</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Defina a importância de cada componente no cálculo do score PHP final.
                  Os valores devem somar 100%.
                </p>
                
                <div className={`text-sm mb-4 ${weightsSum === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  Total: {weightsSum}% {weightsSum === 100 ? '✓' : '(deve ser 100%)'}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TFCI (Comportamental): {settings.weights.tfci}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.weights.tfci}
                      onChange={e => setSettings({
                        ...settings,
                        weights: { ...settings.weights, tfci: parseInt(e.target.value) }
                      })}
                      className="w-full accent-[#1F4ED8]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Mede colaboração, comunicação, adaptabilidade, responsabilidade e liderança</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NR-1 (Saúde): {settings.weights.nr1}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.weights.nr1}
                      onChange={e => setSettings({
                        ...settings,
                        weights: { ...settings.weights, nr1: parseInt(e.target.value) }
                      })}
                      className="w-full accent-[#1F4ED8]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Avalia riscos psicossociais conforme NR-1 do Ministério do Trabalho</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      COPC (Performance): {settings.weights.copc}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.weights.copc}
                      onChange={e => setSettings({
                        ...settings,
                        weights: { ...settings.weights, copc: parseInt(e.target.value) }
                      })}
                      className="w-full accent-[#1F4ED8]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Indicadores operacionais: qualidade, eficiência, efetividade, CX e pessoas</p>
                  </div>
                </div>
              </div>

              {/* Visual Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Visualização do Score</h4>
                <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 transition-all" 
                    style={{ width: `${settings.weights.tfci}%` }}
                    title={`TFCI: ${settings.weights.tfci}%`}
                  />
                  <div 
                    className="bg-blue-500 transition-all" 
                    style={{ width: `${settings.weights.nr1}%` }}
                    title={`NR-1: ${settings.weights.nr1}%`}
                  />
                  <div 
                    className="bg-cyan-500 transition-all" 
                    style={{ width: `${settings.weights.copc}%` }}
                    title={`COPC: ${settings.weights.copc}%`}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded"></span> TFCI</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded"></span> NR-1</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-cyan-500 rounded"></span> COPC</span>
                </div>
              </div>
            </div>
          )}

          {/* Thresholds Tab */}
          {activeTab === 'thresholds' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Gatilhos de Alerta</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configure os limiares para disparo de alertas preventivos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔴 Risco de Burnout
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    step="0.1"
                    value={settings.thresholds.burnout_risk}
                    onChange={e => setSettings({
                      ...settings,
                      thresholds: { ...settings.thresholds, burnout_risk: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alerta quando NR-1 carga ≥ este valor (escala 1-3)</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🟡 Conflito Latente
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    step="0.1"
                    value={settings.thresholds.conflict_latent}
                    onChange={e => setSettings({
                      ...settings,
                      thresholds: { ...settings.thresholds, conflict_latent: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">NR-1 conflitos ≥ este valor + TFCI colaboração baixo</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🟠 Queda Brusca COPC
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={settings.thresholds.sudden_drop_percent}
                    onChange={e => setSettings({
                      ...settings,
                      thresholds: { ...settings.thresholds, sudden_drop_percent: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alerta se qualidade cair mais de X% em 30 dias</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔵 Absenteísmo Anormal
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.thresholds.absenteeism_abnormal}
                    onChange={e => setSettings({
                      ...settings,
                      thresholds: { ...settings.thresholds, absenteeism_abnormal: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alerta quando taxa de absenteísmo ≥ X%</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PHP Score - Crítico
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.thresholds.php_score_critical}
                    onChange={e => setSettings({
                      ...settings,
                      thresholds: { ...settings.thresholds, php_score_critical: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Score abaixo deste valor = zona vermelha</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PHP Score - Atenção
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.thresholds.php_score_warning}
                    onChange={e => setSettings({
                      ...settings,
                      thresholds: { ...settings.thresholds, php_score_warning: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Score abaixo deste valor = zona amarela</p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Notificações</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configure como você deseja receber alertas do módulo PHP.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Notificações por Email</p>
                    <p className="text-sm text-gray-600">Receba alertas no seu email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email_enabled}
                      onChange={e => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, email_enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#1F4ED8] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Webhook</p>
                    <p className="text-sm text-gray-600">Integre com sistemas externos (Slack, Teams, etc)</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.webhook_enabled}
                      onChange={e => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, webhook_enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#1F4ED8] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                {settings.notifications.webhook_enabled && (
                  <div className="p-4 border rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL do Webhook
                    </label>
                    <input
                      type="url"
                      value={settings.notifications.webhook_url || ''}
                      onChange={e => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, webhook_url: e.target.value }
                      })}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Apenas Alertas Críticos</p>
                    <p className="text-sm text-gray-600">Notificar somente situações de alto risco</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.critical_only}
                      onChange={e => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, critical_only: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#1F4ED8] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Configurações Avançadas</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Opções avançadas de automação e IA.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">🤖 Recomendações por IA</p>
                    <p className="text-sm text-gray-600">Receba sugestões inteligentes baseadas em padrões</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.ai_recommendations_enabled}
                      onChange={e => setSettings({
                        ...settings,
                        ai_recommendations_enabled: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#1F4ED8] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">⚡ Planos de Ação Automáticos</p>
                    <p className="text-sm text-gray-600">Criar planos automaticamente quando detectar risco alto</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.auto_action_plans_enabled}
                      onChange={e => setSettings({
                        ...settings,
                        auto_action_plans_enabled: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#1F4ED8] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dias para Vencimento (Planos de Ação)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.action_plan_overdue_days}
                    onChange={e => setSettings({
                      ...settings,
                      action_plan_overdue_days: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Planos sem data definida serão considerados atrasados após X dias
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Dicas de Configuração
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Pesos:</strong> Para operações de atendimento, aumente o peso do COPC. Para áreas administrativas, priorize NR-1.</li>
            <li>• <strong>Alertas:</strong> Comece com valores padrão e ajuste conforme a realidade da sua operação.</li>
            <li>• <strong>Notificações:</strong> Configure o webhook para receber alertas no Slack ou Teams em tempo real.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
