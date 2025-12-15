// Enums matching the database schema

export enum OrgType {
  HEADHUNTER = 'headhunter',
  COMPANY = 'company',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance',
}

export enum SeniorityLevel {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  DIRECTOR = 'director',
  EXECUTIVE = 'executive',
}

export enum ApplicationStatus {
  APPLIED = 'applied',
  IN_PROCESS = 'in_process',
  HIRED = 'hired',
  REJECTED = 'rejected',
}

export enum JobStatus {
  OPEN = 'open',
  ON_HOLD = 'on_hold',
  CLOSED = 'closed',
}

export enum AssessmentKind {
  BEHAVIORAL_V1 = 'behavioral_v1',
}

export enum OrgMemberRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  VIEWER = 'viewer',
}
