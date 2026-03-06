import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiEnhancedService } from './ai-enhanced.service';
import { TfciService } from '../tfci/tfci.service';
import { Nr1Service } from '../nr1/nr1.service';
import { CopcService } from '../copc/copc.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [AiService, AiEnhancedService, TfciService, Nr1Service, CopcService],
  exports: [AiService, AiEnhancedService],
})
export class AiModule {}
