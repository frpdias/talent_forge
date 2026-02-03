import { OrgType, EmploymentType, SeniorityLevel, ApplicationStatus, JobStatus, AssessmentKind, OrgMemberRole } from './enums';
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
}
export interface Organization extends BaseEntity {
    name: string;
    orgType: OrgType;
    slug: string;
}
export interface OrgMember {
    id: string;
    orgId: string;
    userId: string;
    role: OrgMemberRole;
    createdAt: Date;
}
export interface Candidate extends BaseEntity {
    ownerOrgId: string;
    fullName: string;
    email?: string;
    phone?: string;
    location?: string;
    currentTitle?: string;
    linkedinUrl?: string;
    salaryExpectation?: number;
    availabilityDate?: Date;
    tags?: string[];
    createdBy?: string;
}
export interface Job extends BaseEntity {
    orgId: string;
    title: string;
    description?: string;
    location?: string;
    salaryMin?: number;
    salaryMax?: number;
    employmentType?: EmploymentType;
    seniority?: SeniorityLevel;
    status: JobStatus;
    createdBy?: string;
}
export interface PipelineStage {
    id: string;
    jobId: string;
    name: string;
    position: number;
    createdAt: Date;
}
export interface Application extends BaseEntity {
    jobId: string;
    candidateId: string;
    currentStageId?: string;
    status: ApplicationStatus;
    score?: number;
    createdBy?: string;
}
export interface ApplicationEvent {
    id: string;
    applicationId: string;
    fromStageId?: string;
    toStageId?: string;
    status?: ApplicationStatus;
    note?: string;
    actorId?: string;
    createdAt: Date;
}
export interface CandidateNote {
    id: string;
    candidateId: string;
    authorId?: string;
    note: string;
    createdAt: Date;
}
export interface Assessment {
    id: string;
    candidateId: string;
    jobId?: string;
    assessmentKind: AssessmentKind;
    rawScore?: number;
    normalizedScore?: number;
    traits?: AssessmentTraits;
    createdAt: Date;
}
export interface AssessmentTraits {
    bigFive?: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
    };
    disc?: {
        dominance: number;
        influence: number;
        steadiness: number;
        conscientiousness: number;
    };
    summary?: string;
}
export interface ApplicationWithDetails extends Application {
    candidate?: Candidate;
    job?: Job;
    currentStage?: PipelineStage;
    events?: ApplicationEvent[];
}
export interface JobWithPipeline extends Job {
    stages?: PipelineStage[];
    applications?: ApplicationWithDetails[];
}
export interface CandidateWithNotes extends Candidate {
    notes?: CandidateNote[];
    assessments?: Assessment[];
}
