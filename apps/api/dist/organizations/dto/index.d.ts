export declare enum OrgType {
    HEADHUNTER = "headhunter",
    COMPANY = "company"
}
export declare enum OrgSize {
    MICRO = "micro",
    SMALL = "small",
    MEDIUM = "medium",
    LARGE = "large",
    ENTERPRISE = "enterprise"
}
export declare class CreateOrganizationDto {
    name: string;
    orgType: OrgType;
    cnpj?: string;
    industry?: string;
}
export declare class UpdateOrganizationDto {
    name?: string;
    cnpj?: string;
    industry?: string;
    size?: OrgSize;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    description?: string;
    logoUrl?: string;
}
