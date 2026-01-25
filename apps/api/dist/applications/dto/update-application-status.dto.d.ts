export declare enum ApplicationStatus {
    APPLIED = "applied",
    IN_PROCESS = "in_process",
    HIRED = "hired",
    REJECTED = "rejected"
}
export declare class UpdateApplicationStatusDto {
    status: ApplicationStatus;
    note?: string;
}
