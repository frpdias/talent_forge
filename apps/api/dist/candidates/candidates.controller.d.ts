import { CandidatesService } from './candidates.service';
import { CreateCandidateDto, UpdateCandidateDto, CreateCandidateNoteDto, UpdateCandidateNoteDto } from './dto';
import type { JwtPayload } from '../auth/auth.service';
export declare class CandidatesController {
    private candidatesService;
    constructor(candidatesService: CandidatesService);
    create(dto: CreateCandidateDto, orgId: string, user: JwtPayload): Promise<{
        id: any;
        ownerOrgId: any;
        fullName: any;
        email: any;
        phone: any;
        location: any;
        currentTitle: any;
        linkedinUrl: any;
        source: any;
        salaryExpectation: any;
        availabilityDate: any;
        tags: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(orgId: string, search?: string, tag?: string): Promise<{
        latestAssessment: any;
        id: any;
        ownerOrgId: any;
        fullName: any;
        email: any;
        phone: any;
        location: any;
        currentTitle: any;
        linkedinUrl: any;
        source: any;
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
        source: any;
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
        source: any;
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
    createNote(candidateId: string, dto: CreateCandidateNoteDto, orgId: string, user: JwtPayload): Promise<{
        id: any;
        candidateId: any;
        authorId: any;
        note: any;
        context: any;
        createdAt: any;
    }>;
    getNotes(candidateId: string, orgId: string, context?: string): Promise<{
        id: any;
        candidateId: any;
        authorId: any;
        authorName: any;
        authorEmail: any;
        note: any;
        context: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    updateNote(candidateId: string, noteId: string, dto: UpdateCandidateNoteDto, orgId: string, user: JwtPayload): Promise<{
        id: any;
        candidateId: any;
        authorId: any;
        note: any;
        context: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteNote(candidateId: string, noteId: string, orgId: string, user: JwtPayload): Promise<{
        success: boolean;
        message: string;
    }>;
}
