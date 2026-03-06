import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { PeerSelectionController } from './controllers/peer-selection.controller';
import { PeerSelectionService } from './services/peer-selection.service';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [PeerSelectionController],
  providers: [PeerSelectionService],
  exports: [PeerSelectionService],
})
export class TfciModule {}
