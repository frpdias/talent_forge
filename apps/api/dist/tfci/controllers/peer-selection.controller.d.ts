import { PeerSelectionService } from '../services/peer-selection.service';
import { RegisterPeerSelectionDto, PeerSelectionQuotaDto, EligiblePeerDto, PeerSelectionResultDto, GenerateRandomSelectionsDto, GenerateAssessmentsResultDto } from '../dto/peer-selection.dto';
export declare class PeerSelectionController {
    private readonly peerSelectionService;
    constructor(peerSelectionService: PeerSelectionService);
    getQuota(cycleId: string, employeeId: string, organizationId: string): Promise<PeerSelectionQuotaDto>;
    getEligiblePeers(cycleId: string, employeeId: string, organizationId: string): Promise<EligiblePeerDto[]>;
    registerSelection(cycleId: string, selectorId: string, dto: RegisterPeerSelectionDto): Promise<PeerSelectionResultDto>;
    generateRandomSelections(cycleId: string, organizationId: string): Promise<GenerateRandomSelectionsDto>;
    generateAssessments(cycleId: string, organizationId: string): Promise<GenerateAssessmentsResultDto>;
}
