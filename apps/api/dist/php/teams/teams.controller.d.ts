import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, AddTeamMemberDto } from './dto';
export declare class TeamsController {
    private readonly teamsService;
    constructor(teamsService: TeamsService);
    create(orgId: string, userId: string, createTeamDto: CreateTeamDto): Promise<import("./teams.service").Team>;
    findAll(orgId: string, search?: string, page?: string, limit?: string): Promise<{
        data: import("./teams.service").Team[];
        total: number;
    }>;
    findOne(orgId: string, id: string): Promise<import("./teams.service").TeamWithMembers>;
    update(orgId: string, id: string, updateTeamDto: UpdateTeamDto): Promise<import("./teams.service").Team>;
    remove(orgId: string, id: string): Promise<void>;
    addMember(orgId: string, id: string, addMemberDto: AddTeamMemberDto): Promise<import("./teams.service").TeamMember>;
    removeMember(orgId: string, id: string, userId: string): Promise<void>;
    updateMemberRole(orgId: string, id: string, userId: string, role: 'member' | 'lead' | 'coordinator'): Promise<import("./teams.service").TeamMember>;
    getAvailableMembers(orgId: string, id: string): Promise<any[]>;
}
