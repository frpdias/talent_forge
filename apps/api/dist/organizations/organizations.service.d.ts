import { SupabaseService } from '../supabase/supabase.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';
export declare class OrganizationsService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    create(dto: CreateOrganizationDto, userId: string): Promise<{
        id: any;
        name: any;
        orgType: any;
        slug: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(userId: string): Promise<{
        role: any;
        id: any;
        name: any;
        orgType: any;
        slug: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    findOne(id: string, userId: string): Promise<{
        role: any;
        id: any;
        name: any;
        orgType: any;
        slug: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateOrganizationDto, userId: string): Promise<{
        id: any;
        name: any;
        orgType: any;
        slug: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getMembers(orgId: string, userId: string): Promise<any[]>;
    addMember(orgId: string, userId: string, role: string): Promise<any>;
    private mapToResponse;
}
