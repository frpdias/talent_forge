export interface PhpWeights {
    tfci: number;
    nr1: number;
    copc: number;
}
export interface AlertThresholds {
    burnout_risk: number;
    conflict_latent: number;
    sudden_drop_percent: number;
    absenteeism_abnormal: number;
    php_score_critical: number;
    php_score_warning: number;
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
export declare const DEFAULT_PHP_SETTINGS: PhpSettings;
