import type {
  Incident, SystemHealth, AgentStatus, MttrDataPoint, ConnectionConfig, Metric, Service
} from '../types';

function tseries(base: number, variance: number, points: number, spike?: { at: number; val: number }): Metric[] {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const t = now - (points - i) * 60000;
    let v = base + (Math.random() - 0.5) * variance;
    if (spike && Math.abs(i - spike.at) < 3) v = spike.val + (Math.random() - 0.5) * (spike.val * 0.1);
    return { timestamp: t, value: Math.max(0, v) };
  });
}

export const mockIncidents: Incident[] = [
  {
    id: 'INC-2026-001',
    title: 'Critical latency spike in payments-api',
    status: 'resolving',
    severity: 'critical',
    detectedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    affectedServices: ['payments-api', 'checkout-service', 'order-processor'],
    dynatraceId: 'P-7829341',
    rootCause: 'Memory leak in payments-api v2.3.1 — heap exhaustion causing GC thrashing',
    rootCauseConfidence: 87,
    hypotheses: [
      {
        id: 'h1',
        title: 'Memory leak in payments-api v2.3.1',
        description: 'JVM heap usage growing linearly since v2.3.1 deployment 8 minutes ago, consistent with unclosed connection pool objects.',
        confidence: 87,
        evidence: ['Heap usage +340MB in 8 min', 'Deployment correlation (8m delta)', 'Historical match: INC-2025-047'],
        isConfirmed: true,
      },
      {
        id: 'h2',
        title: 'Downstream database connection exhaustion',
        description: 'Connection pool to postgres-primary saturated, causing request queuing.',
        confidence: 34,
        evidence: ['DB connection pool at 98%', 'Query latency p99 elevated'],
        isConfirmed: false,
      },
    ],
    reasoningSteps: [
      {
        id: 'rs1', step: 1, title: 'Anomaly detection triggered',
        detail: 'DQL query returned p99 latency at 4,847ms — 19.8x above baseline of 245ms. Error rate elevated to 23.4%.',
        status: 'complete', timestamp: new Date(Date.now() - 7.5 * 60000).toISOString(), duration: 8200,
        dqlQuery: `fetch logs\n| filter service.name == "payments-api"\n| filter loglevel == "ERROR"\n| last 15m\n| summarize count = count(), by:{bin(timestamp, 1m), loglevel}`,
        dqlResult: `timestamp          | count\n2026-05-29T02:20   | 3\n2026-05-29T02:21   | 47\n2026-05-29T02:22   | 312\n2026-05-29T02:23   | 891`,
      },
      {
        id: 'rs2', step: 2, title: 'Service topology mapped',
        detail: 'Identified 3 downstream services affected: checkout-service, order-processor, notification-worker. Blast radius contained to payment domain.',
        status: 'complete', timestamp: new Date(Date.now() - 7 * 60000).toISOString(), duration: 4100,
      },
      {
        id: 'rs3', step: 3, title: 'Deployment correlation found',
        detail: 'payments-api v2.3.1 deployed 8 minutes before incident onset by @sarah.chen. Commit abc7f3e2 introduced connection pool configuration changes.',
        status: 'complete', timestamp: new Date(Date.now() - 6.5 * 60000).toISOString(), duration: 2900,
        dqlQuery: `fetch events\n| filter event.type == "CUSTOM_DEPLOYMENT"\n| filter entity.name == "payments-api"\n| last 30m\n| fields timestamp, event.name, deployment.version`,
        dqlResult: `timestamp             | version | commit\n2026-05-29T02:14:22Z  | v2.3.1  | abc7f3e2`,
      },
      {
        id: 'rs4', step: 4, title: 'Historical pattern matched',
        detail: 'Searching memory store: found INC-2025-047 with 91% signature similarity. Previous incident: memory leak caused by unclosed HikariCP connections in payments service.',
        status: 'complete', timestamp: new Date(Date.now() - 5.8 * 60000).toISOString(), duration: 1800,
      },
      {
        id: 'rs5', step: 5, title: 'Memory leak hypothesis validated',
        detail: 'JVM heap metrics confirm: growing from 2.1GB → 5.4GB over 8 minutes. GC pause frequency increased 34x. Consistent with connection pool object leak.',
        status: 'complete', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), duration: 6200,
        dqlQuery: `fetch metrics\n| metricSelector: jvm.memory.heap.used:avg\n| filter entity.name == "payments-api"\n| last 30m\n| resolution 1m`,
        dqlResult: `time       | heap_used_gb\n02:14      | 2.1\n02:16      | 2.8\n02:18      | 3.6\n02:20      | 4.4\n02:22      | 5.4 ⚠`,
      },
      {
        id: 'rs6', step: 6, title: 'Actions executed',
        detail: 'Slack notification dispatched to #incidents-critical. GitHub issue #847 created with full forensic context. Rollback recommendation posted to engineering team.',
        status: 'complete', timestamp: new Date(Date.now() - 4.2 * 60000).toISOString(), duration: 890,
      },
      {
        id: 'rs7', step: 7, title: 'Resolution monitoring active',
        detail: 'Watching JVM heap metrics and error rate for normalization. Rollback of v2.3.1 initiated by on-call engineer. Expecting resolution within 3-5 minutes.',
        status: 'running', timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
      },
    ],
    actions: [
      { id: 'a1', type: 'dql_query', title: 'DQL: Error rate query', description: 'Fetched error logs from payments-api', timestamp: new Date(Date.now() - 7.5 * 60000).toISOString(), status: 'success' },
      { id: 'a2', type: 'deployment_check', title: 'Deployment correlation', description: 'Found v2.3.1 deployed 8m before incident', timestamp: new Date(Date.now() - 6.5 * 60000).toISOString(), status: 'success' },
      { id: 'a3', type: 'memory_search', title: 'Historical pattern search', description: 'Matched INC-2025-047 (91% similarity)', timestamp: new Date(Date.now() - 5.8 * 60000).toISOString(), status: 'success' },
      { id: 'a4', type: 'hypothesis_generated', title: 'Root cause identified', description: 'Memory leak in v2.3.1 — confidence 87%', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), status: 'success' },
      { id: 'a5', type: 'slack_notification', title: 'Slack: #incidents-critical', description: 'Critical incident notification dispatched', timestamp: new Date(Date.now() - 4.2 * 60000).toISOString(), status: 'success', metadata: { channel: '#incidents-critical', severity: 'P1' } },
      { id: 'a6', type: 'github_issue', title: 'GitHub Issue #847 created', description: 'Full forensic report with remediation steps', timestamp: new Date(Date.now() - 4.1 * 60000).toISOString(), status: 'success', metadata: { issue: '#847', repo: 'org/payments-service' } },
    ],
    githubIssue: {
      id: 'gi1', number: 847,
      title: '[P1-CRITICAL] Memory leak in payments-api v2.3.1 — heap exhaustion',
      url: 'https://github.com/org/payments-service/issues/847',
      status: 'open',
      labels: ['P1-critical', 'memory-leak', 'morpheus-auto', 'payments'],
      createdAt: new Date(Date.now() - 4.1 * 60000).toISOString(),
      assignee: 'sarah.chen',
    },
    slackNotification: {
      channel: '#incidents-critical',
      message: '🔴 *[P1 CRITICAL]* payments-api latency spike detected\n*Root Cause:* Memory leak in v2.3.1 (87% confidence)\n*Affected:* payments-api, checkout-service, order-processor\n*MTTR Target:* < 5 min\n*Recommended:* Rollback to v2.3.0',
      sentAt: new Date(Date.now() - 4.2 * 60000).toISOString(),
      severity: 'critical',
    },
    logs: [
      { timestamp: new Date(Date.now() - 7 * 60000).toISOString(), level: 'ERROR', service: 'payments-api', message: 'OutOfMemoryError: Java heap space', traceId: 'tr-8f3a2b1c' },
      { timestamp: new Date(Date.now() - 6.8 * 60000).toISOString(), level: 'ERROR', service: 'payments-api', message: 'HikariPool connection timeout after 30000ms', traceId: 'tr-9d4b3c2e' },
      { timestamp: new Date(Date.now() - 6.5 * 60000).toISOString(), level: 'WARN', service: 'checkout-service', message: 'Upstream payments-api returning 503, retry 3/3', traceId: 'tr-7a2c1d3f' },
      { timestamp: new Date(Date.now() - 6 * 60000).toISOString(), level: 'ERROR', service: 'order-processor', message: 'Payment validation failed: upstream timeout', traceId: 'tr-4f8a9b1c' },
      { timestamp: new Date(Date.now() - 5.5 * 60000).toISOString(), level: 'ERROR', service: 'payments-api', message: 'GC overhead limit exceeded — 98% time in GC', traceId: 'tr-2d7e3f8a' },
      { timestamp: new Date(Date.now() - 5 * 60000).toISOString(), level: 'ERROR', service: 'payments-api', message: 'Connection pool exhausted: 200/200 active connections', traceId: 'tr-1c9f4d2b' },
    ],
    metrics: {
      errorRate: tseries(1.2, 0.5, 30, { at: 22, val: 23.4 }),
      latency: tseries(245, 40, 30, { at: 22, val: 4847 }),
      memory: tseries(2100, 100, 30, { at: 20, val: 5400 }),
      cpu: tseries(34, 8, 30, { at: 22, val: 89 }),
    },
    deployment: {
      id: 'd1', service: 'payments-api', version: 'v2.3.1',
      commit: 'abc7f3e2', author: 'sarah.chen',
      deployedAt: new Date(Date.now() - 16 * 60000).toISOString(),
      status: 'rollback', correlatedIncident: 'INC-2026-001',
    },
    mttrSeconds: 134,
  },
  {
    id: 'INC-2026-002',
    title: 'auth-service elevated error rate',
    status: 'investigating',
    severity: 'high',
    detectedAt: new Date(Date.now() - 3 * 60000).toISOString(),
    affectedServices: ['auth-service', 'user-api'],
    dynatraceId: 'P-7829399',
    rootCauseConfidence: 52,
    hypotheses: [],
    reasoningSteps: [
      { id: 'rs1', step: 1, title: 'Anomaly detection triggered', detail: 'Error rate elevated to 8.3% on auth-service. Investigating…', status: 'complete', timestamp: new Date(Date.now() - 2.5 * 60000).toISOString(), duration: 3200 },
      { id: 'rs2', step: 2, title: 'Querying service topology', detail: 'Mapping dependencies and upstream callers…', status: 'running', timestamp: new Date(Date.now() - 1.5 * 60000).toISOString() },
      { id: 'rs3', step: 3, title: 'Deployment correlation check', detail: 'Awaiting results…', status: 'pending', timestamp: new Date().toISOString() },
    ],
    actions: [
      { id: 'a1', type: 'dql_query', title: 'DQL: Error rate analysis', description: 'Fetching auth-service error logs', timestamp: new Date(Date.now() - 2.5 * 60000).toISOString(), status: 'success' },
    ],
    logs: [
      { timestamp: new Date(Date.now() - 2.8 * 60000).toISOString(), level: 'ERROR', service: 'auth-service', message: 'JWT validation failed: signature mismatch', traceId: 'tr-3f7a2b9c' },
      { timestamp: new Date(Date.now() - 2.3 * 60000).toISOString(), level: 'ERROR', service: 'auth-service', message: 'Redis connection pool timeout', traceId: 'tr-8d1c4e7f' },
    ],
    metrics: {
      errorRate: tseries(0.8, 0.3, 30, { at: 27, val: 8.3 }),
      latency: tseries(89, 20, 30, { at: 27, val: 890 }),
      memory: tseries(1200, 80, 30),
      cpu: tseries(45, 10, 30, { at: 27, val: 78 }),
    },
  },
  {
    id: 'INC-2026-003',
    title: 'notification-worker queue depth spike',
    status: 'resolved',
    severity: 'medium',
    detectedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    resolvedAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    mttrSeconds: 1847,
    affectedServices: ['notification-worker'],
    dynatraceId: 'P-7829101',
    rootCause: 'RabbitMQ consumer lag due to downstream SMTP rate limiting',
    rootCauseConfidence: 94,
    hypotheses: [],
    reasoningSteps: [],
    actions: [],
    logs: [],
    metrics: {
      errorRate: tseries(2, 0.5, 30),
      latency: tseries(120, 30, 30),
      memory: tseries(800, 50, 30),
      cpu: tseries(28, 6, 30),
    },
  },
];

export const mockServices: Service[] = [
  { id: 's1', name: 'payments-api', type: 'api', status: 'degraded', latency: 4847, errorRate: 23.4, dependencies: ['postgres-primary', 'redis-cache', 'fraud-service'] },
  { id: 's2', name: 'checkout-service', type: 'api', status: 'degraded', latency: 1240, errorRate: 8.1, dependencies: ['payments-api', 'inventory-api'] },
  { id: 's3', name: 'auth-service', type: 'api', status: 'degraded', latency: 890, errorRate: 8.3, dependencies: ['redis-cache', 'user-api'] },
  { id: 's4', name: 'order-processor', type: 'queue', status: 'degraded', latency: 2100, errorRate: 12.7, dependencies: ['payments-api', 'postgres-primary'] },
  { id: 's5', name: 'postgres-primary', type: 'database', status: 'healthy', latency: 12, errorRate: 0.1, dependencies: [] },
  { id: 's6', name: 'redis-cache', type: 'cache', status: 'healthy', latency: 2, errorRate: 0.0, dependencies: [] },
  { id: 's7', name: 'inventory-api', type: 'api', status: 'healthy', latency: 67, errorRate: 0.2, dependencies: ['postgres-primary'] },
  { id: 's8', name: 'fraud-service', type: 'api', status: 'healthy', latency: 34, errorRate: 0.0, dependencies: ['redis-cache'] },
  { id: 's9', name: 'api-gateway', type: 'gateway', status: 'degraded', latency: 5100, errorRate: 18.2, dependencies: ['auth-service', 'checkout-service'] },
  { id: 's10', name: 'notification-worker', type: 'queue', status: 'healthy', latency: 120, errorRate: 0.3, dependencies: [] },
];

export const mockSystemHealth: SystemHealth = {
  services: mockServices,
  overallStatus: 'degraded',
  totalIncidents: 47,
  activeIncidents: 2,
  avgMttr: 134,
  uptimePercent: 99.7,
};

export const mockAgentStatus: AgentStatus = {
  state: 'investigating',
  currentTask: 'Validating memory leak hypothesis in payments-api',
  incidentsResolved: 46,
  avgResolutionTime: 134,
  confidence: 87,
  lastActivity: new Date(Date.now() - 30000).toISOString(),
  isOnline: true,
};

export const mockMttrData: MttrDataPoint[] = [
  { date: 'May 1', morpheus: 180, manual: 2340 },
  { date: 'May 5', morpheus: 156, manual: 2100 },
  { date: 'May 9', morpheus: 142, manual: 1980 },
  { date: 'May 13', morpheus: 128, manual: 2400 },
  { date: 'May 17', morpheus: 134, manual: 1920 },
  { date: 'May 21', morpheus: 119, manual: 2160 },
  { date: 'May 25', morpheus: 124, manual: 1860 },
  { date: 'May 29', morpheus: 134, manual: 2280 },
];

export const mockConnectionConfig: ConnectionConfig = {
  dynatrace: { apiUrl: 'https://abc12345.live.dynatrace.com', apiToken: 'dt0c01.***', connected: true },
  github: { repoUrl: 'https://github.com/org/payments-service', token: 'ghp_***', connected: true },
  slack: { webhookUrl: 'https://hooks.slack.com/services/***', channel: '#incidents-critical', connected: true },
};

export const mockReasoningStream = [
  { delay: 0, text: 'Anomaly detected on payments-api — initiating investigation protocol…', type: 'init' },
  { delay: 800, text: 'Executing DQL query: fetching error logs for last 15 minutes…', type: 'query' },
  { delay: 1600, text: 'Query returned: 891 ERROR events in the last minute vs baseline of 3/min', type: 'result' },
  { delay: 2400, text: 'Mapping service topology — identifying downstream blast radius…', type: 'analysis' },
  { delay: 3200, text: 'Affected: checkout-service, order-processor. Upstream: api-gateway', type: 'result' },
  { delay: 4000, text: 'Checking deployment events in last 30 minutes…', type: 'query' },
  { delay: 4800, text: 'MATCH: payments-api v2.3.1 deployed 8 minutes before incident onset', type: 'match' },
  { delay: 5600, text: 'Searching memory store for similar incident signatures…', type: 'memory' },
  { delay: 6400, text: 'Found: INC-2025-047 — 91% signature similarity (memory leak pattern)', type: 'match' },
  { delay: 7200, text: 'Validating hypothesis: querying JVM heap metrics…', type: 'query' },
  { delay: 8000, text: 'Heap usage: 2.1GB → 5.4GB (+157%) over 8 minutes. GC pause +3400%', type: 'result' },
  { delay: 8800, text: '▶ Root cause identified: Memory leak in v2.3.1 (HikariCP connection pool)', type: 'hypothesis' },
  { delay: 9600, text: 'Confidence score updated: 87% ████████▓░', type: 'confidence' },
  { delay: 10400, text: 'Dispatching Slack notification to #incidents-critical…', type: 'action' },
  { delay: 11200, text: 'Creating GitHub issue with forensic context and remediation steps…', type: 'action' },
  { delay: 12000, text: 'Recommendation: Rollback to v2.3.0. Estimated resolution: 3-5 minutes', type: 'recommendation' },
  { delay: 12800, text: 'Entering resolution monitoring mode — watching heap metrics…', type: 'monitor' },
];
