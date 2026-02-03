import { SupabaseService } from '../../supabase/supabase.service';
import { PeerSelectionQuotaDto, EligiblePeerDto, PeerSelectionResultDto, GenerateRandomSelectionsDto, GenerateAssessmentsResultDto } from '../dto/peer-selection.dto';
export declare class PeerSelectionService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    getPeerSelectionQuota(cycleId: string, employeeId: string, organizationId: string): Promise<PeerSelectionQuotaDto>;
    getEligiblePeers(cycleId: string, employeeId: string, organizationId: string): Promise<EligiblePeerDto[]>;
    registerPeerSelection(cycleId: string, selectorId: string, selectedPeerId: string): Promise<PeerSelectionResultDto>;
    generateRandomSelections(cycleId: string, organizationId: string): Promise<GenerateRandomSelectionsDto>;
    generateCycleAssessments(cycleId: string, organizationId: string): Promise<GenerateAssessmentsResultDto>;
}
