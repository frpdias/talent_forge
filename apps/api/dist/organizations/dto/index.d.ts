export declare enum OrgType {
    HEADHUNTER = "headhunter",
    COMPANY = "company"
}
export declare class CreateOrganizationDto {
    name: string;
    orgType: OrgType;
}
export declare class UpdateOrganizationDto {
    name?: string;
}
