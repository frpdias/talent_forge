"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TfciService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
let TfciService = class TfciService {
    constructor() {
        this.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
    async createCycle(orgId, userId, dto) {
        const { data, error } = await this.supabase
            .from('tfci_cycles')
            .insert({
            org_id: orgId,
            name: dto.name,
            start_date: dto.start_date,
            end_date: dto.end_date,
            status: dto.status || 'draft',
            created_by: userId,
        })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create cycle: ${error.message}`);
        }
        return data;
    }
    async getCycles(orgId) {
        const { data, error } = await this.supabase
            .from('tfci_cycles')
            .select('*')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false });
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch cycles: ${error.message}`);
        }
        return data || [];
    }
    async getCycleById(orgId, cycleId) {
        const { data, error } = await this.supabase
            .from('tfci_cycles')
            .select('*')
            .eq('id', cycleId)
            .eq('org_id', orgId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Cycle not found');
        }
        return data;
    }
    async updateCycle(orgId, cycleId, dto) {
        const { data, error } = await this.supabase
            .from('tfci_cycles')
            .update(dto)
            .eq('id', cycleId)
            .eq('org_id', orgId)
            .select()
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException(`Cycle not found: ${error?.message}`);
        }
        return data;
    }
    async deleteCycle(orgId, cycleId) {
        const { error } = await this.supabase
            .from('tfci_cycles')
            .delete()
            .eq('id', cycleId)
            .eq('org_id', orgId);
        if (error) {
            throw new common_1.BadRequestException(`Failed to delete cycle: ${error.message}`);
        }
    }
    async createAssessment(orgId, userId, dto) {
        const cycle = await this.getCycleById(orgId, dto.cycle_id);
        if (cycle.status !== 'active') {
            throw new common_1.BadRequestException('Cycle is not active');
        }
        const { data: existing } = await this.supabase
            .from('tfci_assessments')
            .select('id')
            .eq('cycle_id', dto.cycle_id)
            .eq('evaluator_id', userId)
            .eq('target_user_id', dto.target_user_id)
            .single();
        if (existing) {
            throw new common_1.BadRequestException('Assessment already submitted for this user in this cycle');
        }
        const { data, error } = await this.supabase
            .from('tfci_assessments')
            .insert({
            org_id: orgId,
            cycle_id: dto.cycle_id,
            target_user_id: dto.target_user_id,
            team_id: dto.team_id || null,
            evaluator_id: dto.is_anonymous === false ? userId : null,
            collaboration_score: dto.collaboration_score,
            communication_score: dto.communication_score,
            adaptability_score: dto.adaptability_score,
            accountability_score: dto.accountability_score,
            leadership_score: dto.leadership_score,
            comments: dto.comments || null,
            is_anonymous: dto.is_anonymous !== false,
        })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create assessment: ${error.message}`);
        }
        await this.updateCycleStats(dto.cycle_id);
        return data;
    }
    async getAssessmentsByCycle(orgId, cycleId) {
        const { data, error } = await this.supabase
            .from('tfci_assessments')
            .select('*')
            .eq('org_id', orgId)
            .eq('cycle_id', cycleId)
            .order('submitted_at', { ascending: false });
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch assessments: ${error.message}`);
        }
        return data || [];
    }
    async getHeatmapData(orgId, cycleId) {
        const { data, error } = await this.supabase.rpc('get_tfci_heatmap', {
            p_org_id: orgId,
            p_cycle_id: cycleId,
        });
        if (error) {
            const { data: assessments } = await this.supabase
                .from('tfci_assessments')
                .select(`
          target_user_id,
          collaboration_score,
          communication_score,
          adaptability_score,
          accountability_score,
          leadership_score,
          overall_score
        `)
                .eq('org_id', orgId)
                .eq('cycle_id', cycleId);
            if (!assessments)
                return [];
            const grouped = assessments.reduce((acc, item) => {
                if (!acc[item.target_user_id]) {
                    acc[item.target_user_id] = {
                        user_id: item.target_user_id,
                        user_name: 'Unknown User',
                        team_name: null,
                        collaboration: 0,
                        communication: 0,
                        adaptability: 0,
                        accountability: 0,
                        leadership: 0,
                        overall: 0,
                        assessment_count: 0,
                    };
                }
                const entry = acc[item.target_user_id];
                entry.collaboration += item.collaboration_score;
                entry.communication += item.communication_score;
                entry.adaptability += item.adaptability_score;
                entry.accountability += item.accountability_score;
                entry.leadership += item.leadership_score;
                entry.overall += item.overall_score;
                entry.assessment_count += 1;
                return acc;
            }, {});
            return Object.values(grouped).map(entry => ({
                ...entry,
                collaboration: Number((entry.collaboration / entry.assessment_count).toFixed(2)),
                communication: Number((entry.communication / entry.assessment_count).toFixed(2)),
                adaptability: Number((entry.adaptability / entry.assessment_count).toFixed(2)),
                accountability: Number((entry.accountability / entry.assessment_count).toFixed(2)),
                leadership: Number((entry.leadership / entry.assessment_count).toFixed(2)),
                overall: Number((entry.overall / entry.assessment_count).toFixed(2)),
            }));
        }
        return data || [];
    }
    async updateCycleStats(cycleId) {
        const { count } = await this.supabase
            .from('tfci_assessments')
            .select('target_user_id', { count: 'exact', head: true })
            .eq('cycle_id', cycleId);
        const { data: assessmentCounts } = await this.supabase
            .from('tfci_assessments')
            .select('target_user_id')
            .eq('cycle_id', cycleId);
        const targetCounts = assessmentCounts?.reduce((acc, item) => {
            acc[item.target_user_id] = (acc[item.target_user_id] || 0) + 1;
            return acc;
        }, {});
        const completed = Object.values(targetCounts || {}).filter(count => count >= 3).length;
        const total = Object.keys(targetCounts || {}).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        await this.supabase
            .from('tfci_cycles')
            .update({
            participants_count: count || 0,
            completion_rate: completionRate,
        })
            .eq('id', cycleId);
    }
};
exports.TfciService = TfciService;
exports.TfciService = TfciService = __decorate([
    (0, common_1.Injectable)()
], TfciService);
//# sourceMappingURL=tfci.service.js.map