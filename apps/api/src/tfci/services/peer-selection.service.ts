import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  PeerSelectionQuotaDto,
  EligiblePeerDto,
  PeerSelectionResultDto,
  GenerateRandomSelectionsDto,
  GenerateAssessmentsResultDto,
} from '../dto/peer-selection.dto';

@Injectable()
export class PeerSelectionService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Calcula a quota de pares que o funcionário deve escolher
   * Usa a função SQL: tfci_get_peer_selection_quota
   */
  async getPeerSelectionQuota(
    cycleId: string,
    employeeId: string,
    organizationId: string,
  ): Promise<PeerSelectionQuotaDto> {
    const client = this.supabase.getClient();

    const { data, error } = await client.rpc('tfci_get_peer_selection_quota', {
      p_cycle_id: cycleId,
      p_employee_id: employeeId,
      p_organization_id: organizationId,
    });

    if (error) {
      throw new BadRequestException(
        `Erro ao calcular quota: ${error.message}`,
      );
    }

    // A função retorna um único registro
    const result = data?.[0] || data;
    
    return {
      peerCount: result?.peer_count || 0,
      quota: result?.quota || 0,
      manualCount: result?.manual_count || 0,
      remaining: result?.remaining || 0,
    };
  }

  /**
   * Lista pares elegíveis para escolha
   * Usa a função SQL: tfci_get_eligible_peers
   */
  async getEligiblePeers(
    cycleId: string,
    employeeId: string,
    organizationId: string,
  ): Promise<EligiblePeerDto[]> {
    const client = this.supabase.getClient();

    const { data, error } = await client.rpc('tfci_get_eligible_peers', {
      p_cycle_id: cycleId,
      p_employee_id: employeeId,
      p_organization_id: organizationId,
    });

    if (error) {
      throw new BadRequestException(
        `Erro ao buscar pares elegíveis: ${error.message}`,
      );
    }

    // Mapear os campos retornados pela função SQL
    return (data || []).map((peer: any) => ({
      peerId: peer.id,
      peerName: peer.full_name,
      peerEmail: peer.email || null,
      peerPosition: peer.job_title,
      department: peer.department,
      hierarchyLevel: peer.hierarchy_level,
      timesChosen: peer.times_chosen,
      canBeChosen: peer.can_be_chosen,
    }));
  }

  /**
   * Registra escolha manual de um par
   * Usa a função SQL: tfci_register_peer_selection
   */
  async registerPeerSelection(
    cycleId: string,
    selectorId: string,
    selectedPeerId: string,
  ): Promise<PeerSelectionResultDto> {
    const client = this.supabase.getClient();

    const { data, error } = await client.rpc('tfci_register_peer_selection', {
      p_cycle_id: cycleId,
      p_selector_id: selectorId,
      p_selected_id: selectedPeerId,
    });

    if (error) {
      throw new BadRequestException(
        `Erro ao registrar escolha: ${error.message}`,
      );
    }

    const result = data?.[0] || data;
    return {
      success: result?.success || false,
      message: result?.message || 'Resultado desconhecido',
    };
  }

  /**
   * Gera sorteios aleatórios para completar as escolhas
   * Usa a função SQL: tfci_generate_random_selections
   */
  async generateRandomSelections(
    cycleId: string,
    organizationId: string,
  ): Promise<GenerateRandomSelectionsDto> {
    const client = this.supabase.getClient();

    const { data, error } = await client.rpc(
      'tfci_generate_random_selections',
      {
        p_cycle_id: cycleId,
        p_organization_id: organizationId,
      },
    );

    if (error) {
      throw new BadRequestException(
        `Erro ao gerar sorteios: ${error.message}`,
      );
    }

    const result = data?.[0] || data;
    return {
      totalGenerated: result?.total_generated || 0,
      message: result?.message || 'Concluído',
    };
  }

  /**
   * Gera TODAS as avaliações do ciclo (hierárquicas + pares)
   * Usa a função SQL: tfci_generate_cycle_assessments
   */
  async generateCycleAssessments(
    cycleId: string,
    organizationId: string,
  ): Promise<GenerateAssessmentsResultDto> {
    const client = this.supabase.getClient();

    const { data, error } = await client.rpc('tfci_generate_cycle_assessments', {
      p_cycle_id: cycleId,
      p_organization_id: organizationId,
    });

    if (error) {
      throw new BadRequestException(
        `Erro ao gerar avaliações: ${error.message}`,
      );
    }

    const result = data?.[0] || data;
    return {
      hierarchicalAssessments: result?.hierarchical_assessments || 0,
      peerAssessments: result?.peer_assessments || 0,
      totalAssessments: result?.total_assessments || 0,
      message: result?.message || 'Concluído',
    };
  }
}
