import { Module } from '@nestjs/common';
import { ActionPlansController } from './action-plans.controller';
import { ActionPlansService } from './action-plans.service';

@Module({
  controllers: [ActionPlansController],
  providers: [ActionPlansService],
  exports: [ActionPlansService],
})
export class ActionPlansModule {}
