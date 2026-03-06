// API Response types

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

export interface AuthContext {
  user: AuthUser;
  orgId: string;
  orgRole: string;
}

// Report types
export interface PipelineReportData {
  jobId: string;
  jobTitle: string;
  stages: StageStats[];
  totalApplications: number;
  averageTimeToHire?: number;
  conversionRate: number;
}

export interface StageStats {
  stageId: string;
  stageName: string;
  count: number;
  averageTime?: number;
  percentage: number;
}

export interface AssessmentReportData {
  jobId?: string;
  totalAssessments: number;
  averageScore: number;
  medianScore: number;
  scoreDistribution: ScoreDistribution[];
}

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}
