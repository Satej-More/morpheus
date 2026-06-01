from enum import Enum

class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class IncidentStatus(str, Enum):
    DETECTING = "detecting"
    INVESTIGATING = "investigating"
    RESOLVING = "resolving"
    RESOLVED = "resolved"
    MONITORING = "monitoring"

class AgentState(str, Enum):
    IDLE = "idle"
    THINKING = "thinking"
    INVESTIGATING = "investigating"
    RESOLVING = "resolving"
    MONITORING = "monitoring"

class ActionType(str, Enum):
    DQL_QUERY = "dql_query"
    DEPLOYMENT_CHECK = "deployment_check"
    MEMORY_SEARCH = "memory_search"
    HYPOTHESIS_GENERATED = "hypothesis_generated"
    SLACK_NOTIFICATION = "slack_notification"
    GITHUB_ISSUE = "github_issue"
    RESOLVED = "resolved"

# Severity thresholds
LATENCY_THRESHOLDS = {
    Severity.CRITICAL: 2000,   # ms
    Severity.HIGH: 1000,
    Severity.MEDIUM: 500,
    Severity.LOW: 250,
}

ERROR_RATE_THRESHOLDS = {
    Severity.CRITICAL: 10.0,   # percent
    Severity.HIGH: 5.0,
    Severity.MEDIUM: 2.0,
    Severity.LOW: 1.0,
}

# DQL templates
DQL_ERROR_LOGS = """
fetch logs
| filter service.name == "{service}"
| filter loglevel == "ERROR"
| last {window}
| summarize count = count(), by:{{bin(timestamp, 1m), loglevel}}
| sort timestamp desc
"""

DQL_LATENCY_METRICS = """
fetch metrics
| metricSelector: builtin:service.response.time:avg
| filter entity.name == "{service}"
| last {window}
| resolution 1m
"""

DQL_HEAP_METRICS = """
fetch metrics
| metricSelector: jvm.memory.heap.used:avg
| filter entity.name == "{service}"
| last {window}
| resolution 1m
"""

DQL_DEPLOYMENTS = """
fetch events
| filter event.type == "CUSTOM_DEPLOYMENT"
| filter entity.name == "{service}"
| last {window}
| fields timestamp, event.name, deployment.version, deployment.release_stage
"""

DQL_PROBLEM_DETAILS = """
fetch problems
| filter problem.id == "{problem_id}"
| fields problem.id, problem.title, problem.severity, problem.status,
         problem.affected_entities, problem.start_time, problem.end_time
"""
