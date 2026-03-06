import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  CreateCandidateNoteDto,
  UpdateCandidateNoteDto,
} from './dto';

@Injectable()
export class CandidatesService {
  constructor(private supabaseService: SupabaseService) {}

  async create(dto: CreateCandidateDto, orgId: string, userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('candidates')
      .insert({
        owner_org_id: orgId,
        full_name: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        location: dto.location,
        current_title: dto.currentTitle,
        linkedin_url: dto.linkedinUrl,
        source: dto.source,
        salary_expectation: dto.salaryExpectation,
        availability_date: dto.availabilityDate,
        tags: dto.tags || [],
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapToResponse(data);
  }

  async findAll(orgId: string, query: { search?: string; tag?: string }) {
    const supabase = this.supabaseService.getAdminClient();

    let queryBuilder = supabase
      .from('candidates')
      .select(
        `
        *,
        assessments (id, status, assessment_type)
      `,
      )
      .eq('owner_org_id', orgId)
      .order('created_at', { ascending: false });

    if (query.search) {
      queryBuilder = queryBuilder.or(
        `full_name.ilike.%${query.search}%,email.ilike.%${query.search}%`,
      );
    }

    if (query.tag) {
      queryBuilder = queryBuilder.contains('tags', [query.tag]);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw error;
    }

    return data.map((candidate: any) => ({
      ...this.mapToResponse(candidate),
      latestAssessment: candidate.assessments?.[0] || null,
    }));
  }

  async findOne(id: string, orgId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('candidates')
      .select(
        `
        *,
        candidate_notes (id, note, author_id, created_at),
        assessments (id, normalized_score, raw_score, traits, assessment_kind, created_at)
      `,
      )
      .eq('id', id)
      .eq('owner_org_id', orgId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Candidate not found');
    }

    return {
      ...this.mapToResponse(data),
      notes: data.candidate_notes || [],
      assessments: data.assessments || [],
    };
  }

  async update(id: string, dto: UpdateCandidateDto, orgId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.fullName !== undefined) updateData.full_name = dto.fullName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.currentTitle !== undefined)
      updateData.current_title = dto.currentTitle;
    if (dto.linkedinUrl !== undefined)
      updateData.linkedin_url = dto.linkedinUrl;
    if (dto.source !== undefined) updateData.source = dto.source;
    if (dto.salaryExpectation !== undefined)
      updateData.salary_expectation = dto.salaryExpectation;
    if (dto.availabilityDate !== undefined)
      updateData.availability_date = dto.availabilityDate;
    if (dto.tags !== undefined) updateData.tags = dto.tags;

    const { data, error } = await supabase
      .from('candidates')
      .update(updateData)
      .eq('id', id)
      .eq('owner_org_id', orgId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException('Candidate not found');
    }

    return this.mapToResponse(data);
  }

  async delete(id: string, orgId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id)
      .eq('owner_org_id', orgId);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  // Notes
  async createNote(
    candidateId: string,
    dto: CreateCandidateNoteDto,
    orgId: string,
    userId: string,
  ) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify candidate belongs to org
    await this.findOne(candidateId, orgId);

    const { data, error } = await supabase
      .from('candidate_notes')
      .insert({
        candidate_id: candidateId,
        author_id: userId,
        note: dto.note,
        context: dto.context || 'general',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      candidateId: data.candidate_id,
      authorId: data.author_id,
      note: data.note,
      context: data.context,
      createdAt: data.created_at,
    };
  }

  async getNotes(candidateId: string, orgId: string, context?: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify candidate belongs to org
    await this.findOne(candidateId, orgId);

    let query = supabase
      .from('candidate_notes')
      .select(
        `
        *,
        author:user_profiles!candidate_notes_author_id_fkey(full_name, email)
      `,
      )
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    // Filter by context if provided
    if (context) {
      query = query.eq('context', context);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data.map((note: any) => ({
      id: note.id,
      candidateId: note.candidate_id,
      authorId: note.author_id,
      authorName: note.author?.full_name || 'Unknown',
      authorEmail: note.author?.email,
      note: note.note,
      context: note.context || 'general',
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }));
  }

  async updateNote(
    candidateId: string,
    noteId: string,
    dto: UpdateCandidateNoteDto,
    orgId: string,
    userId: string,
  ) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify candidate belongs to org
    await this.findOne(candidateId, orgId);

    // Verify note belongs to candidate and user is author
    const { data: existingNote, error: fetchError } = await supabase
      .from('candidate_notes')
      .select('*')
      .eq('id', noteId)
      .eq('candidate_id', candidateId)
      .single();

    if (fetchError || !existingNote) {
      throw new NotFoundException('Note not found');
    }

    // Only author can update their note
    if (existingNote.author_id !== userId) {
      throw new ForbiddenException('You can only update your own notes');
    }

    const updateData: any = {};
    if (dto.note !== undefined) updateData.note = dto.note;
    if (dto.context !== undefined) updateData.context = dto.context;

    const { data, error } = await supabase
      .from('candidate_notes')
      .update(updateData)
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      candidateId: data.candidate_id,
      authorId: data.author_id,
      note: data.note,
      context: data.context,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async deleteNote(
    candidateId: string,
    noteId: string,
    orgId: string,
    userId: string,
  ) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify candidate belongs to org
    await this.findOne(candidateId, orgId);

    // Verify note belongs to candidate and user is author
    const { data: existingNote, error: fetchError } = await supabase
      .from('candidate_notes')
      .select('author_id')
      .eq('id', noteId)
      .eq('candidate_id', candidateId)
      .single();

    if (fetchError || !existingNote) {
      throw new NotFoundException('Note not found');
    }

    // Only author can delete their note
    if (existingNote.author_id !== userId) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    const { error } = await supabase
      .from('candidate_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      throw error;
    }

    return { success: true, message: 'Note deleted successfully' };
  }

  private mapToResponse(candidate: any) {
    return {
      id: candidate.id,
      ownerOrgId: candidate.owner_org_id,
      fullName: candidate.full_name,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location,
      currentTitle: candidate.current_title,
      linkedinUrl: candidate.linkedin_url,
      source: candidate.source,
      salaryExpectation: candidate.salary_expectation,
      availabilityDate: candidate.availability_date,
      tags: candidate.tags,
      createdBy: candidate.created_by,
      createdAt: candidate.created_at,
      updatedAt: candidate.updated_at,
    };
  }
}
