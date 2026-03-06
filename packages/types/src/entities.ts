import {
  OrgType,
  EmploymentType,
  SeniorityLevel,
  ApplicationStatus,
  JobStatus,
  AssessmentKind,
  OrgMemberRole,
} from './enums';

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Organization
export interface Organization extends BaseEntity {
  name: string;
  orgType: OrgType;
  slug: string;
}

// Organization Member
export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: OrgMemberRole;
  createdAt: Date;
}

// Candidate
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

// Job
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

// Pipeline Stage
export interface PipelineStage {
  id: string;
  jobId: string;
  name: string;
  position: number;
  createdAt: Date;
}

// Application
export interface Application extends BaseEntity {
  jobId: string;
  candidateId: string;
  currentStageId?: string;
  status: ApplicationStatus;
  score?: number;
  createdBy?: string;
}

// Application Event
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

// Candidate Note
export interface CandidateNote {
  id: string;
  candidateId: string;
  authorId?: string;
  note: string;
  createdAt: Date;
}

// Assessment
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

// Assessment Traits (Big Five + DISC)
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

// Extended types with relations
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
