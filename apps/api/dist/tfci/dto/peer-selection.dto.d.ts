export declare class RegisterPeerSelectionDto {
    selectedPeerId: string;
}
export declare class PeerSelectionQuotaDto {
    peerCount: number;
    quota: number;
    manualCount: number;
    remaining: number;
}
export declare class EligiblePeerDto {
    peerId: string;
    peerName: string;
    peerEmail?: string | null;
    peerPosition: string;
    department?: string | null;
    hierarchyLevel?: number | null;
    timesChosen: number;
    canBeChosen: boolean;
}
export declare class PeerSelectionResultDto {
    success: boolean;
    message: string;
    error?: string;
}
export declare class GenerateRandomSelectionsDto {
    totalGenerated: number;
    message: string;
}
export declare class GenerateAssessmentsResultDto {
    hierarchicalAssessments: number;
    peerAssessments: number;
    totalAssessments: number;
    message: string;
}
