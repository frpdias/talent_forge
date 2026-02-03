export interface PhpActivation {
  id: string;
  org_id: string;
  is_active: boolean;
  activated_at: string | null;
  deactivated_at: string | null;
  activated_by: string | null;
  activation_plan: 'tfci_only' | 'nr1_only' | 'copc_only' | 'full';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PhpActivationStatus {
  is_active: boolean;
  activation_plan: string;
  activated_at: string | null;
}
