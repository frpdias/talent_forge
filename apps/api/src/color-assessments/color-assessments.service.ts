import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateColorAssessmentDto,
  SubmitColorResponseDto,
  ColorChoice,
} from './dto';

type Scores = Record<ColorChoice, number>;

@Injectable()
export class ColorAssessmentsService {
  constructor(private supabaseService: SupabaseService) {}

  async create(dto: CreateColorAssessmentDto, userId: string) {
    if (dto.candidateUserId !== userId) {
      throw new BadRequestException(
        'candidateUserId deve ser o usuário autenticado',
      );
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

  async listQuestions(accessToken: string) {
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

  async submitResponse(
    assessmentId: string,
    dto: SubmitColorResponseDto,
    userId: string,
    accessToken: string,
  ) {
    const supabase = this.supabaseService.getClientWithAuth(accessToken);

    // Validate ownership
    const { data: assess, error: assessError } = await supabase
      .from('color_assessments')
      .select('id, candidate_user_id')
      .eq('id', assessmentId)
      .single();

    if (assessError || !assess) {
      throw new NotFoundException('Assessment não encontrado');
    }

    if (assess.candidate_user_id !== userId) {
      throw new BadRequestException('Assessment não pertence ao usuário');
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

  async finalize(assessmentId: string, userId: string, accessToken: string) {
    const supabase = this.supabaseService.getClientWithAuth(accessToken);

    // Validate ownership
    const { data: assess, error: assessError } = await supabase
      .from('color_assessments')
      .select('id, candidate_user_id, status')
      .eq('id', assessmentId)
      .single();

    if (assessError || !assess) {
      throw new NotFoundException('Assessment não encontrado');
    }
    if (assess.candidate_user_id !== userId) {
      throw new BadRequestException('Assessment não pertence ao usuário');
    }

    const { data: responses, error: respError } = await supabase
      .from('color_responses')
      .select('selected_color')
      .eq('assessment_id', assessmentId);

    if (respError) {
      throw respError;
    }

    const scores: Scores = {
      [ColorChoice.AZUL]: 0,
      [ColorChoice.ROSA]: 0,
      [ColorChoice.AMARELO]: 0,
      [ColorChoice.VERDE]: 0,
      [ColorChoice.BRANCO]: 0,
    };

    responses?.forEach((r: any) => {
      if (scores[r.selected_color as ColorChoice] !== undefined) {
        scores[r.selected_color as ColorChoice] += 1;
      }
    });

    const order = (Object.keys(scores) as ColorChoice[]).sort(
      (a, b) => scores[b] - scores[a],
    );
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

  async latestByUser(userId: string, accessToken: string) {
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
}
