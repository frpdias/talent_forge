import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateNr1AssessmentDto, UpdateNr1AssessmentDto } from './dto/nr1-assessment.dto';

@Injectable()
export class Nr1Service {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async createAssessment(dto: CreateNr1AssessmentDto, assessedBy: string) {
    const { data, error } = await this.supabase
      .from('nr1_risk_assessments')
      .insert({
        ...dto,
        assessed_by: assessedBy,
        assessment_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Gerar action plans automaticamente se overall_risk_level = 'high'
    if (data.overall_risk_level === 'high') {
      await this.generateActionPlans(dto.org_id, 3, assessedBy);
    }

    return data;
  }

  async listAssessments(filters: {
    org_id: string;
    team_id?: string;
    user_id?: string;
    limit?: number;
  }) {
    let query = this.supabase
      .from('nr1_risk_assessments')
      .select('*')
      .eq('org_id', filters.org_id)
      .order('assessment_date', { ascending: false });

    if (filters.team_id) {
      query = query.eq('team_id', filters.team_id);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  }

  async getAssessment(id: string) {
    const { data, error } = await this.supabase
      .from('nr1_risk_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('Assessment not found');
    return data;
  }

  async updateAssessment(id: string, dto: UpdateNr1AssessmentDto) {
    const { data, error } = await this.supabase
      .from('nr1_risk_assessments')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteAssessment(id: string) {
    const { error } = await this.supabase
      .from('nr1_risk_assessments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { message: 'Assessment deleted successfully' };
  }

  async getRiskMatrix(orgId: string, teamId?: string) {
    // Buscar dados da view v_nr1_heatmap
    let query = this.supabase
      .from('v_nr1_heatmap')
      .select('*')
      .eq('org_id', orgId);

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    // Calcular agregações
    const dimensions = [
      'workload_pace_avg',
      'goal_pressure_avg',
      'role_clarity_avg',
      'autonomy_control_avg',
      'leadership_support_avg',
      'peer_collaboration_avg',
      'recognition_justice_avg',
      'communication_change_avg',
      'conflict_harassment_avg',
      'recovery_boundaries_avg',
    ];

    const matrix = {
      org_id: orgId,
      team_id: teamId,
      dimensions: data.map((row) => ({
        team_id: row.team_id,
        team_name: row.team_name,
        scores: dimensions.map((dim) => row[dim] || 0),
        high_risk_count: row.high_risk_count,
        assessments_count: row.assessments_count,
      })),
      overall_risk: this.calculateOverallRisk(data),
    };

    return matrix;
  }

  async getComplianceReport(orgId: string) {
    const { data: assessments, error } = await this.supabase
      .from('nr1_risk_assessments')
      .select('*')
      .eq('org_id', orgId)
      .gte('assessment_date', this.getThreeMonthsAgo());

    if (error) throw new Error(error.message);

    const totalAssessments = assessments.length;
    const highRiskCount = assessments.filter(
      (a) => a.overall_risk_level === 'high',
    ).length;
    const mediumRiskCount = assessments.filter(
      (a) => a.overall_risk_level === 'medium',
    ).length;
    const lowRiskCount = assessments.filter(
      (a) => a.overall_risk_level === 'low',
    ).length;

    // Buscar dimensões críticas (média >= 2.5)
    const dimensionAverages = this.calculateDimensionAverages(assessments);
    const criticalDimensions = Object.entries(dimensionAverages)
      .filter(([_, avg]) => avg >= 2.5)
      .map(([dim, avg]) => ({ dimension: dim, average: avg }));

    return {
      org_id: orgId,
      report_date: new Date().toISOString().split('T')[0],
      period: '90 dias',
      summary: {
        total_assessments: totalAssessments,
        high_risk: highRiskCount,
        medium_risk: mediumRiskCount,
        low_risk: lowRiskCount,
        compliance_status:
          highRiskCount === 0 && mediumRiskCount < totalAssessments * 0.3
            ? 'compliant'
            : 'requires_action',
      },
      critical_dimensions: criticalDimensions,
      recommendations: this.generateRecommendations(criticalDimensions),
      legal_evidence: {
        nr1_version: 'v1.0',
        assessment_frequency: '90 dias',
        action_plans_generated: highRiskCount > 0,
      },
    };
  }

  async generateActionPlans(
    orgId: string,
    minRiskLevel: number,
    createdBy: string,
  ) {
    // Buscar assessments com risco >= minRiskLevel
    const { data: assessments, error } = await this.supabase
      .from('nr1_risk_assessments')
      .select('*')
      .eq('org_id', orgId)
      .gte('assessment_date', this.getThreeMonthsAgo());

    if (error) throw new Error(error.message);

    const actionPlans: any[] = [];

    for (const assessment of assessments) {
      const highRiskDimensions = this.getHighRiskDimensions(
        assessment,
        minRiskLevel,
      );

      if (highRiskDimensions.length > 0) {
        const { data: plan, error: planError } = await this.supabase
          .from('php_action_plans')
          .insert({
            org_id: orgId,
            team_id: assessment.team_id,
            user_id: assessment.user_id,
            triggered_by: 'nr1',
            risk_level: assessment.overall_risk_level,
            title: `Intervenção NR-1: Riscos Psicossociais Elevados`,
            description: `Assessment ${assessment.id} identificou ${highRiskDimensions.length} dimensões com risco elevado`,
            root_cause: highRiskDimensions
              .map((d) => `${d.name}: ${d.value}/3`)
              .join(', '),
            recommended_actions: this.getRecommendedActions(
              highRiskDimensions,
            ),
            created_by: createdBy,
            status: 'open',
            priority: assessment.overall_risk_level === 'high' ? 5 : 3,
          })
          .select()
          .single();

        if (!planError) {
          actionPlans.push(plan);
        }
      }
    }

    return {
      generated_count: actionPlans.length,
      action_plans: actionPlans,
    };
  }

  // Helpers
  private getThreeMonthsAgo(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  }

  private calculateOverallRisk(data: any[]): string {
    if (data.length === 0) return 'low';

    const avgHighRisk =
      data.reduce((sum, row) => sum + (row.high_risk_count || 0), 0) /
      data.length;

    if (avgHighRisk >= 2) return 'high';
    if (avgHighRisk >= 1) return 'medium';
    return 'low';
  }

  private calculateDimensionAverages(assessments: any[]): Record<
    string,
    number
  > {
    const dimensions = [
      'workload_pace_risk',
      'goal_pressure_risk',
      'role_clarity_risk',
      'autonomy_control_risk',
      'leadership_support_risk',
      'peer_collaboration_risk',
      'recognition_justice_risk',
      'communication_change_risk',
      'conflict_harassment_risk',
      'recovery_boundaries_risk',
    ];

    const averages: Record<string, number> = {};

    dimensions.forEach((dim) => {
      const sum = assessments.reduce((acc, a) => acc + (a[dim] || 0), 0);
      averages[dim] = assessments.length > 0 ? sum / assessments.length : 0;
    });

    return averages;
  }

  private getHighRiskDimensions(
    assessment: any,
    minRiskLevel: number,
  ): Array<{ name: string; value: number }> {
    const dimensions = [
      { key: 'workload_pace_risk', name: 'Carga de Trabalho & Ritmo' },
      { key: 'goal_pressure_risk', name: 'Pressão por Metas & Tempo' },
      {
        key: 'role_clarity_risk',
        name: 'Clareza de Papéis & Expectativas',
      },
      { key: 'autonomy_control_risk', name: 'Autonomia & Controle' },
      { key: 'leadership_support_risk', name: 'Suporte da Liderança' },
      {
        key: 'peer_collaboration_risk',
        name: 'Suporte entre Colegas / Colaboração',
      },
      {
        key: 'recognition_justice_risk',
        name: 'Reconhecimento & Justiça Percebida',
      },
      {
        key: 'communication_change_risk',
        name: 'Comunicação & Mudanças',
      },
      {
        key: 'conflict_harassment_risk',
        name: 'Conflitos / Assédio / Relações Difíceis',
      },
      {
        key: 'recovery_boundaries_risk',
        name: 'Recuperação & Limites',
      },
    ];

    return dimensions
      .filter((dim) => assessment[dim.key] >= minRiskLevel)
      .map((dim) => ({
        name: dim.name,
        value: assessment[dim.key],
      }));
  }

  private getRecommendedActions(
    dimensions: Array<{ name: string; value: number }>,
  ): any {
    const actions = dimensions.map((dim) => ({
      dimension: dim.name,
      risk_level: dim.value,
      actions: this.getActionsForDimension(dim.name),
    }));

    return actions;
  }

  private getActionsForDimension(dimension: string): string[] {
    const actionMap: Record<string, string[]> = {
      'Carga de Trabalho & Ritmo': [
        'Revisar distribuição de tarefas',
        'Implementar pausas regulares',
        'Avaliar prazos e carga horária',
      ],
      'Pressão por Metas & Tempo': [
        'Renegociar metas realistas',
        'Implementar gestão de tempo',
        'Priorizar tarefas críticas',
      ],
      'Clareza de Papéis & Expectativas': [
        'Revisar descrição de cargo',
        'Estabelecer expectativas claras',
        'Melhorar comunicação de objetivos',
      ],
      'Autonomia & Controle': [
        'Delegar mais responsabilidades',
        'Aumentar autonomia de decisão',
        'Reduzir microgerenciamento',
      ],
      'Suporte da Liderança': [
        'Treinamento de liderança',
        'Feedback regular',
        'Reconhecimento de conquistas',
      ],
      'Suporte entre Colegas / Colaboração': [
        'Team building',
        'Promover colaboração',
        'Melhorar comunicação entre pares',
      ],
      'Reconhecimento & Justiça Percebida': [
        'Implementar sistema de reconhecimento',
        'Revisar políticas de recompensa',
        'Garantir equidade salarial',
      ],
      'Comunicação & Mudanças': [
        'Melhorar comunicação interna',
        'Preparar equipe para mudanças',
        'Transparência nas decisões',
      ],
      'Conflitos / Assédio / Relações Difíceis': [
        'Investigar conflitos',
        'Mediação de conflitos',
        'Treinamento sobre assédio',
      ],
      'Recuperação & Limites': [
        'Promover work-life balance',
        'Respeitar horários de descanso',
        'Incentivar férias regulares',
      ],
    };

    return actionMap[dimension] || ['Avaliar situação específica'];
  }

  private generateRecommendations(
    criticalDimensions: Array<{ dimension: string; average: number }>,
  ): string[] {
    if (criticalDimensions.length === 0) {
      return [
        'Manter monitoramento regular (a cada 90 dias)',
        'Continuar promovendo ambiente de trabalho saudável',
      ];
    }

    const recommendations = [
      `Atenção prioritária para ${criticalDimensions.length} dimensões críticas`,
      'Implementar planos de ação imediatos',
      'Realizar reuniões com gestores e equipes afetadas',
      'Monitorar evolução mensalmente',
    ];

    if (criticalDimensions.length >= 5) {
      recommendations.push(
        'Considerar consultoria externa especializada em saúde ocupacional',
      );
    }

    return recommendations;
  }

  // ========================================
  // Self-Assessment Methods
  // ========================================

  async createSelfAssessment(dto: any, userId: string) {
    const { data, error } = await this.supabase
      .from('nr1_self_assessments')
      .insert({
        ...dto,
        responded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Se houver invitation_id, vincular avaliação ao convite
    if (dto.invitation_id) {
      await this.linkInvitationToSelfAssessment(dto.invitation_id, data.id);
    }

    return data;
  }

  async listSelfAssessments(filters: {
    org_id: string;
    employee_id?: string;
    limit?: number;
  }) {
    let query = this.supabase
      .from('nr1_self_assessments')
      .select(`
        *,
        employees:employee_id (
          full_name,
          position,
          department
        )
      `)
      .eq('org_id', filters.org_id)
      .order('responded_at', { ascending: false });

    if (filters.employee_id) {
      query = query.eq('employee_id', filters.employee_id);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  }

  async getSelfAssessment(id: string) {
    const { data, error } = await this.supabase
      .from('nr1_self_assessments')
      .select(`
        *,
        employees:employee_id (
          full_name,
          position,
          department
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('Self-assessment not found');
    return data;
  }

  async getComparativeAnalysis(orgId: string, employeeId?: string) {
    let query = this.supabase
      .from('v_nr1_comparative_analysis')
      .select('*')
      .eq('org_id', orgId);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    // Estatísticas agregadas
    const stats = {
      total_comparisons: data?.length || 0,
      critical_gaps: data?.filter(d => d.gap_severity === 'critical_gap').length || 0,
      significant_gaps: data?.filter(d => d.gap_severity === 'significant_gap').length || 0,
      aligned: data?.filter(d => d.gap_severity === 'aligned').length || 0,
      optimistic_bias_count: data?.filter(d => d.perception_bias === 'optimistic_bias').length || 0,
      pessimistic_bias_count: data?.filter(d => d.perception_bias === 'pessimistic_bias').length || 0,
      average_perception_gap: data?.length > 0 
        ? (data.reduce((sum, d) => sum + (d.perception_gap || 0), 0) / data.length).toFixed(2)
        : 0,
    };

    return {
      comparisons: data,
      statistics: stats,
      insights: this.generateComparativeInsights(stats),
    };
  }

  private generateComparativeInsights(stats: any): string[] {
    const insights: string[] = [];

    if (stats.critical_gaps > 0) {
      insights.push(
        `⚠️ ${stats.critical_gaps} funcionário(s) com percepção MUITO diferente da avaliação organizacional - requer atenção urgente`,
      );
    }

    if (stats.optimistic_bias_count > stats.pessimistic_bias_count) {
      insights.push(
        `🔍 Funcionários tendem a avaliar o ambiente MELHOR do que a organização - pode indicar falta de conscientização sobre riscos reais`,
      );
    } else if (stats.pessimistic_bias_count > stats.optimistic_bias_count) {
      insights.push(
        `🔍 Funcionários tendem a avaliar o ambiente PIOR do que a organização - pode indicar blind spots da gestão`,
      );
    }

    if (stats.aligned > stats.total_comparisons * 0.7) {
      insights.push(
        `✅ Boa alinhamento entre percepção dos funcionários e avaliação organizacional (${Math.round((stats.aligned / stats.total_comparisons) * 100)}%)`,
      );
    }

    if (Math.abs(parseFloat(stats.average_perception_gap)) > 1.0) {
      insights.push(
        `📊 Gap médio de percepção significativo (${stats.average_perception_gap}) - revisar comunicação e transparência`,
      );
    }

    return insights.length > 0 ? insights : ['Dados insuficientes para gerar insights'];
  }

  // ========================================
  // Invitation Methods
  // ========================================

  async createInvitations(
    data: {
      org_id: string;
      employee_ids: string[];
      organizational_assessment_id?: string;
    },
    invitedBy: string,
  ) {
    const invitations: any[] = [];

    for (const employee_id of data.employee_ids) {
      const { data: invitation, error } = await this.supabase
        .from('nr1_assessment_invitations')
        .insert({
          org_id: data.org_id,
          employee_id,
          organizational_assessment_id: data.organizational_assessment_id,
          invited_by: invitedBy,
        })
        .select('*, employees(full_name, position, department)')
        .single();

      if (error) {
        // Se já existe convite ativo, retornar erro específico
        if (error.code === '23505') {
          throw new Error(
            `Funcionário já possui convite ativo. Cancele ou aguarde expiração.`,
          );
        }
        throw new Error(`Erro ao criar convite: ${error.message}`);
      }

      invitations.push(invitation);
    }

    return {
      success: true,
      invitations,
      message: `${invitations.length} convite(s) criado(s) com sucesso`,
    };
  }

  async listInvitations(orgId: string, status?: string) {
    let query = this.supabase
      .from('v_nr1_invitations_summary')
      .select('*')
      .eq('org_id', orgId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('invited_at', {
      ascending: false,
    });

    if (error) {
      throw new Error(`Erro ao buscar convites: ${error.message}`);
    }

    return { invitations: data || [] };
  }

  async getInvitation(id: string) {
    const { data, error } = await this.supabase
      .from('v_nr1_invitations_summary')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar convite: ${error.message}`);
    }

    return data;
  }

  async getInvitationByToken(token: string) {
    // Buscar convite pelo token
    const { data: invitation, error } = await this.supabase
      .from('nr1_assessment_invitations')
      .select('*, employees(full_name, email, position, department)')
      .eq('token', token)
      .single();

    if (error || !invitation) {
      throw new Error('Token inválido ou convite não encontrado');
    }

    // Verificar se expirou
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (now > expiresAt) {
      // Atualizar status para expired
      await this.supabase
        .from('nr1_assessment_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      throw new Error('Este convite expirou');
    }

    // Se status é pending, atualizar para accepted (primeiro acesso)
    if (invitation.status === 'pending') {
      await this.supabase
        .from('nr1_assessment_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      invitation.status = 'accepted';
    }

    // Verificar se já foi respondido
    if (invitation.status === 'completed') {
      throw new Error('Esta avaliação já foi respondida');
    }

    return {
      valid: true,
      invitation: {
        id: invitation.id,
        org_id: invitation.org_id,
        employee_id: invitation.employee_id,
        employee: invitation.employees,
        organizational_assessment_id: invitation.organizational_assessment_id,
        expires_at: invitation.expires_at,
        status: invitation.status,
      },
    };
  }

  async resendInvitation(id: string) {
    // Regenerar token e estender validade
    const newToken = Buffer.from(
      Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)),
    ).toString('base64');

    const { data, error } = await this.supabase
      .from('nr1_assessment_invitations')
      .update({
        token: newToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 dias
        status: 'pending',
        invited_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, employees(full_name, position)')
      .single();

    if (error) {
      throw new Error(`Erro ao reenviar convite: ${error.message}`);
    }

    return {
      success: true,
      invitation: data,
      message: 'Convite reenviado com novo token e prazo estendido',
    };
  }

  async cancelInvitation(id: string) {
    const { error } = await this.supabase
      .from('nr1_assessment_invitations')
      .update({ status: 'expired' })
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao cancelar convite: ${error.message}`);
    }

    return { success: true, message: 'Convite cancelado com sucesso' };
  }

  async linkInvitationToSelfAssessment(
    invitationId: string,
    selfAssessmentId: string,
  ) {
    const { error } = await this.supabase
      .from('nr1_assessment_invitations')
      .update({
        status: 'completed',
        responded_at: new Date().toISOString(),
        self_assessment_id: selfAssessmentId,
      })
      .eq('id', invitationId);

    if (error) {
      throw new Error(
        `Erro ao vincular convite à avaliação: ${error.message}`,
      );
    }
  }
}
