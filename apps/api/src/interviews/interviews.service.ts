import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../email/email.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly emailService: EmailService,
  ) {}

  async create(orgId: string, userId: string, dto: CreateInterviewDto) {
    const supabase = this.supabaseService.getAdminClient();

    const { data: interview, error } = await supabase
      .from('interviews')
      .insert({
        org_id: orgId,
        candidate_id: dto.candidateId,
        application_id: dto.applicationId,
        job_id: dto.jobId,
        title: dto.title,
        scheduled_at: dto.scheduledAt,
        duration_minutes: dto.durationMinutes,
        type: dto.type,
        location: dto.location ?? null,
        notes: dto.notes ?? null,
        meet_link: dto.meetLink ?? null,
        status: 'scheduled',
        created_by: userId,
      })
      .select('*, candidates(full_name, email), jobs(title), organizations(name)')
      .single();

    if (error) throw error;

    // Envia e-mail de confirmação ao candidato via Brevo
    const candidateEmail = dto.candidateEmail || interview.candidates?.email;
    const candidateName = interview.candidates?.full_name ?? 'Candidato';
    const jobTitle = interview.jobs?.title ?? dto.title;
    const orgName = interview.organizations?.name ?? 'Empresa';

    if (candidateEmail) {
      // Busca nome do recrutador
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      await this.emailService.sendInterviewScheduled(candidateEmail, {
        candidateName,
        jobTitle,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: dto.durationMinutes,
        type: dto.type,
        location: dto.location,
        meetLink: dto.meetLink,
        organizerName: profile?.full_name ?? 'Recrutador',
        orgName,
      });
    } else {
      this.logger.warn(`Entrevista ${interview.id} criada sem e-mail do candidato — confirmação não enviada`);
    }

    return interview;
  }

  async findAll(orgId: string, filters?: { candidateId?: string; jobId?: string; status?: string }) {
    const supabase = this.supabaseService.getAdminClient();

    let query = supabase
      .from('interviews')
      .select('*, candidates(full_name, email), jobs(title)')
      .eq('org_id', orgId)
      .order('scheduled_at', { ascending: true });

    if (filters?.candidateId) query = query.eq('candidate_id', filters.candidateId);
    if (filters?.jobId) query = query.eq('job_id', filters.jobId);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findOne(orgId: string, id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('interviews')
      .select('*, candidates(full_name, email), jobs(title), organizations(name)')
      .eq('org_id', orgId)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Entrevista não encontrada');
    return data;
  }

  async update(orgId: string, id: string, dto: UpdateInterviewDto) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('interviews')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(orgId: string, id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { error } = await supabase
      .from('interviews')
      .delete()
      .eq('org_id', orgId)
      .eq('id', id);

    if (error) throw error;
    return { deleted: true };
  }
}
