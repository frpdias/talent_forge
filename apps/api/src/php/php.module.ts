import { Module } from '@nestjs/common';
import { PhpController } from './php.controller';
import { PhpService } from './php.service';
import { PhpModuleGuard } from './guards/php-module.guard';
import { TfciModule } from './tfci/tfci.module';
import { Nr1Module } from './nr1/nr1.module';
import { CopcModule } from './copc/copc.module';
import { AiModule } from './ai/ai.module';
import { EmployeesModule } from './employees/employees.module';
import { TeamsModule } from './teams/teams.module';
import { ActionPlansModule } from './action-plans/action-plans.module';
import { SettingsModule } from './settings/settings.module';
import { PhpEventsModule } from './events/php-events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PhpEventsModule, // Global WebSocket gateway
    TfciModule,
    Nr1Module,
    CopcModule,
    AiModule,
    EmployeesModule,
    TeamsModule,
    ActionPlansModule,
    SettingsModule,
    NotificationsModule,
    DashboardModule,
  ],
  controllers: [PhpController],
  providers: [PhpService, PhpModuleGuard],
  exports: [PhpService, PhpModuleGuard],
})
export class PhpModule {}
