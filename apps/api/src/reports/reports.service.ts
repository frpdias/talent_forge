import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReportsService {
  constructor(private supabaseService: SupabaseService) {}

  async getPipelineReport(orgId: string, jobId?: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Get jobs with pipeline stages and applications
    let queryBuilder = supabase
      .from('jobs')
      .select(
        `
        id,
        title,
        status,
        created_at,
        pipeline_stages (id, name, position),
        applications (id, current_stage_id, status, created_at, updated_at)
      `,
      )
      .eq('org_id', orgId);

    if (jobId) {
      queryBuilder = queryBuilder.eq('id', jobId);
    }

    const { data: jobs, error } = await queryBuilder;

    if (error) {
      throw error;
    }

    if (!jobs || jobs.length === 0) {
      throw new NotFoundException('No jobs found');
    }

    const reports = jobs.map((job: any) => {
      const stages = ((job.pipeline_stages as any[]) || []).sort(
        (a, b) => a.position - b.position,
      );
      const applications = job.applications || [];

      // Calculate stats per stage
      const stageStats = stages.map((stage) => {
        const stageApps = applications.filter(
          (app: any) => app.current_stage_id === stage.id,
        );
        return {
          stageId: stage.id,
          stageName: stage.name,
          position: stage.position,
          count: stageApps.length,
          percentage:
            applications.length > 0
              ? Math.round((stageApps.length / applications.length) * 100)
              : 0,
        };
      });

      // Calculate conversion rates between stages
      const conversions = stageStats.slice(0, -1).map((stage, idx) => {
        const nextStage = stageStats[idx + 1];
        if (!nextStage || stage.count === 0) return 0;
        return Math.round((nextStage.count / stage.count) * 100);
      });

      // Calculate status distribution
      const statusCounts = {
        applied: applications.filter((a: any) => a.status === 'applied').length,
        in_process: applications.filter((a: any) => a.status === 'in_process')
          .length,
        hired: applications.filter((a: any) => a.status === 'hired').length,
        rejected: applications.filter((a: any) => a.status === 'rejected')
          .length,
      };

      // Calculate average time (simplified - days since creation)
      const avgDays =
        applications.length > 0
          ? Math.round(
              applications.reduce((sum: number, app: any) => {
                const created = new Date(app.created_at);
                const updated = new Date(app.updated_at);
                return (
                  sum +
                  (updated.getTime() - created.getTime()) /
                    (1000 * 60 * 60 * 24)
                );
              }, 0) / applications.length,
            )
          : 0;

      return {
        jobId: job.id,
        jobTitle: job.title,
        jobStatus: job.status,
        totalApplications: applications.length,
        stages: stageStats,
        conversions,
        statusDistribution: statusCounts,
        averageDaysInPipeline: avgDays,
        hireRate:
          applications.length > 0
            ? Math.round((statusCounts.hired / applications.length) * 100)
            : 0,
      };
    });

    return jobId ? reports[0] : reports;
  }

  async getAssessmentsReport(orgId: string, jobId?: string) {
    const supabase = this.supabaseService.getAdminClient();

    let queryBuilder = supabase
      .from('assessments')
      .select(
        `
        id,
        status,
        assessment_type,
        raw_score,
        normalized_score,
        traits,
        created_at,
        candidates!inner (id, owner_org_id),
        jobs (id, title)
      `,
      )
      .eq('candidates.owner_org_id', orgId)
      .eq('status', 'completed');

    if (jobId) {
      queryBuilder = queryBuilder.eq('job_id', jobId);
    }

    const { data: assessments, error } = await queryBuilder;

    if (error) {
      throw error;
    }

    if (!assessments || assessments.length === 0) {
      return {
        totalAssessments: 0,
        completedAssessments: 0,
        byType: {},
        recentAssessments: [],
        averageScore: 0,
        medianScore: 0,
        traitAverages: {
          bigFive: {},
          disc: {},
        },
        scoreDistribution: [],
      };
    }

    const toNumber = (value: any): number | null => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const normalizeScore = (value: number): number => {
      if (value <= 1) return Math.round(value * 100);
      if (value > 100) return Math.min(100, Math.round(value));
      return Math.round(value);
    };

    const extractScore = (assessment: any): number | null => {
      const direct = toNumber(assessment.normalized_score);
      if (direct !== null) return normalizeScore(direct);

      const interpreted = toNumber(assessment.interpreted_score?.score);
      if (interpreted !== null) return normalizeScore(interpreted);

      const raw = toNumber(assessment.raw_score?.score ?? assessment.raw_score);
      if (raw !== null) return normalizeScore(raw);

      const traitsScore = toNumber(assessment.traits?.score);
      if (traitsScore !== null) return normalizeScore(traitsScore);

      return null;
    };

    const accumulateAverage = (
      bucket: Record<string, { sum: number; count: number }>,
      key: string,
      value: any,
    ) => {
      const numeric = toNumber(value);
      if (numeric === null) return;
      if (!bucket[key]) bucket[key] = { sum: 0, count: 0 };
      bucket[key].sum += numeric;
      bucket[key].count += 1;
    };

    // Group by assessment_type
    const byType: Record<string, number> = {};
    const scores: number[] = [];
    const discBucket: Record<string, { sum: number; count: number }> = {};
    const bigFiveBucket: Record<string, { sum: number; count: number }> = {};

    for (const a of assessments) {
      const type = (a as any).assessment_type || (a as any).assessment_kind || 'unknown';
      byType[type] = (byType[type] || 0) + 1;

      const score = extractScore(a);
      if (score !== null) scores.push(score);

      const traits = (a as any).traits || {};
      const discTraits = traits.disc || traits;
      const bigFiveTraits = traits.big_five || traits.bigFive || traits;

      accumulateAverage(discBucket, 'dominance', discTraits.D ?? discTraits.dominance ?? discTraits.dominance_score);
      accumulateAverage(discBucket, 'influence', discTraits.I ?? discTraits.influence ?? discTraits.influence_score);
      accumulateAverage(discBucket, 'steadiness', discTraits.S ?? discTraits.steadiness ?? discTraits.steadiness_score);
      accumulateAverage(discBucket, 'conscientiousness', discTraits.C ?? discTraits.conscientiousness ?? discTraits.conscientiousness_score);

      accumulateAverage(bigFiveBucket, 'openness', bigFiveTraits.openness);
      accumulateAverage(bigFiveBucket, 'conscientiousness', bigFiveTraits.conscientiousness);
      accumulateAverage(bigFiveBucket, 'extraversion', bigFiveTraits.extraversion);
      accumulateAverage(bigFiveBucket, 'agreeableness', bigFiveTraits.agreeableness);
      accumulateAverage(bigFiveBucket, 'neuroticism', bigFiveTraits.neuroticism);
    }

    const averageScore = scores.length
      ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
      : 0;

    const medianScore = scores.length
      ? (() => {
          const sorted = [...scores].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          if (sorted.length % 2 === 0) {
            return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
          }
          return sorted[mid];
        })()
      : 0;

    const buildAverages = (bucket: Record<string, { sum: number; count: number }>) => {
      const result: Record<string, number> = {};
      Object.entries(bucket).forEach(([key, value]) => {
        result[key] = value.count ? Math.round(value.sum / value.count) : 0;
      });
      return result;
    };

    const scoreRanges = [
      { label: '0-20', min: 0, max: 20 },
      { label: '21-40', min: 21, max: 40 },
      { label: '41-60', min: 41, max: 60 },
      { label: '61-80', min: 61, max: 80 },
      { label: '81-100', min: 81, max: 100 },
    ];

    const scoreDistribution = scoreRanges.map((range) => {
      const count = scores.filter((value) => value >= range.min && value <= range.max).length;
      const percentage = scores.length ? Math.round((count / scores.length) * 100) : 0;
      return { range: range.label, count, percentage };
    });

    // Recent assessments
    const recentAssessments = assessments.slice(0, 10).map((a: any) => ({
      id: a.id,
      type: a.assessment_type,
      status: a.status,
      createdAt: a.created_at,
      job: a.jobs,
    }));

    return {
      totalAssessments: assessments.length,
      completedAssessments: assessments.filter((a: any) => a.status === 'completed').length,
      byType,
      recentAssessments,
      averageScore,
      medianScore,
      traitAverages: {
        bigFive: buildAverages(bigFiveBucket),
        disc: buildAverages(discBucket),
      },
      scoreDistribution,
    };
  }

  async getDashboardStats(orgId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Get counts
    const [
      jobsResult,
      candidatesResult,
      applicationsResult,
      assessmentsResult,
    ] = await Promise.all([
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId),
      supabase
        .from('candidates')
        .select('id', { count: 'exact', head: true })
        .eq('owner_org_id', orgId),
      supabase
        .from('applications')
        .select('id, jobs!inner(org_id)', { count: 'exact', head: true })
        .eq('jobs.org_id', orgId),
      supabase
        .from('assessments')
        .select('id, candidates!inner(owner_org_id)', {
          count: 'exact',
          head: true,
        })
        .eq('candidates.owner_org_id', orgId),
    ]);

    // Get recent activity
    const { data: recentApplications } = await supabase
      .from('applications')
      .select(
        `
        id,
        status,
        created_at,
        candidates (full_name),
        jobs!inner (title, org_id)
      `,
      )
      .eq('jobs.org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: candidateSources } = await supabase
      .from('candidates')
      .select('source')
      .eq('owner_org_id', orgId);

    const sourceCounts = (candidateSources || []).reduce<Record<string, number>>(
      (acc, item: any) => {
        const name = (item?.source || 'Não informado').trim();
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      },
      {},
    );

    const sources = Object.entries(sourceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Get open jobs count
    const { count: openJobsCount } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'open');

    return {
      stats: {
        totalJobs: jobsResult.count || 0,
        openJobs: openJobsCount || 0,
        totalCandidates: candidatesResult.count || 0,
        totalApplications: applicationsResult.count || 0,
        totalAssessments: assessmentsResult.count || 0,
      },
      sources,
      recentActivity: (recentApplications || []).map((app: any) => ({
        id: app.id,
        type: 'application',
        candidateName: app.candidates?.full_name,
        jobTitle: app.jobs?.title,
        status: app.status,
        createdAt: app.created_at,
      })),
    };
  }
}
