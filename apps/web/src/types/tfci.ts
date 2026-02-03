// Types para TFCI Sistema de Avaliação 360°

export interface Employee {
  id: string;
  full_name: string;
  email: string;
  position: string;
  department: string;
  manager_id: string | null;
  organization_id: string;
  avatar_url?: string;
  hire_date?: string;
}

export interface HierarchyNode extends Employee {
  subordinates: HierarchyNode[];
  level: number;
}

export interface PeerSelectionQuota {
  peerCount: number;
  quota: number;
  manualCount: number;
  remaining: number;
}

export interface EligiblePeer {
  peerId: string;
  peerName: string;
  peerEmail: string;
  peerPosition: string;
  timesChosen: number;
  canBeChosen: boolean;
}

export interface PeerSelectionResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface GenerateRandomSelectionsResult {
  totalGenerated: number;
  message: string;
}

export interface GenerateAssessmentsResult {
  hierarchicalAssessments: number;
  peerAssessments: number;
  totalAssessments: number;
  message: string;
}

export interface TFCICycle {
  id: string;
  name: string;
  organization_id: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  description?: string;
  created_at: string;
  updated_at: string;
}
