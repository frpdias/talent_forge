import { Module } from '@nestjs/common';
import { PiAssessmentsController } from './pi-assessments.controller';
import { PiAssessmentsService } from './pi-assessments.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [PiAssessmentsController],
  providers: [PiAssessmentsService],
})
export class PiAssessmentsModule {}
