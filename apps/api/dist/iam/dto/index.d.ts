export declare class CreateTenantDto {
    name: string;
    planId?: string;
}
export declare class AddTenantUserDto {
    userId: string;
    role?: string;
}
export declare class UpdateTenantUserDto {
    role?: string;
    status?: string;
}
export declare class CreateRoleDto {
    name: string;
    scope?: string;
}
export declare class CreatePermissionDto {
    action: string;
    resource: string;
}
export declare class CreatePolicyDto {
    effect?: string;
    conditions: Record<string, any>;
}
export declare class CreateApiKeyDto {
    tenantId: string;
    scopes?: string[];
    expiresAt?: string;
}
