export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'detecting' | 'investigating' | 'resolving' | 'resolved' | 'monitoring';
export type AgentState = 'idle' | 'thinking' | 'investigating' | 'resolving' | 'monitoring';
export type ReasoningStepStatus = 'pending' | 'running' | 'complete' | 'failed';
export type ActionType = 'slack_notification' | 'github_issue' | 'dql_query' | 'deployment_check' | 'memory_search' | 'hypothesis_generated' | 'resolved';

export interface Metric {
  timestamp: number;
  value: number;
}

export interface Service {
  id: string;
  name: string;
  type: 'api' | 'database' | 'cache' | 'queue' | 'gateway';
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  errorRate: number;
  dependencies: string[];
}

export interface Deployment {
  id: string;
  service: string;
  version: string;
  commit: string;
  author: string;
  deployedAt: string;
  status: 'success' | 'failed' | 'rollback';
  correlatedIncident?: string;
}

export interface ReasoningStep {
  id: string;
  step: number;
  title: string;
  detail: string;
  status: ReasoningStepStatus;
  dqlQuery?: string;
  dqlResult?: string;
  timestamp: string;
  duration?: number;
}

export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  confidence: number;
  evidence: string[];
  isConfirmed: boolean;
}

export interface AgentAction {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'success' | 'failed';
  metadata?: Record<string, string>;
}

export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  url: string;
  status: 'open' | 'closed';
  labels: string[];
  createdAt: string;
  assignee?: string;
}

export interface SlackNotification {
  channel: string;
  message: string;
  sentAt: string;
  severity: Severity;
}

export interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  service: string;
  message: string;
  traceId?: string;
}

export interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: Severity;
  detectedAt: string;
  resolvedAt?: string;
  mttrSeconds?: number;
  affectedServices: string[];
  dynatraceId: string;
  rootCause?: string;
  rootCauseConfidence?: number;
  hypotheses: Hypothesis[];
  reasoningSteps: ReasoningStep[];
  actions: AgentAction[];
  githubIssue?: GitHubIssue;
  slackNotification?: SlackNotification;
  logs: LogEntry[];
  metrics: {
    errorRate: Metric[];
    latency: Metric[];
    memory: Metric[];
    cpu: Metric[];
  };
  deployment?: Deployment;
}

export interface SystemHealth {
  services: Service[];
  overallStatus: 'healthy' | 'degraded' | 'critical';
  totalIncidents: number;
  activeIncidents: number;
  avgMttr: number;
  uptimePercent: number;
}

export interface AgentStatus {
  state: AgentState;
  currentTask?: string;
  incidentsResolved: number;
  avgResolutionTime: number;
  confidence: number;
  lastActivity: string;
  isOnline: boolean;
}

export interface MttrDataPoint {
  date: string;
  morpheus: number;
  manual: number;
}

export interface ConnectionConfig {
  dynatrace: { apiUrl: string; apiToken: string; connected: boolean };
  github: { repoUrl: string; token: string; connected: boolean };
  slack: { webhookUrl: string; channel: string; connected: boolean };
}
