export interface PhpWeights {
  tfci: number;  // 0-100, default 30
  nr1: number;   // 0-100, default 40
  copc: number;  // 0-100, default 30
}

export interface AlertThresholds {
  burnout_risk: number;          // default 2.5 (1-3 scale)
  conflict_latent: number;       // default 2.0 (1-3 scale)
  sudden_drop_percent: number;   // default 20 (%)
  absenteeism_abnormal: number;  // default 10 (%)
  php_score_critical: number;    // default 60 (0-100)
  php_score_warning: number;     // default 80 (0-100)
}

export interface NotificationSettings {
  email_enabled: boolean;
  email_recipients: string[];
  webhook_enabled: boolean;
  webhook_url?: string;
  critical_only: boolean;
}

export interface PhpSettings {
  weights: PhpWeights;
  thresholds: AlertThresholds;
  notifications: NotificationSettings;
  ai_recommendations_enabled: boolean;
  auto_action_plans_enabled: boolean;
  action_plan_overdue_days: number;
}

export const DEFAULT_PHP_SETTINGS: PhpSettings = {
  weights: {
    tfci: 30,
    nr1: 40,
    copc: 30,
  },
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
