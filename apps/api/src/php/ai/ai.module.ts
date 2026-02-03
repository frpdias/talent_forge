import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { TfciService } from '../tfci/tfci.service';
import { Nr1Service } from '../nr1/nr1.service';
import { CopcService } from '../copc/copc.service';

@Module({
  imports: [],
  controllers: [AiController],
  providers: [AiService, TfciService, Nr1Service, CopcService],
  exports: [AiService],
})
export class AiModule {}
