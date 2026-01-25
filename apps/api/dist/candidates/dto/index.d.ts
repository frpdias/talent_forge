export declare class CreateCandidateDto {
    fullName: string;
    email?: string;
    phone?: string;
    location?: string;
    currentTitle?: string;
    linkedinUrl?: string;
    source?: string;
    salaryExpectation?: number;
    availabilityDate?: string;
    tags?: string[];
}
export declare class UpdateCandidateDto {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    currentTitle?: string;
    linkedinUrl?: string;
    source?: string;
    salaryExpectation?: number;
    availabilityDate?: string;
    tags?: string[];
}
export declare enum NoteContext {
    PROFILE = "profile",
    RESUME = "resume",
    ASSESSMENTS = "assessments",
    INTERVIEW = "interview",
    GENERAL = "general"
}
export declare class CreateCandidateNoteDto {
    note: string;
    context?: string;
}
export declare class UpdateCandidateNoteDto {
    note?: string;
    context?: string;
}
