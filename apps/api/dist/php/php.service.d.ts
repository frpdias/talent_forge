import { ActivatePhpDto, UpdatePhpSettingsDto } from './dto/activate-php.dto';
import { PhpActivation, PhpActivationStatus } from './entities/php-activation.entity';
export declare class PhpService {
    private supabase;
    getStatus(orgId: string, userId: string): Promise<PhpActivationStatus>;
    activate(orgId: string, userId: string, dto: ActivatePhpDto): Promise<PhpActivation>;
    deactivate(orgId: string, userId: string): Promise<PhpActivation>;
    updateSettings(orgId: string, userId: string, dto: UpdatePhpSettingsDto): Promise<PhpActivation>;
}
