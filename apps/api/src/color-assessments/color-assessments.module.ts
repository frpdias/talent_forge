import { Module } from '@nestjs/common';
import { ColorAssessmentsController } from './color-assessments.controller';
import { ColorAssessmentsService } from './color-assessments.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ColorAssessmentsController],
  providers: [ColorAssessmentsService],
})
export class ColorAssessmentsModule {}
