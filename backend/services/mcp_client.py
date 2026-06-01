"""
Dynatrace MCP Client
====================
Integrates the official @dynatrace-oss/dynatrace-mcp-server via MCP stdio protocol.
This gives Morpheus access to all 28 Dynatrace MCP tools including:
  - execute_dql  (run DQL queries against Grail)
  - list_problems (get active problems)
  - get_entities (service topology)
  - generate_dql_from_natural_language (Davis AI)
  - get_metrics, get_logs, get_events

The MCP server is started as a subprocess using npx and communicates via
JSON-RPC over stdio (standard MCP transport).

This is the hackathon-required integration:
  "Partner Power: Your solution must demonstrate a meaningful integration
   with at least one participating partner's solution using MCP"
"""

import asyncio
import json
import logging
import os
import subprocess
from typing import Any, Optional
from config.settings import get_settings

logger = logging.getLogger(__name__)


class DynatraceMCPClient:
    """
    Client for the Dynatrace MCP server (@dynatrace-oss/dynatrace-mcp-server).

    Launches the MCP server as a subprocess and communicates via
    JSON-RPC 2.0 over stdin/stdout (MCP stdio transport).
    """

    def __init__(self):
        self.settings = get_settings()
        self._process: Optional[asyncio.subprocess.Process] = None
        self._request_id = 0
        self._initialized = False
        self._available_tools: list[dict] = []

    # ─── Lifecycle ────────────────────────────────────────────────────────────

    async def start(self) -> bool:
        """Start the Dynatrace MCP server subprocess. Returns True on success."""
        if not self.settings.dynatrace_api_url or not self.settings.dynatrace_api_token:
            logger.warning("Dynatrace credentials not set — MCP client running in mock mode")
            return False

        env = {
            **os.environ,
            "DT_ENVIRONMENT": self.settings.dynatrace_api_url.rstrip("/"),
            "DT_API_TOKEN": self.settings.dynatrace_api_token,
        }

        try:
            self._process = await asyncio.create_subprocess_exec(
                "npx", "-y", "@dynatrace-oss/dynatrace-mcp-server@latest",
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,
            )
            # Initialize the MCP session
            await self._initialize()
            # Discover available tools
            await self._list_tools()
            logger.info(
                "Dynatrace MCP server started — %d tools available",
                len(self._available_tools)
            )
            return True
        except FileNotFoundError:
            logger.warning("npx not found — install Node.js to use MCP. Falling back to REST API.")
            return False
        except Exception as e:
            logger.error("Failed to start Dynatrace MCP server: %s", e)
            return False

    async def stop(self):
        """Terminate the MCP server subprocess."""
        if self._process:
            try:
                self._process.terminate()
                await self._process.wait()
            except Exception:
                pass
            self._process = None
            self._initialized = False

    @property
    def is_running(self) -> bool:
        return self._process is not None and self._process.returncode is None

    @property
    def tools(self) -> list[dict]:
        return self._available_tools

    # ─── MCP Protocol ────────────────────────────────────────────────────────

    async def _send(self, method: str, params: dict = None) -> dict:
        """Send a JSON-RPC request and read the response."""
        if not self._process or not self._process.stdin:
            raise RuntimeError("MCP process not running")

        self._request_id += 1
        request = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": method,
        }
        if params:
            request["params"] = params

        line = json.dumps(request) + "\n"
        self._process.stdin.write(line.encode())
        await self._process.stdin.drain()

        # Read response
        response_line = await asyncio.wait_for(
            self._process.stdout.readline(), timeout=30.0
        )
        return json.loads(response_line.decode().strip())

    async def _initialize(self):
        """Send MCP initialize handshake."""
        resp = await self._send("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "clientInfo": {"name": "morpheus-sre-agent", "version": "1.0.0"},
        })
        if resp.get("result"):
            await self._send("notifications/initialized")
            self._initialized = True

    async def _list_tools(self):
        """Discover available MCP tools."""
        resp = await self._send("tools/list")
        self._available_tools = resp.get("result", {}).get("tools", [])

    async def call_tool(self, tool_name: str, arguments: dict) -> dict:
        """
        Call a Dynatrace MCP tool by name.

        Available tools include:
          execute_dql, list_problems, get_entities, get_metrics,
          get_logs, get_events, generate_dql_from_natural_language,
          explain_dql_in_natural_language, get_environment_info,
          list_vulnerabilities, get_kubernetes_events, ...
        """
        if not self.is_running:
            return {"error": "MCP server not running", "mock": True}

        try:
            resp = await self._send("tools/call", {
                "name": tool_name,
                "arguments": arguments,
            })
            result = resp.get("result", {})
            # MCP tools return content array
            content = result.get("content", [])
            if content and isinstance(content, list):
                text_content = next(
                    (c.get("text", "") for c in content if c.get("type") == "text"), ""
                )
                try:
                    return json.loads(text_content) if text_content else result
                except json.JSONDecodeError:
                    return {"text": text_content, "raw": result}
            return result
        except asyncio.TimeoutError:
            logger.error("MCP tool call timed out: %s", tool_name)
            return {"error": "timeout"}
        except Exception as e:
            logger.error("MCP tool call failed (%s): %s", tool_name, e)
            return {"error": str(e)}

    # ─── Dynatrace-specific helpers ──────────────────────────────────────────

    async def execute_dql(self, query: str, timeout_ms: int = 20000) -> dict:
        """Execute a DQL query via MCP."""
        return await self.call_tool("execute_dql", {
            "query": query,
            "requestTimeoutMilliseconds": timeout_ms,
        })

    async def list_problems(self, status: str = "OPEN") -> list[dict]:
        """Get active Dynatrace problems via MCP."""
        result = await self.call_tool("list_problems", {"status": status})
        if isinstance(result, list):
            return result
        return result.get("problems", result.get("items", []))

    async def get_entities(self, entity_type: str = "SERVICE",
                            name_filter: str = "") -> list[dict]:
        """Get Dynatrace entities via MCP."""
        args = {"entityType": entity_type}
        if name_filter:
            args["nameFilter"] = name_filter
        result = await self.call_tool("get_entities", args)
        if isinstance(result, list):
            return result
        return result.get("entities", result.get("items", []))

    async def generate_dql_from_natural_language(self, question: str) -> str:
        """Use Davis AI to convert natural language to DQL via MCP."""
        result = await self.call_tool("generate_dql_from_natural_language", {
            "question": question,
        })
        return result.get("dql", result.get("query", ""))

    async def get_environment_info(self) -> dict:
        """Get Dynatrace environment info via MCP."""
        return await self.call_tool("get_environment_info", {})
