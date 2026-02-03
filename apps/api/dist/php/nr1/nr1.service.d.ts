import { ConfigService } from '@nestjs/config';
import { CreateNr1AssessmentDto, UpdateNr1AssessmentDto } from './dto/nr1-assessment.dto';
export declare class Nr1Service {
    private configService;
    private supabase;
    constructor(configService: ConfigService);
    createAssessment(dto: CreateNr1AssessmentDto, assessedBy: string): Promise<any>;
    listAssessments(filters: {
        org_id: string;
        team_id?: string;
        user_id?: string;
        limit?: number;
    }): Promise<any[]>;
    getAssessment(id: string): Promise<any>;
    updateAssessment(id: string, dto: UpdateNr1AssessmentDto): Promise<any>;
    deleteAssessment(id: string): Promise<{
        message: string;
    }>;
    getRiskMatrix(orgId: string, teamId?: string): Promise<{
        org_id: string;
        team_id: string | undefined;
        dimensions: {
            team_id: any;
            team_name: any;
            scores: any[];
            high_risk_count: any;
            assessments_count: any;
        }[];
        overall_risk: string;
    }>;
    getComplianceReport(orgId: string): Promise<{
        org_id: string;
        report_date: string;
        period: string;
        summary: {
            total_assessments: number;
            high_risk: number;
            medium_risk: number;
            low_risk: number;
            compliance_status: string;
        };
        critical_dimensions: {
            dimension: string;
            average: number;
        }[];
        recommendations: string[];
        legal_evidence: {
            nr1_version: string;
            assessment_frequency: string;
            action_plans_generated: boolean;
        };
    }>;
    generateActionPlans(orgId: string, minRiskLevel: number, createdBy: string): Promise<{
        generated_count: number;
        action_plans: any[];
    }>;
    private getThreeMonthsAgo;
    private calculateOverallRisk;
    private calculateDimensionAverages;
    private getHighRiskDimensions;
    private getRecommendedActions;
    private getActionsForDimension;
    private generateRecommendations;
    createSelfAssessment(dto: any, userId: string): Promise<any>;
    listSelfAssessments(filters: {
        org_id: string;
        employee_id?: string;
        limit?: number;
    }): Promise<any[]>;
    getSelfAssessment(id: string): Promise<any>;
    getComparativeAnalysis(orgId: string, employeeId?: string): Promise<{
        comparisons: any[];
        statistics: {
            total_comparisons: number;
            critical_gaps: number;
            significant_gaps: number;
            aligned: number;
            optimistic_bias_count: number;
            pessimistic_bias_count: number;
            average_perception_gap: string | number;
        };
        insights: string[];
    }>;
    private generateComparativeInsights;
    createInvitations(data: {
        org_id: string;
        employee_ids: string[];
        organizational_assessment_id?: string;
    }, invitedBy: string): Promise<{
        success: boolean;
        invitations: any[];
        message: string;
    }>;
    listInvitations(orgId: string, status?: string): Promise<{
        invitations: any[];
    }>;
    getInvitation(id: string): Promise<any>;
    getInvitationByToken(token: string): Promise<{
        valid: boolean;
        invitation: {
            id: any;
            org_id: any;
            employee_id: any;
            employee: any;
            organizational_assessment_id: any;
            expires_at: any;
            status: any;
        };
    }>;
    resendInvitation(id: string): Promise<{
        success: boolean;
        invitation: any;
        message: string;
    }>;
    cancelInvitation(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    linkInvitationToSelfAssessment(invitationId: string, selfAssessmentId: string): Promise<void>;
}
