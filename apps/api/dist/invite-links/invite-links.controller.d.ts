import { InviteLinksService } from './invite-links.service';
import { CreateCandidateFromInviteDto, CreateCandidateAccountFromInviteDto, CreateInviteLinkDto } from './dto';
import type { JwtPayload } from '../auth/auth.service';
export declare class InviteLinksController {
    private inviteLinksService;
    constructor(inviteLinksService: InviteLinksService);
    create(dto: CreateInviteLinkDto, orgId: string, orgRole: string, user: JwtPayload): Promise<{
        id: any;
        orgId: any;
        token: any;
        expiresAt: any;
        maxUses: any;
        usesCount: any;
        isActive: any;
    }>;
    validate(token: string): Promise<{
        valid: boolean;
        reason: string;
        orgId?: undefined;
        orgName?: undefined;
        expiresAt?: undefined;
        maxUses?: undefined;
        usesCount?: undefined;
        token?: undefined;
    } | {
        valid: boolean;
        orgId: string;
        orgName: string | null;
        expiresAt: string | null;
        maxUses: number | null;
        usesCount: number;
        token: string;
        reason?: undefined;
    }>;
    createCandidate(token: string, dto: CreateCandidateFromInviteDto): Promise<{
        id: any;
        orgId: any;
        fullName: any;
        email: any;
        createdAt: any;
    }>;
    registerCandidate(token: string, dto: CreateCandidateAccountFromInviteDto): Promise<{
        id: any;
        userId: string;
        orgId: any;
        fullName: any;
        email: any;
        createdAt: any;
    }>;
}
