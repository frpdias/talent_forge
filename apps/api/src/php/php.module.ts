import { Module } from '@nestjs/common';
import { PhpController } from './php.controller';
import { PhpService } from './php.service';
import { PhpModuleGuard } from './guards/php-module.guard';
import { TfciModule } from './tfci/tfci.module';
import { Nr1Module } from './nr1/nr1.module';
import { CopcModule } from './copc/copc.module';
import { AiModule } from './ai/ai.module';
import { EmployeesModule } from './employees/employees.module';
import { ActionPlansModule } from './action-plans/action-plans.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [TfciModule, Nr1Module, CopcModule, AiModule, EmployeesModule, ActionPlansModule, SettingsModule],
  controllers: [PhpController],
  providers: [PhpService, PhpModuleGuard],
  exports: [PhpService, PhpModuleGuard],
})
export class PhpModule {}
