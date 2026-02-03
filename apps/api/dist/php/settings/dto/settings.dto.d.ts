export declare class PhpWeightsDto {
    tfci: number;
    nr1: number;
    copc: number;
}
export declare class AlertThresholdsDto {
    burnout_risk?: number;
    conflict_latent?: number;
    sudden_drop_percent?: number;
    absenteeism_abnormal?: number;
    php_score_critical?: number;
    php_score_warning?: number;
}
export declare class NotificationSettingsDto {
    email_enabled?: boolean;
    email_recipients?: string[];
    webhook_enabled?: boolean;
    webhook_url?: string;
    critical_only?: boolean;
}
export declare class PhpSettingsDto {
    weights?: PhpWeightsDto;
    thresholds?: AlertThresholdsDto;
    notifications?: NotificationSettingsDto;
    ai_recommendations_enabled?: boolean;
    auto_action_plans_enabled?: boolean;
    action_plan_overdue_days?: number;
}
export declare class UpdatePhpSettingsDto {
    org_id: string;
    settings: PhpSettingsDto;
}
