"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const supabase_module_1 = require("./supabase/supabase.module");
const auth_module_1 = require("./auth/auth.module");
const organizations_module_1 = require("./organizations/organizations.module");
const jobs_module_1 = require("./jobs/jobs.module");
const candidates_module_1 = require("./candidates/candidates.module");
const applications_module_1 = require("./applications/applications.module");
const assessments_module_1 = require("./assessments/assessments.module");
const reports_module_1 = require("./reports/reports.module");
const color_assessments_module_1 = require("./color-assessments/color-assessments.module");
const pi_assessments_module_1 = require("./pi-assessments/pi-assessments.module");
const iam_module_1 = require("./iam/iam.module");
const invite_links_module_1 = require("./invite-links/invite-links.module");
const supabase_auth_guard_1 = require("./auth/guards/supabase-auth.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            supabase_module_1.SupabaseModule,
            auth_module_1.AuthModule,
            organizations_module_1.OrganizationsModule,
            jobs_module_1.JobsModule,
            candidates_module_1.CandidatesModule,
            applications_module_1.ApplicationsModule,
            assessments_module_1.AssessmentsModule,
            reports_module_1.ReportsModule,
            color_assessments_module_1.ColorAssessmentsModule,
            pi_assessments_module_1.PiAssessmentsModule,
            iam_module_1.IamModule,
            invite_links_module_1.InviteLinksModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: supabase_auth_guard_1.SupabaseAuthGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map