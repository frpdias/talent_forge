import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// Modules
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { JobsModule } from './jobs/jobs.module';
import { CandidatesModule } from './candidates/candidates.module';
import { ApplicationsModule } from './applications/applications.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { ReportsModule } from './reports/reports.module';
import { ColorAssessmentsModule } from './color-assessments/color-assessments.module';
import { PiAssessmentsModule } from './pi-assessments/pi-assessments.module';
import { IamModule } from './iam/iam.module';

// Guards
import { SupabaseAuthGuard } from './auth/guards/supabase-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    AuthModule,
    OrganizationsModule,
    JobsModule,
    CandidatesModule,
    ApplicationsModule,
    AssessmentsModule,
    ReportsModule,
    ColorAssessmentsModule,
    PiAssessmentsModule,
    IamModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
})
export class AppModule {}
