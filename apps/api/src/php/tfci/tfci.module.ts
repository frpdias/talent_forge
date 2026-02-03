import { Module } from '@nestjs/common';
import { TfciController } from './tfci.controller';
import { TfciService } from './tfci.service';

@Module({
  controllers: [TfciController],
  providers: [TfciService],
  exports: [TfciService],
})
export class TfciModule {}
