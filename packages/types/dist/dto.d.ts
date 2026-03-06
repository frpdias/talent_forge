import { OrgType, EmploymentType, SeniorityLevel, ApplicationStatus, JobStatus, AssessmentKind } from './enums';
export interface CreateOrganizationDto {
    name: string;
    orgType: OrgType;
}
export interface UpdateOrganizationDto {
    name?: string;
}
export interface CreateJobDto {
    title: string;
    description?: string;
    location?: string;
    salaryMin?: number;
    salaryMax?: number;
    employmentType?: EmploymentType;
    seniority?: SeniorityLevel;
    status?: JobStatus;
}
export interface UpdateJobDto {
    title?: string;
    description?: string;
    location?: string;
    salaryMin?: number;
    salaryMax?: number;
    employmentType?: EmploymentType;
    seniority?: SeniorityLevel;
    status?: JobStatus;
}
export interface CreatePipelineStageDto {
    name: string;
    position: number;
}
export interface UpdatePipelineStageDto {
    name?: string;
    position?: number;
}
export interface CreateCandidateDto {
    fullName: string;
    email?: string;
    phone?: string;
    location?: string;
    currentTitle?: string;
    linkedinUrl?: string;
    salaryExpectation?: number;
    availabilityDate?: string;
    tags?: string[];
}
export interface UpdateCandidateDto {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    currentTitle?: string;
    linkedinUrl?: string;
    salaryExpectation?: number;
    availabilityDate?: string;
    tags?: string[];
}
export interface CreateCandidateNoteDto {
    note: string;
}
export interface CreateApplicationDto {
    jobId: string;
    candidateId: string;
}
export interface UpdateApplicationStageDto {
    toStageId: string;
    status?: ApplicationStatus;
    note?: string;
}
export interface CreateAssessmentDto {
    candidateId: string;
    jobId?: string;
    assessmentKind?: AssessmentKind;
}
export interface SubmitAssessmentResultDto {
    assessmentId: string;
    answers: AssessmentAnswer[];
}
export interface AssessmentAnswer {
    questionId: string;
    value: number | string;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
}
export interface JobsQuery extends PaginationQuery {
    status?: JobStatus;
    search?: string;
}
export interface CandidatesQuery extends PaginationQuery {
    search?: string;
    tag?: string;
}
export interface ApplicationsQuery extends PaginationQuery {
    jobId?: string;
    status?: ApplicationStatus;
    stageId?: string;
}
