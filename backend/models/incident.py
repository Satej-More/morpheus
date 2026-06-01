from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from config.constants import Severity, IncidentStatus


class Metric(BaseModel):
    timestamp: int
    value: float


class Hypothesis(BaseModel):
    id: str
    title: str
    description: str
    confidence: float
    evidence: list[str]
    is_confirmed: bool = False


class ReasoningStep(BaseModel):
    id: str
    step: int
    title: str
    detail: str
    status: str = "pending"   # pending | running | complete | failed
    dql_query: Optional[str] = None
    dql_result: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration_ms: Optional[int] = None


class AgentAction(BaseModel):
    id: str
    type: str
    title: str
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "pending"
    metadata: dict[str, str] = {}


class GitHubIssue(BaseModel):
    id: str
    number: int
    title: str
    url: str
    status: str = "open"
    labels: list[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    assignee: Optional[str] = None


class SlackNotification(BaseModel):
    channel: str
    message: str
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    severity: str


class Deployment(BaseModel):
    id: str
    service: str
    version: str
    commit: str
    author: str
    deployed_at: datetime
    status: str
    correlated_incident: Optional[str] = None


class LogEntry(BaseModel):
    timestamp: datetime
    level: str
    service: str
    message: str
    trace_id: Optional[str] = None


class IncidentMetrics(BaseModel):
    error_rate: list[Metric] = []
    latency: list[Metric] = []
    memory: list[Metric] = []
    cpu: list[Metric] = []


class Incident(BaseModel):
    id: str
    title: str
    status: IncidentStatus = IncidentStatus.DETECTING
    severity: Severity
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    mttr_seconds: Optional[int] = None
    affected_services: list[str] = []
    dynatrace_id: str
    root_cause: Optional[str] = None
    root_cause_confidence: Optional[float] = None
    hypotheses: list[Hypothesis] = []
    reasoning_steps: list[ReasoningStep] = []
    actions: list[AgentAction] = []
    github_issue: Optional[GitHubIssue] = None
    slack_notification: Optional[SlackNotification] = None
    logs: list[LogEntry] = []
    metrics: IncidentMetrics = Field(default_factory=IncidentMetrics)
    deployment: Optional[Deployment] = None

    class Config:
        use_enum_values = True
