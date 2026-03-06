import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export class ActivatePhpDto {
  @IsEnum(['tfci_only', 'nr1_only', 'copc_only', 'full'])
  activation_plan: 'tfci_only' | 'nr1_only' | 'copc_only' | 'full';

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class UpdatePhpSettingsDto {
  @IsObject()
  settings: Record<string, any>;
}
