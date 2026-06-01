"""
Dynatrace Service — Triple-layer integration
============================================
  1. PRIMARY:  Dynatrace MCP Server (npx @dynatrace-oss/dynatrace-mcp-server)
               28 tools via Model Context Protocol over stdio
  2. SECONDARY: Dynatrace REST API v2 (httpx) — classic endpoints, no Grail
  3. FALLBACK:  Mock data — realistic demo data, full agent loop works

NOTE: Classic SaaS tier (icn99153) does NOT have Grail/Platform scopes
(storage:logs:read etc.) — those only exist on Dynatrace Platform tier.
_grail_available is set to False immediately so we never attempt the
/platform/storage/query endpoint and go straight to V2 API + MCP.
"""

import httpx
import logging
from typing import Optional
from config.settings import get_settings
from config.constants import DQL_ERROR_LOGS, DQL_LATENCY_METRICS, DQL_HEAP_METRICS, DQL_DEPLOYMENTS

logger = logging.getLogger(__name__)


class DynatraceService:
    def __init__(self):
        s = get_settings()
        self.base_url = s.dynatrace_api_url.rstrip("/")
        self.token = s.dynatrace_api_token
        self._headers = {
            "Authorization": f"Api-Token {self.token}",
            "Content-Type": "application/json",
        }
        self._mcp: Optional["DynatraceMCPClient"] = None
        self._mcp_available: Optional[bool] = None
        # Classic SaaS tier — Grail /platform/storage endpoint does not exist.
        # Set False immediately to skip that attempt entirely (no 403 spam).
        self._grail_available: bool = False

    # ─── MCP initialization ───────────────────────────────────────────────────

    async def _get_mcp(self) -> Optional["DynatraceMCPClient"]:
        if self._mcp_available is False:
            return None
        if self._mcp is not None and self._mcp.is_running:
            return self._mcp
        from services.mcp_client import DynatraceMCPClient
        client = DynatraceMCPClient()
        ok = await client.start()
        if ok:
            self._mcp = client
            self._mcp_available = True
            logger.info("Dynatrace MCP server active — %d tools", len(client.tools))
        else:
            self._mcp_available = False
            self._mcp = None
        return self._mcp if ok else None

    async def close(self):
        if self._mcp:
            await self._mcp.stop()

    def _client(self) -> httpx.AsyncClient:
        if not self.base_url or not self.base_url.startswith("http"):
            # No valid URL — return a client that will fail cleanly
            return httpx.AsyncClient(
                base_url="http://localhost:19999",
                headers=self._headers,
                timeout=2,
            )
        return httpx.AsyncClient(
            base_url=self.base_url,
            headers=self._headers,
            timeout=30,
        )

    @property
    def mcp_enabled(self) -> bool:
        return self._mcp is not None and self._mcp.is_running

    # ─── DQL (MCP → V2 REST → Mock) ──────────────────────────────────────────
    # Grail REST layer removed — not available on classic SaaS tier.

    async def run_dql(self, query: str) -> dict:
        """
        Execute DQL query with fallback chain:
        1. MCP execute_dql  (best — real Grail DQL via MCP server)
        2. V2 API           (metrics.read / logs.read classic scopes)
        3. Mock data        (always works, realistic for demo)
        """
        # 1. Try MCP first — it has its own Grail connection
        mcp = await self._get_mcp()
        if mcp:
            try:
                result = await mcp.execute_dql(query)
                if result and "error" not in result:
                    logger.debug("DQL via MCP: success")
                    return result
            except Exception as e:
                logger.warning("MCP DQL failed: %s", e)

        # 2. Try V2 REST API (works with classic scopes — metrics/logs/events)
        if self.base_url and self.base_url.startswith("http"):
            v2_result = await self._query_v2(query)
            if v2_result:
                return v2_result

        # 3. Rich mock data — agent logic works identically
        logger.debug("DQL using mock data (no live DT connection)")
        return self._mock_dql_response(query)

    async def _query_v2(self, query: str) -> Optional[dict]:
        """
        Query Dynatrace V2 REST API endpoints.
        Works with classic scopes: metrics.read, logs.read, events.read.
        """
        q = query.lower()

        # Logs query → /api/v2/logs/search
        if "loglevel" in q or ("fetch logs" in q and "error" in q):
            async with self._client() as client:
                try:
                    resp = await client.get(
                        "/api/v2/logs/search",
                        params={
                            "query": 'status("ERROR")',
                            "from": "now-15m",
                            "limit": 100,
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    records = [
                        {
                            "timestamp": r.get("timestamp", ""),
                            "count": 1,
                            "loglevel": "ERROR",
                            "content": r.get("content", ""),
                        }
                        for r in data.get("results", [])
                    ]
                    if records:
                        return {"result": {"records": records, "source": "v2_logs"}}
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 403:
                        logger.warning("Logs API 403 — token may need logs.read scope")
                    else:
                        logger.debug("Logs V2 error: %s", e)
                except Exception as e:
                    logger.debug("Logs V2 failed: %s", e)

        # Metrics query → /api/v2/metrics/query
        if "metric" in q or "response.time" in q or "heap" in q or "cpu" in q:
            async with self._client() as client:
                try:
                    if "heap" in q or "memory" in q:
                        selector = "ext:jvm.memory.heap.used"
                    elif "cpu" in q:
                        selector = "builtin:host.cpu.usage"
                    else:
                        selector = "builtin:service.response.time:avg"

                    resp = await client.get(
                        "/api/v2/metrics/query",
                        params={
                            "metricSelector": selector,
                            "resolution": "1m",
                            "from": "now-30m",
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    records = []
                    for series in data.get("result", []):
                        for point in series.get("data", []):
                            if len(point) >= 2:
                                records.append({
                                    "timestamp": point[0],
                                    "value": point[1] if point[1] is not None else 0,
                                })
                    if records:
                        return {"result": {"records": records, "source": "v2_metrics"}}
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 403:
                        logger.warning("Metrics API 403 — token may need metrics.read scope")
                    else:
                        logger.debug("Metrics V2 error: %s", e)
                except Exception as e:
                    logger.debug("Metrics V2 failed: %s", e)

        # Events/deployments → /api/v2/events
        if "deployment" in q or "event" in q:
            async with self._client() as client:
                try:
                    resp = await client.get(
                        "/api/v2/events",
                        params={
                            "eventType": "CUSTOM_DEPLOYMENT",
                            "from": "now-2h",
                            "pageSize": 10,
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    records = []
                    for e in data.get("events", []):
                        props = e.get("properties", {})
                        records.append({
                            "timestamp": e.get("startTime", ""),
                            "deployment.version": props.get("dt.event.deployment.version", "unknown"),
                            "entity.name": e.get("entityId", {}).get("name", "unknown"),
                            "commit": props.get("dt.event.deployment.commit_id", ""),
                            "deployment.release_stage": props.get("dt.event.deployment.release_stage", "production"),
                        })
                    if records:
                        return {"result": {"records": records, "source": "v2_events"}}
                except Exception as e:
                    logger.debug("Events V2 failed: %s", e)

        return None

    def _mock_dql_response(self, query: str) -> dict:
        """Rich realistic mock DQL response — agent logic works identically."""
        q = query.lower()
        if "error" in q or "loglevel" in q:
            records = [
                {"timestamp": "2026-06-01T02:20:00Z", "count": 3,   "loglevel": "ERROR"},
                {"timestamp": "2026-06-01T02:21:00Z", "count": 47,  "loglevel": "ERROR"},
                {"timestamp": "2026-06-01T02:22:00Z", "count": 312, "loglevel": "ERROR"},
                {"timestamp": "2026-06-01T02:23:00Z", "count": 891, "loglevel": "ERROR"},
            ]
        elif "deployment" in q or "event" in q:
            records = [{
                "timestamp": "2026-06-01T02:14:22Z",
                "deployment.version": "v2.3.1",
                "entity.name": "payments-api",
                "commit": "abc7f3e2",
                "deployment.release_stage": "production",
            }]
        elif "heap" in q or "memory" in q:
            records = [
                {"timestamp": f"2026-06-01T02:{14+i:02d}:00Z", "value": 2100 + i * 420}
                for i in range(8)
            ]
        else:
            records = [
                {"timestamp": f"2026-06-01T02:{20+i:02d}:00Z", "value": 245 + i * 600}
                for i in range(5)
            ]
        return {
            "result": {
                "records": records,
                "metadata": {"query": query[:100], "source": "mock", "demo_mode": True},
            }
        }

    # ─── Problems API (MCP → V2 REST → Mock) ─────────────────────────────────

    async def get_active_problems(self) -> list[dict]:
        # Try MCP first
        mcp = await self._get_mcp()
        if mcp:
            try:
                problems = await mcp.list_problems(status="OPEN")
                if problems and not (len(problems) == 1 and "error" in problems[0]):
                    logger.info("Problems via MCP: %d active", len(problems))
                    return problems
            except Exception as e:
                logger.warning("MCP list_problems failed: %s", e)

        # V2 REST fallback
        if self.base_url and self.base_url.startswith("http"):
            async with self._client() as client:
                try:
                    resp = await client.get(
                        "/api/v2/problems",
                        params={"problemSelector": "status(OPEN)", "pageSize": 50},
                    )
                    resp.raise_for_status()
                    problems = resp.json().get("problems", [])
                    logger.info("Problems via V2 REST: %d active", len(problems))
                    return problems
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 403:
                        logger.warning("Problems API 403 — check problems.read scope on token")
                    else:
                        logger.error("Problems API error %s: %s", e.response.status_code, e)
                except httpx.HTTPError as e:
                    logger.error("Problems API request failed: %s", e)

        logger.debug("Problems using mock data")
        return self._mock_problems()

    def _mock_problems(self) -> list[dict]:
        return [{
            "problemId": "P-7829341",
            "displayId": "P-7829341",
            "title": "Response time degradation on payments-api",
            "severityLevel": "PERFORMANCE",
            "status": "OPEN",
            "impactLevel": "SERVICE",
            "affectedEntities": [
                {"entityId": {"id": "SERVICE-payments-api"}, "name": "payments-api"}
            ],
            "startTime": 1748480400000,
            "endTime": -1,
        }]

    async def get_problem_details(self, problem_id: str) -> dict:
        if not self.base_url:
            return {}
        async with self._client() as client:
            try:
                resp = await client.get(f"/api/v2/problems/{problem_id}")
                resp.raise_for_status()
                return resp.json()
            except Exception:
                return {}

    # ─── Entities (MCP → V2 REST) ─────────────────────────────────────────────

    async def get_service_topology(self, service_name: str) -> dict:
        mcp = await self._get_mcp()
        if mcp:
            try:
                entities = await mcp.get_entities("SERVICE", service_name)
                if entities:
                    return entities[0] if isinstance(entities, list) else entities
            except Exception as e:
                logger.warning("MCP get_entities failed: %s", e)

        if self.base_url and self.base_url.startswith("http"):
            async with self._client() as client:
                try:
                    resp = await client.get(
                        "/api/v2/entities",
                        params={
                            "entitySelector": f'type("SERVICE"),entityName.equals("{service_name}")',
                            "fields": "+toRelationships,+fromRelationships",
                        },
                    )
                    resp.raise_for_status()
                    entities = resp.json().get("entities", [])
                    return entities[0] if entities else {}
                except Exception:
                    return {}
        return {}

    # ─── Davis AI NL→DQL (MCP-only) ──────────────────────────────────────────

    async def natural_language_to_dql(self, question: str) -> str:
        mcp = await self._get_mcp()
        if mcp:
            try:
                dql = await mcp.generate_dql_from_natural_language(question)
                if dql:
                    logger.info("Davis AI DQL generated: %s", dql[:80])
                    return dql
            except Exception as e:
                logger.warning("Davis AI NL→DQL failed: %s", e)
        return ""

    async def get_environment_info(self) -> dict:
        mcp = await self._get_mcp()
        if mcp:
            try:
                return await mcp.get_environment_info()
            except Exception:
                pass
        return {
            "url": self.base_url or "not configured",
            "tier": "classic-saas",
            "mcp_status": "running" if self.mcp_enabled else "unavailable",
            "grail_status": "not-available-on-classic-tier",
            "mode": "MCP" if self.mcp_enabled else "V2+Mock",
        }

    # ─── Convenience helpers ──────────────────────────────────────────────────

    async def get_error_logs(self, service: str, window: str = "15m") -> dict:
        return await self.run_dql(DQL_ERROR_LOGS.format(service=service, window=window))

    async def get_latency_metrics(self, service: str, window: str = "30m") -> dict:
        return await self.run_dql(DQL_LATENCY_METRICS.format(service=service, window=window))

    async def get_heap_metrics(self, service: str, window: str = "30m") -> dict:
        return await self.run_dql(DQL_HEAP_METRICS.format(service=service, window=window))

    async def get_deployments(self, service: str, window: str = "2h") -> dict:
        return await self.run_dql(DQL_DEPLOYMENTS.format(service=service, window=window))

    async def check_metrics_normalized(self, service: str) -> bool:
        result = await self.get_latency_metrics(service, "5m")
        records = result.get("result", {}).get("records", [])
        if not records:
            return False
        last = records[-1].get("value") or records[-1].get("count") or 9999
        return float(last) < 500