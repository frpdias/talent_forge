export declare enum ApplicationStatus {
    APPLIED = "applied",
    IN_PROCESS = "in_process",
    HIRED = "hired",
    REJECTED = "rejected"
}
export declare class CreateApplicationDto {
    jobId: string;
    candidateId: string;
}
export declare class UpdateApplicationStageDto {
    toStageId: string;
    status?: ApplicationStatus;
    note?: string;
}
export declare class UpdateApplicationStatusDto {
    status: ApplicationStatus;
    note?: string;
}
