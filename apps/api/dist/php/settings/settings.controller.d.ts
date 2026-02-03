import { SettingsService } from './settings.service';
import { PhpSettingsDto } from './dto/settings.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(orgId: string): Promise<import("./entities/settings.entity").PhpSettings>;
    updateSettings(orgId: string, settings: PhpSettingsDto, req: any): Promise<import("./entities/settings.entity").PhpSettings>;
    resetSettings(orgId: string, req: any): Promise<import("./entities/settings.entity").PhpSettings>;
    testWebhook(body: {
        url: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
