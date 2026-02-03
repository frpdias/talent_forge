"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
const settings_entity_1 = require("./entities/settings.entity");
let SettingsService = SettingsService_1 = class SettingsService {
    constructor() {
        this.logger = new common_1.Logger(SettingsService_1.name);
        this.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
    }
    async getSettings(orgId) {
        const { data, error } = await this.supabase
            .from('php_module_activations')
            .select('settings, is_active')
            .eq('org_id', orgId)
            .single();
        if (error || !data) {
            this.logger.warn(`No activation found for org ${orgId}, returning defaults`);
            return settings_entity_1.DEFAULT_PHP_SETTINGS;
        }
        const savedSettings = data.settings || {};
        return this.mergeWithDefaults(savedSettings);
    }
    async updateSettings(orgId, settings, userId) {
        const { data: existing, error: fetchError } = await this.supabase
            .from('php_module_activations')
            .select('settings')
            .eq('org_id', orgId)
            .single();
        if (fetchError) {
            this.logger.error(`Error fetching settings for org ${orgId}`, fetchError);
            throw new common_1.NotFoundException(`Organization ${orgId} not found or PHP module not activated`);
        }
        const currentSettings = existing?.settings || {};
        const newSettings = this.deepMerge(currentSettings, settings);
        if (newSettings.weights) {
            const sum = newSettings.weights.tfci + newSettings.weights.nr1 + newSettings.weights.copc;
            if (sum !== 100) {
                throw new Error(`Weights must sum to 100, got ${sum}`);
            }
        }
        const { data, error: updateError } = await this.supabase
            .from('php_module_activations')
            .update({
            settings: newSettings,
            updated_at: new Date().toISOString(),
        })
            .eq('org_id', orgId)
            .select('settings')
            .single();
        if (updateError) {
            this.logger.error(`Error updating settings for org ${orgId}`, updateError);
            throw updateError;
        }
        this.logger.log(`Settings updated for org ${orgId} by user ${userId}`);
        return this.mergeWithDefaults(data.settings);
    }
    async resetSettings(orgId, userId) {
        const { error } = await this.supabase
            .from('php_module_activations')
            .update({
            settings: {},
            updated_at: new Date().toISOString(),
        })
            .eq('org_id', orgId);
        if (error) {
            this.logger.error(`Error resetting settings for org ${orgId}`, error);
            throw error;
        }
        this.logger.log(`Settings reset to defaults for org ${orgId} by user ${userId}`);
        return settings_entity_1.DEFAULT_PHP_SETTINGS;
    }
    async testWebhook(url) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'test',
                    message: 'TalentForge PHP Module webhook test',
                    timestamp: new Date().toISOString(),
                }),
            });
            if (response.ok) {
                return { success: true, message: 'Webhook test successful' };
            }
            else {
                return { success: false, message: `Webhook returned status ${response.status}` };
            }
        }
        catch (error) {
            return { success: false, message: error.message || 'Webhook test failed' };
        }
    }
    mergeWithDefaults(saved) {
        return {
            weights: { ...settings_entity_1.DEFAULT_PHP_SETTINGS.weights, ...saved.weights },
            thresholds: { ...settings_entity_1.DEFAULT_PHP_SETTINGS.thresholds, ...saved.thresholds },
            notifications: { ...settings_entity_1.DEFAULT_PHP_SETTINGS.notifications, ...saved.notifications },
            ai_recommendations_enabled: saved.ai_recommendations_enabled ?? settings_entity_1.DEFAULT_PHP_SETTINGS.ai_recommendations_enabled,
            auto_action_plans_enabled: saved.auto_action_plans_enabled ?? settings_entity_1.DEFAULT_PHP_SETTINGS.auto_action_plans_enabled,
            action_plan_overdue_days: saved.action_plan_overdue_days ?? settings_entity_1.DEFAULT_PHP_SETTINGS.action_plan_overdue_days,
        };
    }
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] !== undefined && source[key] !== null) {
                if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(target[key] || {}, source[key]);
                }
                else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SettingsService);
//# sourceMappingURL=settings.service.js.map