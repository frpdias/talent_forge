"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PHP_SETTINGS = void 0;
exports.DEFAULT_PHP_SETTINGS = {
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
//# sourceMappingURL=settings.entity.js.map