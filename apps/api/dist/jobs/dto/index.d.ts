export declare enum EmploymentType {
    FULL_TIME = "full_time",
    PART_TIME = "part_time",
    CONTRACT = "contract",
    INTERNSHIP = "internship",
    FREELANCE = "freelance"
}
export declare enum SeniorityLevel {
    JUNIOR = "junior",
    MID = "mid",
    SENIOR = "senior",
    LEAD = "lead",
    DIRECTOR = "director",
    EXECUTIVE = "executive"
}
export declare enum JobStatus {
    OPEN = "open",
    ON_HOLD = "on_hold",
    CLOSED = "closed"
}
export declare class CreateJobDto {
    title: string;
    description?: string;
    location?: string;
    salaryMin?: number;
    salaryMax?: number;
    employmentType?: EmploymentType;
    seniority?: SeniorityLevel;
    status?: JobStatus;
}
export declare class UpdateJobDto {
    title?: string;
    description?: string;
    location?: string;
    salaryMin?: number;
    salaryMax?: number;
    employmentType?: EmploymentType;
    seniority?: SeniorityLevel;
    status?: JobStatus;
}
export declare class CreatePipelineStageDto {
    name: string;
    position: number;
}
export declare class UpdatePipelineStageDto {
    name?: string;
    position?: number;
}
