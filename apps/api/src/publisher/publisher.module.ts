import { Module } from '@nestjs/common';
import { PublisherController } from './publisher.controller';
import { PublisherService } from './publisher.service';
import { GupyAdapter } from './adapters/gupy.adapter';
import { VagasAdapter } from './adapters/vagas.adapter';
import { LinkedInAdapter } from './adapters/linkedin.adapter';

@Module({
  controllers: [PublisherController],
  providers: [PublisherService, GupyAdapter, VagasAdapter, LinkedInAdapter],
  exports: [PublisherService],
})
export class PublisherModule {}
