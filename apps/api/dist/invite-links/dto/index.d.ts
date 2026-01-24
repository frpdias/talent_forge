export declare class CreateInviteLinkDto {
    expiresAt?: string;
    maxUses?: number;
}
export declare class CreateCandidateFromInviteDto {
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
export declare class CreateCandidateAccountFromInviteDto {
    fullName: string;
    email: string;
    password: string;
}
