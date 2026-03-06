import { Module } from '@nestjs/common';
import { CopcController } from './copc.controller';
import { CopcService } from './copc.service';

@Module({
  controllers: [CopcController],
  providers: [CopcService],
  exports: [CopcService],
})
export class CopcModule {}
