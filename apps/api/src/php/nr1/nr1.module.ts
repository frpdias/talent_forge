import { Module } from '@nestjs/common';
import { Nr1Controller } from './nr1.controller';
import { Nr1Service } from './nr1.service';

@Module({
  controllers: [Nr1Controller],
  providers: [Nr1Service],
  exports: [Nr1Service],
})
export class Nr1Module {}
