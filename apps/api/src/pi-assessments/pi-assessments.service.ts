import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
    CreatePiAssessmentDto,
    SubmitPiDescriptorDto,
    SubmitPiSituationalDto,
    PiAxis,
    PiBlock,
} from './dto';

type AxisScores = Record<PiAxis, number>;

@Injectable()
export class PiAssessmentsService {
  constructor(private supabaseService: SupabaseService) {}

  async create(dto: CreatePiAssessmentDto, userId: string) {
    if (dto.candidateUserId !== userId) {
      throw new BadRequestException(
        'candidateUserId deve ser o usuário autenticado',
      );
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

  async listDescriptors(accessToken: string) {
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

  async listSituationalQuestions(accessToken: string) {
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

  private async assertOwnership(
    supabase: any,
    assessmentId: string,
    userId: string,
  ) {
    const { data: assess, error: assessError } = await supabase
      .from('pi_assessments')
      .select('id, candidate_user_id, status')
      .eq('id', assessmentId)
      .single();

    if (assessError || !assess) {
      throw new NotFoundException('Assessment não encontrado');
    }
    if (assess.candidate_user_id !== userId) {
      throw new BadRequestException('Assessment não pertence ao usuário');
    }
    return assess;
  }

  async submitDescriptor(
    assessmentId: string,
    dto: SubmitPiDescriptorDto,
    userId: string,
    accessToken: string,
  ) {
    const supabase = this.supabaseService.getClientWithAuth(accessToken);
    await this.assertOwnership(supabase, assessmentId, userId);

    if (dto.selected === false) {
      const { error: delError } = await supabase
        .from('pi_descriptor_responses')
        .delete()
        .eq('assessment_id', assessmentId)
        .eq('descriptor_id', dto.descriptorId)
        .eq('block', dto.block);

      if (delError) throw delError;
      return { removed: true };
    }

    const { data, error } = await supabase
      .from('pi_descriptor_responses')
      .upsert(
        {
          assessment_id: assessmentId,
          descriptor_id: dto.descriptorId,
          block: dto.block,
        },
        { onConflict: 'assessment_id,descriptor_id,block' },
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async submitSituational(
    assessmentId: string,
    dto: SubmitPiSituationalDto,
    userId: string,
    accessToken: string,
  ) {
    const supabase = this.supabaseService.getClientWithAuth(accessToken);
    await this.assertOwnership(supabase, assessmentId, userId);

    const { data, error } = await supabase
      .from('pi_situational_responses')
      .upsert(
        {
          assessment_id: assessmentId,
          question_id: dto.questionId,
          block: dto.block,
          selected_axis: dto.selectedAxis,
        },
        { onConflict: 'assessment_id,question_id,block' },
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  private baseScores(): AxisScores {
    return {
      [PiAxis.DIRECAO]: 0,
      [PiAxis.ENERGIA_SOCIAL]: 0,
      [PiAxis.RITMO]: 0,
      [PiAxis.ESTRUTURA]: 0,
    };
  }

  async finalize(assessmentId: string, userId: string, accessToken: string) {
    const supabase = this.supabaseService.getClientWithAuth(accessToken);
    await this.assertOwnership(supabase, assessmentId, userId);

    const { data: descriptorResponses, error: descError } = await supabase
      .from('pi_descriptor_responses')
      .select('block, descriptor_id, pi_descriptors(axis)')
      .eq('assessment_id', assessmentId);

    if (descError) throw descError;

    const { data: situationalResponses, error: sitError } = await supabase
      .from('pi_situational_responses')
      .select('block, selected_axis')
      .eq('assessment_id', assessmentId);

    if (sitError) throw sitError;

    const scoresNatural = this.baseScores();
    const scoresAdapted = this.baseScores();

    descriptorResponses?.forEach((resp: any) => {
      const axis = resp?.pi_descriptors?.axis as PiAxis;
      if (!axis) return;
      if (resp.block === PiBlock.NATURAL) {
        scoresNatural[axis] += 1;
      } else if (resp.block === PiBlock.ADAPTADO) {
        scoresAdapted[axis] += 1;
      }
    });

    situationalResponses?.forEach((resp: any) => {
      const axis = resp?.selected_axis as PiAxis;
      if (!axis) return;
      if (resp.block === PiBlock.NATURAL) {
        scoresNatural[axis] += 1;
      } else if (resp.block === PiBlock.ADAPTADO) {
        scoresAdapted[axis] += 1;
      }
    });

    const gaps: Record<string, number> = {};
    (Object.keys(scoresNatural) as PiAxis[]).forEach((axis) => {
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

    if (updateError) throw updateError;

    return { scores_natural: scoresNatural, scores_adapted: scoresAdapted, gaps };
  }

  async latestByUser(userId: string, accessToken: string) {
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
}
