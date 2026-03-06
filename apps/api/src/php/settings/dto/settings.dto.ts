import { IsNumber, IsOptional, IsBoolean, IsString, Min, Max, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PhpWeightsDto {
  @ApiProperty({ description: 'TFCI weight (0-100)', default: 30 })
  @IsNumber()
  @Min(0)
  @Max(100)
  tfci: number;

  @ApiProperty({ description: 'NR-1 weight (0-100)', default: 40 })
  @IsNumber()
  @Min(0)
  @Max(100)
  nr1: number;

  @ApiProperty({ description: 'COPC weight (0-100)', default: 30 })
  @IsNumber()
  @Min(0)
  @Max(100)
  copc: number;
}

export class AlertThresholdsDto {
  @ApiPropertyOptional({ description: 'Burnout risk threshold (NR-1 carga + COPC pessoas)', default: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  burnout_risk?: number;

  @ApiPropertyOptional({ description: 'Conflict threshold (NR-1 conflitos + TFCI colaboração)', default: 2.0 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  conflict_latent?: number;

  @ApiPropertyOptional({ description: 'Sudden drop threshold (COPC quality drop %)', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(50)
  sudden_drop_percent?: number;

  @ApiPropertyOptional({ description: 'Absenteeism abnormal threshold (%)', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  absenteeism_abnormal?: number;

  @ApiPropertyOptional({ description: 'PHP Score critical threshold', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  php_score_critical?: number;

  @ApiPropertyOptional({ description: 'PHP Score warning threshold', default: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  php_score_warning?: number;
}

export class NotificationSettingsDto {
  @ApiPropertyOptional({ description: 'Enable email notifications', default: true })
  @IsOptional()
  @IsBoolean()
  email_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Email recipients for alerts' })
  @IsOptional()
  @IsString({ each: true })
  email_recipients?: string[];

  @ApiPropertyOptional({ description: 'Enable webhook notifications', default: false })
  @IsOptional()
  @IsBoolean()
  webhook_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Webhook URL for notifications' })
  @IsOptional()
  @IsString()
  webhook_url?: string;

  @ApiPropertyOptional({ description: 'Notify on critical alerts only', default: false })
  @IsOptional()
  @IsBoolean()
  critical_only?: boolean;
}

export class PhpSettingsDto {
  @ApiPropertyOptional({ description: 'PHP Score weights' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PhpWeightsDto)
  weights?: PhpWeightsDto;

  @ApiPropertyOptional({ description: 'Alert thresholds' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AlertThresholdsDto)
  thresholds?: AlertThresholdsDto;

  @ApiPropertyOptional({ description: 'Notification settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto;

  @ApiPropertyOptional({ description: 'Enable AI recommendations', default: true })
  @IsOptional()
  @IsBoolean()
  ai_recommendations_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable automatic action plan creation', default: true })
  @IsOptional()
  @IsBoolean()
  auto_action_plans_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Days to consider overdue for action plans', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  action_plan_overdue_days?: number;
}

export class UpdatePhpSettingsDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  org_id: string;

  @ApiProperty({ description: 'Settings to update' })
  @ValidateNested()
  @Type(() => PhpSettingsDto)
  settings: PhpSettingsDto;
}
