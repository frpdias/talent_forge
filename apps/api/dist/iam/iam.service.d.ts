import { SupabaseService } from '../supabase/supabase.service';
import { AddTenantUserDto, CreateApiKeyDto, CreatePermissionDto, CreatePolicyDto, CreateRoleDto, CreateTenantDto, UpdateTenantUserDto } from './dto';
export declare class IamService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    listTenants(userId: string): Promise<{
        tenant: any;
        role: any;
        status: any;
    }[]>;
    createTenant(dto: CreateTenantDto, userId: string): Promise<any>;
    getTenant(tenantId: string, userId: string): Promise<{
        tenant: any;
        role: any;
    }>;
    addTenantUser(tenantId: string, dto: AddTenantUserDto, userId: string): Promise<any>;
    updateTenantUser(tenantId: string, targetUserId: string, dto: UpdateTenantUserDto, userId: string): Promise<any>;
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
