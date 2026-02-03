"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerSelectionService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
let PeerSelectionService = class PeerSelectionService {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async getPeerSelectionQuota(cycleId, employeeId, organizationId) {
        const client = this.supabase.getClient();
        const { data, error } = await client.rpc('tfci_get_peer_selection_quota', {
            p_cycle_id: cycleId,
            p_employee_id: employeeId,
            p_organization_id: organizationId,
        });
        if (error) {
            throw new common_1.BadRequestException(`Erro ao calcular quota: ${error.message}`);
        }
        const result = data?.[0] || data;
        return {
            peerCount: result?.peer_count || 0,
            quota: result?.quota || 0,
            manualCount: result?.manual_count || 0,
            remaining: result?.remaining || 0,
        };
    }
    async getEligiblePeers(cycleId, employeeId, organizationId) {
        const client = this.supabase.getClient();
        const { data, error } = await client.rpc('tfci_get_eligible_peers', {
            p_cycle_id: cycleId,
            p_employee_id: employeeId,
            p_organization_id: organizationId,
        });
        if (error) {
            throw new common_1.BadRequestException(`Erro ao buscar pares elegíveis: ${error.message}`);
        }
        return (data || []).map((peer) => ({
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
    async registerPeerSelection(cycleId, selectorId, selectedPeerId) {
        const client = this.supabase.getClient();
        const { data, error } = await client.rpc('tfci_register_peer_selection', {
            p_cycle_id: cycleId,
            p_selector_id: selectorId,
            p_selected_id: selectedPeerId,
        });
        if (error) {
            throw new common_1.BadRequestException(`Erro ao registrar escolha: ${error.message}`);
        }
        const result = data?.[0] || data;
        return {
            success: result?.success || false,
            message: result?.message || 'Resultado desconhecido',
        };
    }
    async generateRandomSelections(cycleId, organizationId) {
        const client = this.supabase.getClient();
        const { data, error } = await client.rpc('tfci_generate_random_selections', {
            p_cycle_id: cycleId,
            p_organization_id: organizationId,
        });
        if (error) {
            throw new common_1.BadRequestException(`Erro ao gerar sorteios: ${error.message}`);
        }
        const result = data?.[0] || data;
        return {
            totalGenerated: result?.total_generated || 0,
            message: result?.message || 'Concluído',
        };
    }
    async generateCycleAssessments(cycleId, organizationId) {
        const client = this.supabase.getClient();
        const { data, error } = await client.rpc('tfci_generate_cycle_assessments', {
            p_cycle_id: cycleId,
            p_organization_id: organizationId,
        });
        if (error) {
            throw new common_1.BadRequestException(`Erro ao gerar avaliações: ${error.message}`);
        }
        const result = data?.[0] || data;
        return {
            hierarchicalAssessments: result?.hierarchical_assessments || 0,
            peerAssessments: result?.peer_assessments || 0,
            totalAssessments: result?.total_assessments || 0,
            message: result?.message || 'Concluído',
        };
    }
};
exports.PeerSelectionService = PeerSelectionService;
exports.PeerSelectionService = PeerSelectionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], PeerSelectionService);
//# sourceMappingURL=peer-selection.service.js.map