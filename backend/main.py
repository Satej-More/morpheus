"""
Morpheus Backend — FastAPI Application
=======================================
FIXES:
1. Added /api/v1/diagnostics endpoint to show what's connected
2. Added proper CORS for frontend on localhost:3000
3. Added /api/v1/agent/info endpoint showing MCP + Gemini status
4. Simulation now uses richer mock problem data
"""

import asyncio
import json
import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from agent.orchestrator import MorpheusOrchestrator
from memory.incidents import IncidentMemory
from config.settings import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)


# ─── WebSocket manager ────────────────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)
        logger.info("WS client connected. Total: %d", len(self.connections))

    def disconnect(self, ws: WebSocket):
        if ws in self.connections:
            self.connections.remove(ws)

    async def broadcast(self, message: dict):
        dead = []
        for ws in self.connections:
            try:
                await ws.send_text(json.dumps(message, default=str))
            except Exception:
                dead.append(ws)
        for ws in dead:
            if ws in self.connections:
                self.connections.remove(ws)


manager = ConnectionManager()
memory = IncidentMemory()
agent: Optional[MorpheusOrchestrator] = None
agent_task: Optional[asyncio.Task] = None


# ─── Lifecycle ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global agent
    await memory.initialize_indexes()
    agent = MorpheusOrchestrator(broadcast_fn=manager.broadcast)
    logger.info("Morpheus agent initialized")
    yield
    if agent_task and not agent_task.done():
        agent_task.cancel()
    await memory.close()
    logger.info("Morpheus shutdown complete")


app = FastAPI(
    title="Morpheus SRE Agent API",
    version="1.0.0",
    description="Autonomous incident detection and resolution — Google Cloud Rapid Agent Hackathon",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── WebSocket ────────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        await ws.send_text(json.dumps({
            "event": "connected",
            "data": {
                "state": str(agent.state) if agent else "offline",
                "version": "1.0.0",
                "mcp_enabled": agent.dynatrace.mcp_enabled if agent else False,
                "gemini_available": agent.gemini.is_available if agent else False,
            },
            "timestamp": datetime.utcnow().isoformat(),
        }))
        while True:
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_text(json.dumps({"event": "pong"}))
    except WebSocketDisconnect:
        manager.disconnect(ws)


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "agent_state": str(agent.state) if agent else "offline",
        "ws_connections": len(manager.connections),
        "timestamp": datetime.utcnow().isoformat(),
    }


# ─── Diagnostics (NEW) ────────────────────────────────────────────────────────

@app.get("/api/v1/diagnostics")
async def diagnostics():
    """
    Show exactly what's connected and what's running in fallback mode.
    Use this to debug your API keys and connections.
    """
    s = get_settings()
    dt_info = await agent.dynatrace.get_environment_info() if agent else {}
    return {
        "dynatrace": {
            "url": s.dynatrace_api_url or "NOT SET",
            "token_set": bool(s.dynatrace_api_token),
            "token_prefix": s.dynatrace_api_token[:12] + "..." if s.dynatrace_api_token else "none",
            "mcp_enabled": agent.dynatrace.mcp_enabled if agent else False,
            "grail_available": agent.dynatrace._grail_available if agent else None,
            "mode": dt_info.get("mode", "unknown"),
            "fix_403": (
                "Regenerate token with scopes: storage:logs:read, storage:metrics:read, "
                "storage:events:read, storage:buckets:read, entities.read, problems.read"
                if agent and agent.dynatrace._grail_available is False else "OK"
            ),
        },
        "gemini": {
            "key_set": bool(s.google_api_key),
            "key_prefix": s.google_api_key[:12] + "..." if s.google_api_key else "none",
            "model": s.gemini_model,
            "available": agent.gemini.is_available if agent else False,
            "fix_invalid_key": (
                "Get a fresh key at https://aistudio.google.com/apikey — "
                "your key may have a typo (check last character)"
                if agent and agent.gemini.is_available is False else "OK"
            ),
        },
        "mongodb": {
            "uri_set": bool(s.mongodb_uri),
            "database": s.mongodb_database,
        },
        "github": {
            "token_set": bool(s.github_token),
            "repo": s.github_repo or "NOT SET",
        },
        "slack": {
            "webhook_set": bool(s.slack_webhook_url),
            "channel": s.slack_channel,
        },
        "overall_mode": (
            "FULL LIVE" if (agent and agent.dynatrace.mcp_enabled and agent.gemini.is_available)
            else "PARTIAL LIVE" if (agent and agent.gemini.is_available)
            else "DEMO MODE (mock DT + fallback AI)"
        ),
    }


# ─── Incidents ────────────────────────────────────────────────────────────────

@app.get("/api/v1/incidents")
async def list_incidents(
    limit: int = 50,
    status: Optional[str] = None,
    severity: Optional[str] = None,
):
    incidents = await memory.list_incidents(limit=limit, status=status, severity=severity)
    return {"incidents": incidents, "total": len(incidents)}


@app.get("/api/v1/incidents/{incident_id}")
async def get_incident(incident_id: str):
    incident = await memory.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@app.post("/api/v1/incidents/simulate")
async def simulate_incident(background_tasks: BackgroundTasks):
    """Trigger a simulated production incident for demo purposes."""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    mock_problem = {
        "problemId": f"P-DEMO-{str(uuid.uuid4())[:6].upper()}",
        "title": "Response time degradation on payments-api",
        "severityLevel": "PERFORMANCE",
        "status": "OPEN",
        "impactLevel": "SERVICE",
        "affectedEntities": [
            {"entityId": {"id": "SERVICE-payments"}, "name": "payments-api"}
        ],
        "startTime": int(datetime.utcnow().timestamp() * 1000),
        "endTime": -1,
    }

    background_tasks.add_task(agent.investigate_incident, mock_problem)

    return {
        "message": "Incident simulation started",
        "problem_id": mock_problem["problemId"],
        "service": "payments-api",
        "watch": "http://localhost:3000/incidents",
        "note": "Agent will investigate, notify Slack, and create GitHub issue autonomously",
    }


@app.delete("/api/v1/incidents")
async def clear_incidents():
    """Clear all incidents from MongoDB (useful for clean demos)."""
    result = await memory.incidents.delete_many({})
    return {"deleted": result.deleted_count, "message": "All incidents cleared"}


# ─── Agent ────────────────────────────────────────────────────────────────────

@app.get("/api/v1/agent/status")
async def agent_status():
    if not agent:
        return {"state": "offline", "is_online": False}
    return {
        "state": str(agent.state),
        "current_incident_id": agent.current_incident_id,
        "is_online": True,
        "active_monitors": len(agent._active_monitors),
        "ws_clients": len(manager.connections),
        "mcp_enabled": agent.dynatrace.mcp_enabled,
        "gemini_available": agent.gemini.is_available,
    }


@app.get("/api/v1/agent/info")
async def agent_info():
    """Detailed agent capability info — for Devpost/judges."""
    if not agent:
        return {"status": "offline"}
    return {
        "name": "Morpheus Autonomous SRE Agent",
        "version": "1.0.0",
        "capabilities": {
            "dynatrace_mcp": agent.dynatrace.mcp_enabled,
            "dynatrace_grail_dql": agent.dynatrace._grail_available,
            "dynatrace_v2_api": bool(agent.dynatrace.base_url),
            "gemini_reasoning": agent.gemini.is_available,
            "gemini_fallback": True,
            "mongodb_memory": True,
            "slack_notifications": True,
            "github_issues": True,
        },
        "investigation_steps": [
            "1. Anomaly detection via Dynatrace DQL",
            "2. Deployment correlation (event timeline)",
            "3. JVM heap + latency metric analysis",
            "4. Historical pattern matching (MongoDB)",
            "5. Gemini 2.0 hypothesis generation + confidence scoring",
            "6. Slack notification + GitHub issue creation",
            "7. Resolution monitoring + auto-close",
        ],
        "partner_integrations": [
            "Dynatrace MCP Server (@dynatrace-oss/dynatrace-mcp-server)",
            "Dynatrace Problems API + DQL (Grail)",
            "Google Gemini 2.0 Flash",
            "MongoDB Atlas (incident memory + pattern matching)",
        ],
    }


@app.post("/api/v1/agent/start")
async def start_agent(background_tasks: BackgroundTasks):
    global agent_task
    if agent_task and not agent_task.done():
        return {"message": "Agent already running"}
    agent_task = asyncio.create_task(agent.start())
    return {"message": "Agent polling loop started"}


@app.post("/api/v1/agent/stop")
async def stop_agent():
    global agent_task
    if agent:
        await agent.stop()
    if agent_task:
        agent_task.cancel()
    return {"message": "Agent stopped"}


# ─── Dev server ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    s = get_settings()
    uvicorn.run(
        "main:app",
        host=s.host,
        port=s.port,
        reload=False,
        log_level="info",
    )
