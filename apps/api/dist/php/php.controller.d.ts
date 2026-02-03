import { PhpService } from './php.service';
import { ActivatePhpDto, UpdatePhpSettingsDto } from './dto/activate-php.dto';
export declare class PhpController {
    private readonly phpService;
    constructor(phpService: PhpService);
    getStatus(orgId: string, userId: string): Promise<import("./entities/php-activation.entity").PhpActivationStatus>;
    activate(orgId: string, userId: string, dto: ActivatePhpDto): Promise<import("./entities/php-activation.entity").PhpActivation>;
    deactivate(orgId: string, userId: string): Promise<import("./entities/php-activation.entity").PhpActivation>;
    updateSettings(orgId: string, userId: string, dto: UpdatePhpSettingsDto): Promise<import("./entities/php-activation.entity").PhpActivation>;
}
