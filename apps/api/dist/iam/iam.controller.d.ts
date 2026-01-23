import type { JwtPayload } from '../auth/auth.service';
import { IamService } from './iam.service';
import { AddTenantUserDto, CreateApiKeyDto, CreatePermissionDto, CreatePolicyDto, CreateRoleDto, CreateTenantDto, UpdateTenantUserDto } from './dto';
export declare class IamController {
    private readonly iamService;
    constructor(iamService: IamService);
    listTenants(user: JwtPayload): Promise<{
        tenant: any;
        role: any;
        status: any;
    }[]>;
    createTenant(dto: CreateTenantDto, user: JwtPayload): Promise<any>;
    getTenant(tenantId: string, user: JwtPayload): Promise<{
        tenant: any;
        role: any;
    }>;
    addTenantUser(tenantId: string, dto: AddTenantUserDto, user: JwtPayload): Promise<any>;
    updateTenantUser(tenantId: string, targetUserId: string, dto: UpdateTenantUserDto, user: JwtPayload): Promise<any>;
    listRoles(): Promise<any[]>;
    createRole(dto: CreateRoleDto): Promise<any>;
    listPermissions(): Promise<any[]>;
    createPermission(dto: CreatePermissionDto): Promise<any>;
    createPolicy(dto: CreatePolicyDto): Promise<any>;
    listAuditLogs(tenantId?: string): Promise<any[]>;
    listSecurityEvents(tenantId?: string): Promise<any[]>;
    createApiKey(dto: CreateApiKeyDto): Promise<{
        apiKey: string;
        record: {
            id: any;
            tenant_id: any;
            scopes: any;
            expires_at: any;
            created_at: any;
        };
    }>;
    deleteApiKey(id: string): Promise<{
        deleted: boolean;
    }>;
}
