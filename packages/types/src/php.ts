// PHP Module Types - TalentForge
// Shared types for TFCI, NR-1, COPC, Action Plans, AI, Real-Time

// ============ PHP Enums ============

export enum PhpModuleStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export enum TfciCycleStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TfciAssessmentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export enum Nr1RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ActionPlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ActionItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}

export enum ActionPlanPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum NotificationType {
  ALERT = 'alert',
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
}

export enum NotificationCategory {
  TFCI = 'tfci',
  NR1 = 'nr1',
  COPC = 'copc',
  ACTION_PLAN = 'action_plan',
  SYSTEM = 'system',
}

export enum AiFeature {
  EXPLAIN_SCORE = 'explain_score',
  SUGGEST_ACTIONS = 'suggest_actions',
  GENERATE_REPORT = 'generate_report',
  ANALYZE_TEAM = 'analyze_team',
  CHAT = 'chat',
}

export enum ReportType {
  SUMMARY = 'summary',
  DETAILED = 'detailed',
  EXECUTIVE = 'executive',
  COMPARISON = 'comparison',
}

// ============ PHP Entities ============

export interface PhpModuleActivation {
  id: string;
  orgId: string;
  isActive: boolean;
  activatedAt: string;
  expiresAt?: string;
  activatedBy: string;
  settings: PhpModuleSettings;
  createdAt: string;
  updatedAt: string;
}

export interface PhpModuleSettings {
  tfciEnabled: boolean;
  nr1Enabled: boolean;
  copcEnabled: boolean;
  aiEnabled: boolean;
  maxEmployees: number;
  maxCyclesPerYear: number;
  customLogo?: string;
  primaryColor?: string;
}

// ============ TFCI Types ============

export interface TfciCycle {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: TfciCycleStatus;
  settings: TfciCycleSettings;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TfciCycleSettings {
  selfAssessmentWeight: number;
  managerWeight: number;
  peerWeight: number;
  subordinateWeight: number;
  minPeers: number;
  maxPeers: number;
  allowAnonymous: boolean;
  reminderDays: number[];
}

export interface TfciAssessment {
  id: string;
  cycleId: string;
  employeeId: string;
  assessorId?: string;
  assessorType: 'self' | 'manager' | 'peer' | 'subordinate';
  status: TfciAssessmentStatus;
  scores: TfciScores;
  comments?: string;
  submittedAt?: string;
  createdAt: string;
}

export interface TfciScores {
  technical: number;      // 1-5
  functional: number;     // 1-5
  contextual: number;     // 1-5
  interpersonal: number;  // 1-5
  overall?: number;       // Calculated
}

export interface TfciEmployeeResult {
  employeeId: string;
  employeeName: string;
  department?: string;
  cycleId: string;
  scores: {
    self: TfciScores | null;
    manager: TfciScores | null;
    peers: TfciScores | null;
    subordinates: TfciScores | null;
    weighted: TfciScores;
  };
  completionRate: number;
  rank?: number;
  trend?: number;  // vs previous cycle
}

// ============ NR-1 Types ============

export interface Nr1Assessment {
  id: string;
  orgId: string;
  employeeId: string;
  cycleId?: string;
  assessmentDate: string;
  answers: Nr1Answer[];
  totalScore: number;
  riskLevel: Nr1RiskLevel;
  recommendations: string[];
  createdBy?: string;
  createdAt: string;
}

export interface Nr1Answer {
  questionId: string;
  category: Nr1Category;
  score: number;  // 0-4
}

export type Nr1Category = 
  | 'workload'
  | 'autonomy'
  | 'relationships'
  | 'role_clarity'
  | 'career_growth'
  | 'work_life_balance'
  | 'recognition'
  | 'communication'
  | 'physical_environment'
  | 'job_security';

export interface Nr1RiskSummary {
  orgId: string;
  totalEmployees: number;
  assessed: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  topRiskCategories: Array<{
    category: Nr1Category;
    averageScore: number;
    employeesAffected: number;
  }>;
  trend: number;
}

// ============ COPC Types ============

export interface CopcMetric {
  id: string;
  orgId: string;
  employeeId: string;
  metricType: CopcMetricType;
  period: string;        // YYYY-MM
  value: number;
  target: number;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export type CopcMetricType = 
  | 'first_call_resolution'
  | 'average_handle_time'
  | 'customer_satisfaction'
  | 'quality_score'
  | 'schedule_adherence'
  | 'attendance'
  | 'sales_conversion'
  | 'error_rate';

export interface CopcScore {
  employeeId: string;
  period: string;
  overallScore: number;
  metrics: Array<{
    type: CopcMetricType;
    value: number;
    target: number;
    achievement: number;
    weighted: number;
  }>;
  rank?: number;
  trend?: number;
}

// ============ Action Plan Types ============

export interface ActionPlan {
  id: string;
  orgId: string;
  employeeId: string;
  createdBy: string;
  title: string;
  description?: string;
  source: 'tfci' | 'nr1' | 'copc' | 'manual';
  sourceId?: string;
  status: ActionPlanStatus;
  priority: ActionPlanPriority;
  startDate: string;
  dueDate: string;
  completedAt?: string;
  progress: number;  // 0-100
  items: ActionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ActionItem {
  id: string;
  planId: string;
  title: string;
  description?: string;
  status: ActionItemStatus;
  dueDate?: string;
  assigneeId?: string;
  completedAt?: string;
  order: number;
  createdAt: string;
}

// ============ AI Types ============

export interface AiUsage {
  id: string;
  orgId: string;
  feature: AiFeature;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  orgId: string;
  userId: string;
  conversationId: string;
  messages: AiMessage[];
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AiReport {
  id: string;
  orgId: string;
  generatedBy: string;
  reportType: ReportType;
  title: string;
  content: string;
  sections: AiReportSection[];
  recommendations: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AiReportSection {
  title: string;
  content: string;
  charts?: Array<{
    type: 'bar' | 'line' | 'pie' | 'radar';
    data: unknown;
  }>;
}

// ============ Real-Time Types ============

export interface PhpNotification {
  id: string;
  orgId: string;
  userId?: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface UserPresence {
  userId: string;
  name: string;
  avatar?: string;
  page?: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface EditLock {
  entityType: string;
  entityId: string;
  lockedBy: string;
  lockedByName: string;
  lockedAt: string;
  expiresAt: string;
}

export interface PhpComment {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  entityType: 'action_plan' | 'action_item' | 'assessment' | 'cycle';
  entityId: string;
  content: string;
  parentId?: string;
  isEdited: boolean;
  createdAt: string;
}

// ============ Dashboard Types ============

export interface PhpDashboardMetrics {
  tfci: {
    averageScore: number;
    completionRate: number;
    totalAssessments: number;
    pendingAssessments: number;
    trend: number;
  };
  nr1: {
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    totalRisks: number;
    criticalRisks: number;
    trend: number;
  };
  copc: {
    averageScore: number;
    minScore: number;
    maxScore: number;
    belowMinimum: number;
    trend: number;
  };
  actionPlans: {
    total: number;
    active: number;
    completed: number;
    overdue: number;
    completionRate: number;
    trend: number;
  };
  employees: {
    total: number;
    assessed: number;
    assessmentCoverage: number;
    byDepartment: Record<string, number>;
  };
  lastUpdated: string;
}

// ============ Employee Types (PHP context) ============

export interface PhpEmployee {
  id: string;
  orgId: string;
  userId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  managerId?: string;
  hireDate?: string;
  status: 'active' | 'inactive' | 'terminated';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PhpEmployeeWithScores extends PhpEmployee {
  tfciScore?: number;
  nr1RiskLevel?: Nr1RiskLevel;
  copcScore?: number;
  activePlans?: number;
}
