'use client';

import { useState, useEffect } from 'react';
import { Settings, Bell, Shield, Database, Mail, Globe, Save, RefreshCw } from 'lucide-react';

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    // Notificações
    emailNotifications: true,
    securityAlerts: true,
    systemUpdates: false,
    
    // Segurança
    sessionTimeout: '30',
    passwordExpiry: '90',
    mfaRequired: false,
    
    // Sistema
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info',
    
    // Email
    smtpServer: '',
    smtpPort: '587',
    smtpUser: '',
    
    // Geral
    siteName: 'TalentForge',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          // Mapear settings do banco para o estado local
          const dbSettings = data.settings;
          
          setSettings({
            // Notificações
            emailNotifications: dbSettings.notifications?.email_enabled?.enabled ?? true,
            securityAlerts: dbSettings.notifications?.security_alerts?.enabled ?? true,
            systemUpdates: dbSettings.notifications?.system_updates?.enabled ?? false,
            
            // Segurança
            sessionTimeout: String(dbSettings.security?.session_timeout?.minutes ?? 30),
            passwordExpiry: String(dbSettings.security?.password_expiry?.days ?? 90),
            mfaRequired: dbSettings.security?.mfa_required_admin?.enabled ?? false,
            
            // Sistema
            maintenanceMode: dbSettings.system?.maintenance_mode?.enabled ?? false,
            debugMode: dbSettings.system?.debug_mode?.enabled ?? false,
            logLevel: dbSettings.system?.log_level?.level ?? 'info',
            
            // Email
            smtpServer: dbSettings.smtp?.server?.server ?? '',
            smtpPort: String(dbSettings.smtp?.port?.port ?? 587),
            smtpUser: dbSettings.smtp?.username?.username ?? '',
            
            // Geral
            siteName: dbSettings.general?.site_name?.name ?? 'TalentForge',
            timezone: dbSettings.general?.timezone?.timezone ?? 'America/Sao_Paulo',
            language: dbSettings.general?.language?.language ?? 'pt-BR',
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Mapear estado local para formato do banco
      const settingsPayload = {
        notifications: {
          email_enabled: { enabled: settings.emailNotifications },
          security_alerts: { enabled: settings.securityAlerts },
          system_updates: { enabled: settings.systemUpdates },
        },
        security: {
          session_timeout: { minutes: parseInt(settings.sessionTimeout) },
          password_expiry: { days: parseInt(settings.passwordExpiry) },
          mfa_required_admin: { enabled: settings.mfaRequired },
        },
        system: {
          maintenance_mode: { enabled: settings.maintenanceMode },
          debug_mode: { enabled: settings.debugMode },
          log_level: { level: settings.logLevel },
        },
        smtp: {
          server: { server: settings.smtpServer },
          port: { port: parseInt(settings.smtpPort) },
          username: { username: settings.smtpUser },
        },
        general: {
          site_name: { name: settings.siteName },
          timezone: { timezone: settings.timezone },
          language: { language: settings.language },
        },
      };

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsPayload }),
      });

      if (response.ok) {
        alert('✅ Configurações salvas com sucesso!');
      } else {
        const error = await response.json();
        alert(`❌ Erro ao salvar: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('❌ Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#141042] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#141042] flex items-center">
            <Settings className="w-6 h-6 mr-3 text-[#141042]" />
            Configurações do Sistema
          </h2>
          <p className="text-sm sm:text-base text-[#666666] mt-1">
            Gerencie as configurações globais da plataforma
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#141042]/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Salvando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Salvar Alterações</span>
            </>
          )}
        </button>
      </div>

      {/* Notificações */}
      <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[#141042] mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notificações
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg">
            <div>
              <h4 className="font-semibold text-[#141042]">Notificações por Email</h4>
              <p className="text-sm text-[#666666]">Receber notificações importantes por email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#E5E5DC] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg">
            <div>
              <h4 className="font-semibold text-[#141042]">Alertas de Segurança</h4>
              <p className="text-sm text-[#666666]">Notificar sobre eventos críticos de segurança</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.securityAlerts}
                onChange={(e) => setSettings({ ...settings, securityAlerts: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#E5E5DC] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg">
            <div>
              <h4 className="font-semibold text-[#141042]">Atualizações do Sistema</h4>
              <p className="text-sm text-[#666666]">Receber notificações sobre novas funcionalidades</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.systemUpdates}
                onChange={(e) => setSettings({ ...settings, systemUpdates: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#E5E5DC] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Segurança */}
      <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[#141042] mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Segurança
        </h3>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#141042] mb-2">
              Timeout de Sessão (minutos)
            </label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
            />
            <p className="text-xs text-[#666666] mt-1">Tempo até logout automático</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#141042] mb-2">
              Expiração de Senha (dias)
            </label>
            <input
              type="number"
              value={settings.passwordExpiry}
              onChange={(e) => setSettings({ ...settings, passwordExpiry: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
            />
            <p className="text-xs text-[#666666] mt-1">Forçar troca periódica de senha</p>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg">
              <div>
                <h4 className="font-semibold text-[#141042]">MFA Obrigatório para Admins</h4>
                <p className="text-sm text-[#666666]">Requer autenticação de dois fatores</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.mfaRequired}
                  onChange={(e) => setSettings({ ...settings, mfaRequired: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#E5E5DC] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema */}
      <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[#141042] mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Sistema
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg">
            <div>
              <h4 className="font-semibold text-[#141042]">Modo Manutenção</h4>
              <p className="text-sm text-[#666666]">Bloquear acessos temporariamente</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#E5E5DC] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F59E0B]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg">
            <div>
              <h4 className="font-semibold text-[#141042]">Modo Debug</h4>
              <p className="text-sm text-[#666666]">Ativar logs detalhados (use com cautela)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.debugMode}
                onChange={(e) => setSettings({ ...settings, debugMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#E5E5DC] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EF4444]"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#141042] mb-2">
              Nível de Log
            </label>
            <select
              value={settings.logLevel}
              onChange={(e) => setSettings({ ...settings, logLevel: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] bg-white"
            >
              <option value="error">Error (apenas erros)</option>
              <option value="warn">Warning (erros + avisos)</option>
              <option value="info">Info (recomendado)</option>
              <option value="debug">Debug (tudo)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Configurações Gerais */}
      <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[#141042] mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          Geral
        </h3>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#141042] mb-2">
              Nome da Plataforma
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#141042] mb-2">
              Fuso Horário
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] bg-white"
            >
              <option value="America/Sao_Paulo">São Paulo (BRT)</option>
              <option value="America/New_York">Nova York (EST)</option>
              <option value="Europe/London">Londres (GMT)</option>
              <option value="Asia/Tokyo">Tóquio (JST)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#141042] mb-2">
              Idioma Padrão
            </label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] bg-white"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
          </div>
        </div>
      </div>

      {/* Configurações de Email */}
      <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[#141042] mb-4 flex items-center">
          <Mail className="w-5 h-5 mr-2" />
          Servidor de Email (SMTP)
        </h3>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#141042] mb-2">
              Servidor SMTP
            </label>
            <input
              type="text"
              value={settings.smtpServer}
              onChange={(e) => setSettings({ ...settings, smtpServer: e.target.value })}
              placeholder="smtp.exemplo.com"
              className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#141042] mb-2">
              Porta SMTP
            </label>
            <input
              type="text"
              value={settings.smtpPort}
              onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-[#141042] mb-2">
              Usuário SMTP
            </label>
            <input
              type="email"
              value={settings.smtpUser}
              onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
              placeholder="noreply@exemplo.com"
              className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
            />
          </div>
        </div>

        <div className="mt-4 p-4 bg-[#FAFAF8] rounded-lg">
          <p className="text-sm text-[#666666]">
            <strong>Nota:</strong> Por segurança, a senha SMTP deve ser configurada via variáveis de ambiente.
          </p>
        </div>
      </div>

      {/* Botão de Salvar no Final */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-[#141042] text-white rounded-lg hover:bg-[#141042]/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Salvar Todas as Alterações</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
