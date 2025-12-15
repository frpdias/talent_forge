export declare class CreateCandidateDto {
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
export declare class UpdateCandidateDto {
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
export declare class CreateCandidateNoteDto {
    note: string;
}
