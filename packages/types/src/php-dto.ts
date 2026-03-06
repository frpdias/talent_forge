// PHP Module DTOs - TalentForge
// Request/Response DTOs for PHP API endpoints

import {
  TfciCycleStatus,
  TfciAssessmentStatus,
  ActionPlanStatus,
  ActionPlanPriority,
  ActionItemStatus,
  AiFeature,
  ReportType,
  TfciScores,
  TfciCycleSettings,
  Nr1Answer,
  CopcMetricType,
} from './php';

// ============ Module Activation DTOs ============

export interface ActivatePhpModuleDto {
  orgId: string;
  expiresAt?: string;
  settings?: Partial<PhpModuleSettingsDto>;
}

export interface PhpModuleSettingsDto {
  tfciEnabled: boolean;
  nr1Enabled: boolean;
  copcEnabled: boolean;
  aiEnabled: boolean;
  maxEmployees: number;
  maxCyclesPerYear: number;
  customLogo?: string;
  primaryColor?: string;
}

export interface UpdatePhpModuleSettingsDto extends Partial<PhpModuleSettingsDto> {}

// ============ TFCI DTOs ============

export interface CreateTfciCycleDto {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  settings?: Partial<TfciCycleSettings>;
}

export interface UpdateTfciCycleDto {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: TfciCycleStatus;
  settings?: Partial<TfciCycleSettings>;
}

export interface SubmitTfciAssessmentDto {
  cycleId: string;
  employeeId: string;
  assessorType: 'self' | 'manager' | 'peer' | 'subordinate';
  scores: TfciScores;
  comments?: string;
}

export interface TfciAssessmentQueryDto {
  cycleId?: string;
  employeeId?: string;
  assessorId?: string;
  status?: TfciAssessmentStatus;
  page?: number;
  limit?: number;
}

export interface TfciCycleResultsDto {
  cycleId: string;
  cycleName: string;
  status: TfciCycleStatus;
  totalEmployees: number;
  completedAssessments: number;
  completionRate: number;
  averageScores: TfciScores;
  employees: TfciEmployeeResultDto[];
}

export interface TfciEmployeeResultDto {
  employeeId: string;
  employeeName: string;
  department?: string;
  scores: TfciScores;
  completionRate: number;
  rank: number;
  trend?: number;
}

// ============ NR-1 DTOs ============

export interface SubmitNr1AssessmentDto {
  employeeId: string;
  cycleId?: string;
  answers: Nr1Answer[];
}

export interface Nr1AssessmentQueryDto {
  employeeId?: string;
  cycleId?: string;
  riskLevel?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface Nr1RiskReportDto {
  orgId: string;
  period: string;
  totalEmployees: number;
  assessedEmployees: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  categoryBreakdown: Array<{
    category: string;
    averageScore: number;
    riskLevel: string;
    employeesAffected: number;
  }>;
  recommendations: string[];
  trend: {
    direction: 'improving' | 'stable' | 'worsening';
    percentage: number;
  };
}

// ============ COPC DTOs ============

export interface CreateCopcMetricDto {
  employeeId: string;
  metricType: CopcMetricType;
  period: string;
  value: number;
  target: number;
  weight?: number;
}

export interface UpdateCopcMetricDto {
  value?: number;
  target?: number;
  weight?: number;
}

export interface BulkCreateCopcMetricsDto {
  period: string;
  metrics: Array<{
    employeeId: string;
    metricType: CopcMetricType;
    value: number;
    target: number;
    weight?: number;
  }>;
}

export interface CopcScoreQueryDto {
  employeeId?: string;
  period?: string;
  department?: string;
  page?: number;
  limit?: number;
}

export interface CopcDashboardDto {
  period: string;
  overallScore: number;
  totalEmployees: number;
  metricAverages: Array<{
    type: CopcMetricType;
    average: number;
    target: number;
    achievement: number;
  }>;
  topPerformers: Array<{
    employeeId: string;
    employeeName: string;
    score: number;
  }>;
  needsImprovement: Array<{
    employeeId: string;
    employeeName: string;
    score: number;
    weakestMetric: CopcMetricType;
  }>;
}

// ============ Action Plan DTOs ============

export interface CreateActionPlanDto {
  employeeId: string;
  title: string;
  description?: string;
  source: 'tfci' | 'nr1' | 'copc' | 'manual';
  sourceId?: string;
  priority: ActionPlanPriority;
  startDate: string;
  dueDate: string;
  items?: CreateActionItemDto[];
}

export interface UpdateActionPlanDto {
  title?: string;
  description?: string;
  status?: ActionPlanStatus;
  priority?: ActionPlanPriority;
  startDate?: string;
  dueDate?: string;
}

export interface CreateActionItemDto {
  title: string;
  description?: string;
  dueDate?: string;
  assigneeId?: string;
}

export interface UpdateActionItemDto {
  title?: string;
  description?: string;
  status?: ActionItemStatus;
  dueDate?: string;
  assigneeId?: string;
}

export interface ActionPlanQueryDto {
  employeeId?: string;
  status?: ActionPlanStatus;
  priority?: ActionPlanPriority;
  source?: string;
  overdue?: boolean;
  page?: number;
  limit?: number;
}

export interface ActionPlanSummaryDto {
  total: number;
  byStatus: Record<ActionPlanStatus, number>;
  byPriority: Record<ActionPlanPriority, number>;
  overdueCount: number;
  completionRate: number;
  averageCompletionTime: number; // days
}

// ============ AI DTOs ============

export interface AiExplainScoreDto {
  employeeId: string;
  scoreType: 'tfci' | 'nr1' | 'copc';
  cycleId?: string;
}

export interface AiSuggestActionsDto {
  employeeId: string;
  context: 'tfci' | 'nr1' | 'copc' | 'overall';
  maxSuggestions?: number;
}

export interface AiGenerateReportDto {
  reportType: ReportType;
  scope: 'employee' | 'department' | 'organization';
  targetId?: string;  // employeeId or departmentId
  period?: string;
  includeCharts?: boolean;
}

export interface AiChatDto {
  conversationId?: string;
  message: string;
  context?: {
    employeeId?: string;
    cycleId?: string;
    feature?: string;
  };
}

export interface AiChatResponseDto {
  conversationId: string;
  message: string;
  suggestions?: string[];
  actions?: Array<{
    type: string;
    label: string;
    data: unknown;
  }>;
}

export interface AiUsageReportDto {
  period: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byFeature: Array<{
    feature: AiFeature;
    requests: number;
    tokens: number;
    cost: number;
  }>;
  dailyUsage: Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

// ============ Dashboard DTOs ============

export interface DashboardQueryDto {
  period?: string;  // 'week' | 'month' | 'quarter' | 'year'
  department?: string;
}

export interface DashboardRefreshDto {
  forceRefresh?: boolean;
}

// ============ Notification DTOs ============

export interface CreateNotificationDto {
  userId?: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  category: 'tfci' | 'nr1' | 'copc' | 'action_plan' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationQueryDto {
  unreadOnly?: boolean;
  category?: string;
  page?: number;
  limit?: number;
}

// ============ Employee DTOs ============

export interface CreatePhpEmployeeDto {
  fullName: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  managerId?: string;
  hireDate?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePhpEmployeeDto {
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  managerId?: string;
  hireDate?: string;
  status?: 'active' | 'inactive' | 'terminated';
  metadata?: Record<string, unknown>;
}

export interface BulkImportEmployeesDto {
  employees: CreatePhpEmployeeDto[];
  updateExisting?: boolean;
  matchBy?: 'email' | 'phone' | 'fullName';
}

export interface BulkImportResultDto {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface EmployeeQueryDto {
  search?: string;
  department?: string;
  status?: string;
  managerId?: string;
  hasActivePlan?: boolean;
  page?: number;
  limit?: number;
}

// ============ Settings DTOs ============

export interface PhpOrgSettingsDto {
  tfci: {
    defaultCycleLength: number;
    defaultWeights: {
      self: number;
      manager: number;
      peer: number;
      subordinate: number;
    };
    minPeers: number;
    maxPeers: number;
    allowAnonymousPeer: boolean;
  };
  nr1: {
    autoReminders: boolean;
    reminderFrequency: 'weekly' | 'biweekly' | 'monthly';
    riskThresholds: {
      medium: number;
      high: number;
      critical: number;
    };
  };
  copc: {
    defaultMetrics: CopcMetricType[];
    scoringMethod: 'weighted' | 'simple';
    minimumScore: number;
  };
  notifications: {
    emailEnabled: boolean;
    inAppEnabled: boolean;
    channels: string[];
  };
  ai: {
    enabled: boolean;
    monthlyLimit: number;
    autoSuggestions: boolean;
  };
}

export interface UpdatePhpOrgSettingsDto extends Partial<PhpOrgSettingsDto> {}
