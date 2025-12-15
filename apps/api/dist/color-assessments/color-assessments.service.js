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
exports.ColorAssessmentsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const dto_1 = require("./dto");
let ColorAssessmentsService = class ColorAssessmentsService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async create(dto, userId) {
        if (dto.candidateUserId !== userId) {
            throw new common_1.BadRequestException('candidateUserId deve ser o usuário autenticado');
        }
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('color_assessments')
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
    async listQuestions(accessToken) {
        const supabase = this.supabaseService.getClientWithAuth(accessToken);
        const { data, error } = await supabase
            .from('color_questions')
            .select('*')
            .eq('active', true)
            .order('question_number', { ascending: true });
        if (error) {
            throw error;
        }
        return data;
    }
    async submitResponse(assessmentId, dto, userId, accessToken) {
        const supabase = this.supabaseService.getClientWithAuth(accessToken);
        const { data: assess, error: assessError } = await supabase
            .from('color_assessments')
            .select('id, candidate_user_id')
            .eq('id', assessmentId)
            .single();
        if (assessError || !assess) {
            throw new common_1.NotFoundException('Assessment não encontrado');
        }
        if (assess.candidate_user_id !== userId) {
            throw new common_1.BadRequestException('Assessment não pertence ao usuário');
        }
        const { data, error } = await supabase
            .from('color_responses')
            .upsert({
            assessment_id: assessmentId,
            question_id: dto.questionId,
            selected_color: dto.selectedColor,
        })
            .select()
            .single();
        if (error) {
            throw error;
        }
        return data;
    }
    async finalize(assessmentId, userId, accessToken) {
        const supabase = this.supabaseService.getClientWithAuth(accessToken);
        const { data: assess, error: assessError } = await supabase
            .from('color_assessments')
            .select('id, candidate_user_id, status')
            .eq('id', assessmentId)
            .single();
        if (assessError || !assess) {
            throw new common_1.NotFoundException('Assessment não encontrado');
        }
        if (assess.candidate_user_id !== userId) {
            throw new common_1.BadRequestException('Assessment não pertence ao usuário');
        }
        const { data: responses, error: respError } = await supabase
            .from('color_responses')
            .select('selected_color')
            .eq('assessment_id', assessmentId);
        if (respError) {
            throw respError;
        }
        const scores = {
            [dto_1.ColorChoice.AZUL]: 0,
            [dto_1.ColorChoice.ROSA]: 0,
            [dto_1.ColorChoice.AMARELO]: 0,
            [dto_1.ColorChoice.VERDE]: 0,
            [dto_1.ColorChoice.BRANCO]: 0,
        };
        responses?.forEach((r) => {
            if (scores[r.selected_color] !== undefined) {
                scores[r.selected_color] += 1;
            }
        });
        const order = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
        const primary = order[0];
        const secondary = order[1];
        const { error: updateError } = await supabase
            .from('color_assessments')
            .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            primary_color: primary,
            secondary_color: secondary,
            scores,
        })
            .eq('id', assessmentId);
        if (updateError) {
            throw updateError;
        }
        return { primary_color: primary, secondary_color: secondary, scores };
    }
    async latestByUser(userId, accessToken) {
        const supabase = this.supabaseService.getClientWithAuth(accessToken);
        const { data, error } = await supabase
            .from('color_assessments')
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
exports.ColorAssessmentsService = ColorAssessmentsService;
exports.ColorAssessmentsService = ColorAssessmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ColorAssessmentsService);
//# sourceMappingURL=color-assessments.service.js.map