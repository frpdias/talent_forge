import { PhpSettingsDto } from './dto/settings.dto';
import { PhpSettings } from './entities/settings.entity';
export declare class SettingsService {
    private readonly logger;
    private supabase;
    constructor();
    getSettings(orgId: string): Promise<PhpSettings>;
    updateSettings(orgId: string, settings: PhpSettingsDto, userId: string): Promise<PhpSettings>;
    resetSettings(orgId: string, userId: string): Promise<PhpSettings>;
    testWebhook(url: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private mergeWithDefaults;
    private deepMerge;
}
