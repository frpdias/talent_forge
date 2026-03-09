import { Module } from '@nestjs/common';
import { InviteLinksController } from './invite-links.controller';
import { InviteLinksService } from './invite-links.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [SupabaseModule, AuthModule, EmailModule],
  controllers: [InviteLinksController],
  providers: [InviteLinksService],
  exports: [InviteLinksService],
})
export class InviteLinksModule {}
