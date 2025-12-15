import { SupabaseService } from '../supabase/supabase.service';
import { CreateCandidateDto, UpdateCandidateDto, CreateCandidateNoteDto } from './dto';
export declare class CandidatesService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    create(dto: CreateCandidateDto, orgId: string, userId: string): Promise<{
        id: any;
        ownerOrgId: any;
        fullName: any;
        email: any;
        phone: any;
        location: any;
        currentTitle: any;
        linkedinUrl: any;
        salaryExpectation: any;
        availabilityDate: any;
        tags: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(orgId: string, query: {
        search?: string;
        tag?: string;
    }): Promise<{
        latestAssessment: any;
        id: any;
        ownerOrgId: any;
        fullName: any;
        email: any;
        phone: any;
        location: any;
        currentTitle: any;
        linkedinUrl: any;
        salaryExpectation: any;
        availabilityDate: any;
        tags: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    findOne(id: string, orgId: string): Promise<{
        notes: any;
        assessments: any;
        id: any;
        ownerOrgId: any;
        fullName: any;
        email: any;
        phone: any;
        location: any;
        currentTitle: any;
        linkedinUrl: any;
        salaryExpectation: any;
        availabilityDate: any;
        tags: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateCandidateDto, orgId: string): Promise<{
        id: any;
        ownerOrgId: any;
        fullName: any;
        email: any;
        phone: any;
        location: any;
        currentTitle: any;
        linkedinUrl: any;
        salaryExpectation: any;
        availabilityDate: any;
        tags: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
    }>;
    delete(id: string, orgId: string): Promise<{
        success: boolean;
    }>;
    createNote(candidateId: string, dto: CreateCandidateNoteDto, orgId: string, userId: string): Promise<{
        id: any;
        candidateId: any;
        authorId: any;
        note: any;
        createdAt: any;
    }>;
    getNotes(candidateId: string, orgId: string): Promise<{
        id: any;
        candidateId: any;
        authorId: any;
        note: any;
        createdAt: any;
    }[]>;
    private mapToResponse;
}
