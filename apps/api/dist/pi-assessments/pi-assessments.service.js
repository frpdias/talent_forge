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
exports.PiAssessmentsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const dto_1 = require("./dto");
let PiAssessmentsService = class PiAssessmentsService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async create(dto, userId) {
        if (dto.candidateUserId !== userId) {
            throw new common_1.BadRequestException('candidateUserId deve ser o usuário autenticado');
        }
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('pi_assessments')
            .insert({
            candidate_user_id: dto.candidateUserId,
            status: 'in_progress',
        })
            .select('*')
            .single();
        if (error) {
            throw error;
        }
        return data;
    }
    async listDescriptors(accessToken) {
        const supabase = this.supabaseService.getClientWithAuth(accessToken);
        const { data, error } = await supabase
            .from('pi_descriptors')
            .select('*')
            .eq('active', true)
            .order('position', { ascending: true });
        if (error) {
            throw error;
        }
        return data;
    }
    async listSituationalQuestions(accessToken) {
        const supabase = this.supabaseService.getClientWithAuth(accessToken);
        const { data, error } = await supabase
            .from('pi_situational_questions')
            .select('*')
            .eq('active', true)
            .order('question_number', { ascending: true });
        if (error) {
            throw error;
        }
        return data;
    }
    async assertOwnership(supabase, assessmentId, userId) {
        const { data: assess, error: assessError } = await supabase
            .from('pi_assessments')
            .select('id, candidate_user_id, status')
            .eq('id', assessmentId)
            .single();
        if (assessError || !assess) {
            throw new common_1.NotFoundException('Assessment não encontrado');
        }
        if (assess.candidate_user_id !== userId) {
            throw new common_1.BadRequestException('Assessment não pertence ao usuário');
        }
        return assess;
    }
    async submitDescriptor(assessmentId, dto, userId, accessToken) {
        const supabase = this.supabaseService.getClientWithAuth(accessToken);
        await this.assertOwnership(supabase, assessmentId, userId);
        if (dto.selected === false) {
            const { error: delError } = await supabase
                .from('pi_descriptor_responses')
                .delete()
                .eq('assessment_id', assessmentId)
                .eq('descriptor_id', dto.descriptorId)
                .eq('block', dto.block);
            if (delError)
                throw delError;
            return { removed: true };
        }
        const { data, error } = await supabase
            .from('pi_descriptor_responses')
            .upsert({
            assessment_id: assessmentId,
            descriptor_id: dto.descriptorId,
            block: dto.block,
        }, { onConflict: 'assessment_id,descriptor_id,block' })
            .select()
            .single();
        if (error) {
            throw error;
        }
        return data;
    }
    async submitSituational(assessmentId, dto, userId, accessToken) {
        const supabase = this.supabaseService.getClientWithAuth(accessToken);
        await this.assertOwnership(supabase, assessmentId, userId);
        const { data, error } = await supabase
            .from('pi_situational_responses')
            .upsert({
            assessment_id: assessmentId,
            question_id: dto.questionId,
            block: dto.block,
            selected_axis: dto.selectedAxis,
        }, { onConflict: 'assessment_id,question_id,block' })
            .select()
            .single();
        if (error) {
            throw error;
        }
        return data;
    }
    baseScores() {
        return {
            [dto_1.PiAxis.DIRECAO]: 0,
            [dto_1.PiAxis.ENERGIA_SOCIAL]: 0,
            [dto_1.PiAxis.RITMO]: 0,
            [dto_1.PiAxis.ESTRUTURA]: 0,
        };
    }
    async finalize(assessmentId, userId, accessToken) {
        const supabase = this.supabaseService.getClientWithAuth(accessToken);
        await this.assertOwnership(supabase, assessmentId, userId);
        const { data: descriptorResponses, error: descError } = await supabase
            .from('pi_descriptor_responses')
            .select('block, descriptor_id, pi_descriptors(axis)')
            .eq('assessment_id', assessmentId);
        if (descError)
            throw descError;
        const { data: situationalResponses, error: sitError } = await supabase
            .from('pi_situational_responses')
            .select('block, selected_axis')
            .eq('assessment_id', assessmentId);
        if (sitError)
            throw sitError;
        const scoresNatural = this.baseScores();
        const scoresAdapted = this.baseScores();
        descriptorResponses?.forEach((resp) => {
            const axis = resp?.pi_descriptors?.axis;
            if (!axis)
                return;
            if (resp.block === dto_1.PiBlock.NATURAL) {
                scoresNatural[axis] += 1;
            }
            else if (resp.block === dto_1.PiBlock.ADAPTADO) {
                scoresAdapted[axis] += 1;
            }
        });
        situationalResponses?.forEach((resp) => {
            const axis = resp?.selected_axis;
            if (!axis)
                return;
            if (resp.block === dto_1.PiBlock.NATURAL) {
                scoresNatural[axis] += 1;
            }
            else if (resp.block === dto_1.PiBlock.ADAPTADO) {
                scoresAdapted[axis] += 1;
            }
        });
        const gaps = {};
        Object.keys(scoresNatural).forEach((axis) => {
            gaps[axis] = Math.abs(scoresNatural[axis] - scoresAdapted[axis]);
        });
        const { error: updateError } = await supabase
            .from('pi_assessments')
            .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            scores_natural: scoresNatural,
            scores_adapted: scoresAdapted,
            gaps,
        })
            .eq('id', assessmentId);
        if (updateError)
            throw updateError;
        return { scores_natural: scoresNatural, scores_adapted: scoresAdapted, gaps };
    }
    async latestByUser(userId, accessToken) {
        const supabase = this.supabaseService.getClientWithAuth(accessToken);
        const { data, error } = await supabase
            .from('pi_assessments')
            .select('*')
            .eq('candidate_user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        return data;
    }
};
exports.PiAssessmentsService = PiAssessmentsService;
exports.PiAssessmentsService = PiAssessmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], PiAssessmentsService);
//# sourceMappingURL=pi-assessments.service.js.map