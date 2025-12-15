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
exports.CandidatesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let CandidatesService = class CandidatesService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async create(dto, orgId, userId) {
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
    async findAll(orgId, query) {
        const supabase = this.supabaseService.getAdminClient();
        let queryBuilder = supabase
            .from('candidates')
            .select(`
        *,
        assessments (id, normalized_score, assessment_kind)
      `)
            .eq('owner_org_id', orgId)
            .order('created_at', { ascending: false });
        if (query.search) {
            queryBuilder = queryBuilder.or(`full_name.ilike.%${query.search}%,email.ilike.%${query.search}%`);
        }
        if (query.tag) {
            queryBuilder = queryBuilder.contains('tags', [query.tag]);
        }
        const { data, error } = await queryBuilder;
        if (error) {
            throw error;
        }
        return data.map((candidate) => ({
            ...this.mapToResponse(candidate),
            latestAssessment: candidate.assessments?.[0] || null,
        }));
    }
    async findOne(id, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('candidates')
            .select(`
        *,
        candidate_notes (id, note, author_id, created_at),
        assessments (id, normalized_score, raw_score, traits, assessment_kind, created_at)
      `)
            .eq('id', id)
            .eq('owner_org_id', orgId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        return {
            ...this.mapToResponse(data),
            notes: data.candidate_notes || [],
            assessments: data.assessments || [],
        };
    }
    async update(id, dto, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        const updateData = {
            updated_at: new Date().toISOString(),
        };
        if (dto.fullName !== undefined)
            updateData.full_name = dto.fullName;
        if (dto.email !== undefined)
            updateData.email = dto.email;
        if (dto.phone !== undefined)
            updateData.phone = dto.phone;
        if (dto.location !== undefined)
            updateData.location = dto.location;
        if (dto.currentTitle !== undefined)
            updateData.current_title = dto.currentTitle;
        if (dto.linkedinUrl !== undefined)
            updateData.linkedin_url = dto.linkedinUrl;
        if (dto.salaryExpectation !== undefined)
            updateData.salary_expectation = dto.salaryExpectation;
        if (dto.availabilityDate !== undefined)
            updateData.availability_date = dto.availabilityDate;
        if (dto.tags !== undefined)
            updateData.tags = dto.tags;
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
            throw new common_1.NotFoundException('Candidate not found');
        }
        return this.mapToResponse(data);
    }
    async delete(id, orgId) {
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
    async createNote(candidateId, dto, orgId, userId) {
        const supabase = this.supabaseService.getAdminClient();
        await this.findOne(candidateId, orgId);
        const { data, error } = await supabase
            .from('candidate_notes')
            .insert({
            candidate_id: candidateId,
            author_id: userId,
            note: dto.note,
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
            createdAt: data.created_at,
        };
    }
    async getNotes(candidateId, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        await this.findOne(candidateId, orgId);
        const { data, error } = await supabase
            .from('candidate_notes')
            .select('*')
            .eq('candidate_id', candidateId)
            .order('created_at', { ascending: false });
        if (error) {
            throw error;
        }
        return data.map((note) => ({
            id: note.id,
            candidateId: note.candidate_id,
            authorId: note.author_id,
            note: note.note,
            createdAt: note.created_at,
        }));
    }
    mapToResponse(candidate) {
        return {
            id: candidate.id,
            ownerOrgId: candidate.owner_org_id,
            fullName: candidate.full_name,
            email: candidate.email,
            phone: candidate.phone,
            location: candidate.location,
            currentTitle: candidate.current_title,
            linkedinUrl: candidate.linkedin_url,
            salaryExpectation: candidate.salary_expectation,
            availabilityDate: candidate.availability_date,
            tags: candidate.tags,
            createdBy: candidate.created_by,
            createdAt: candidate.created_at,
            updatedAt: candidate.updated_at,
        };
    }
};
exports.CandidatesService = CandidatesService;
exports.CandidatesService = CandidatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], CandidatesService);
//# sourceMappingURL=candidates.service.js.map