import { Nr1Service } from './nr1.service';
import { CreateNr1AssessmentDto, UpdateNr1AssessmentDto } from './dto/nr1-assessment.dto';
export declare class Nr1Controller {
    private readonly nr1Service;
    constructor(nr1Service: Nr1Service);
    createAssessment(dto: CreateNr1AssessmentDto, req: any): Promise<any>;
    listAssessments(orgId: string, teamId?: string, userId?: string, limit?: string): Promise<any[]>;
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
    generateActionPlans(body: {
        org_id: string;
        min_risk_level: number;
    }, req: any): Promise<{
        generated_count: number;
        action_plans: any[];
    }>;
    createSelfAssessment(dto: any, req: any): Promise<any>;
    listSelfAssessments(orgId: string, employeeId?: string, limit?: string): Promise<any[]>;
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
    createInvitation(body: {
        org_id: string;
        employee_ids: string[];
        organizational_assessment_id?: string;
    }, req: any): Promise<{
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
}
