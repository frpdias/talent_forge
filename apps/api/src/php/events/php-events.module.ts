import { Module, Global } from '@nestjs/common';
import { PhpEventsGateway } from './php-events.gateway';

@Global()
@Module({
  providers: [PhpEventsGateway],
  exports: [PhpEventsGateway],
})
export class PhpEventsModule {}
