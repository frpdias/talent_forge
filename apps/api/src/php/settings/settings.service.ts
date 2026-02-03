import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PhpSettingsDto } from './dto/settings.dto';
import { PhpSettings, DEFAULT_PHP_SETTINGS } from './entities/settings.entity';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }

  /**
   * Get settings for an organization
   * Returns default settings merged with any custom settings
   */
  async getSettings(orgId: string): Promise<PhpSettings> {
    const { data, error } = await this.supabase
      .from('php_module_activations')
      .select('settings, is_active')
      .eq('org_id', orgId)
      .single();

    if (error || !data) {
      this.logger.warn(`No activation found for org ${orgId}, returning defaults`);
      return DEFAULT_PHP_SETTINGS;
    }

    // Merge saved settings with defaults
    const savedSettings = data.settings || {};
    return this.mergeWithDefaults(savedSettings);
  }

  /**
   * Update settings for an organization
   * Only updates the fields provided, keeps others unchanged
   */
  async updateSettings(orgId: string, settings: PhpSettingsDto, userId: string): Promise<PhpSettings> {
    // First get existing settings
    const { data: existing, error: fetchError } = await this.supabase
      .from('php_module_activations')
      .select('settings')
      .eq('org_id', orgId)
      .single();

    if (fetchError) {
      this.logger.error(`Error fetching settings for org ${orgId}`, fetchError);
      throw new NotFoundException(`Organization ${orgId} not found or PHP module not activated`);
    }

    // Deep merge with existing settings
    const currentSettings = existing?.settings || {};
    const newSettings = this.deepMerge(currentSettings, settings);

    // Validate weights sum to 100
    if (newSettings.weights) {
      const sum = newSettings.weights.tfci + newSettings.weights.nr1 + newSettings.weights.copc;
      if (sum !== 100) {
        throw new Error(`Weights must sum to 100, got ${sum}`);
      }
    }

    // Update in database
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

  /**
   * Reset settings to defaults for an organization
   */
  async resetSettings(orgId: string, userId: string): Promise<PhpSettings> {
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
    return DEFAULT_PHP_SETTINGS;
  }

  /**
   * Validate webhook URL by sending a test request
   */
  async testWebhook(url: string): Promise<{ success: boolean; message: string }> {
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
      } else {
        return { success: false, message: `Webhook returned status ${response.status}` };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Webhook test failed' };
    }
  }

  // =====================================================================
  // PRIVATE HELPERS
  // =====================================================================

  private mergeWithDefaults(saved: Partial<PhpSettings>): PhpSettings {
    return {
      weights: { ...DEFAULT_PHP_SETTINGS.weights, ...saved.weights },
      thresholds: { ...DEFAULT_PHP_SETTINGS.thresholds, ...saved.thresholds },
      notifications: { ...DEFAULT_PHP_SETTINGS.notifications, ...saved.notifications },
      ai_recommendations_enabled: saved.ai_recommendations_enabled ?? DEFAULT_PHP_SETTINGS.ai_recommendations_enabled,
      auto_action_plans_enabled: saved.auto_action_plans_enabled ?? DEFAULT_PHP_SETTINGS.auto_action_plans_enabled,
      action_plan_overdue_days: saved.action_plan_overdue_days ?? DEFAULT_PHP_SETTINGS.action_plan_overdue_days,
    };
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== undefined && source[key] !== null) {
        if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }
}
