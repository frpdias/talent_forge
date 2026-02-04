import { SupabaseService } from '../../supabase/supabase.service';
import { CreateTeamDto, UpdateTeamDto, AddTeamMemberDto } from './dto';
export interface Team {
    id: string;
    org_id: string;
    name: string;
    description: string | null;
    manager_id: string | null;
    member_count: number;
    created_at: string;
    updated_at: string;
}
export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    role_in_team: 'member' | 'lead' | 'coordinator';
    joined_at: string;
    user?: {
        id: string;
        email: string;
        raw_user_meta_data?: {
            full_name?: string;
            avatar_url?: string;
        };
    };
}
export interface TeamWithMembers extends Team {
    members: TeamMember[];
    manager?: {
        id: string;
        email: string;
        raw_user_meta_data?: {
            full_name?: string;
        };
    };
}
export declare class TeamsService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    create(userId: string, dto: CreateTeamDto): Promise<Team>;
    findAll(orgId: string, options?: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: Team[];
        total: number;
    }>;
    findOne(orgId: string, teamId: string): Promise<TeamWithMembers>;
    update(orgId: string, teamId: string, dto: UpdateTeamDto): Promise<Team>;
    remove(orgId: string, teamId: string): Promise<void>;
    addMember(orgId: string, teamId: string, dto: AddTeamMemberDto): Promise<TeamMember>;
    removeMember(orgId: string, teamId: string, userId: string): Promise<void>;
    updateMemberRole(orgId: string, teamId: string, userId: string, role: 'member' | 'lead' | 'coordinator'): Promise<TeamMember>;
    getAvailableMembers(orgId: string, teamId: string): Promise<any[]>;
}
