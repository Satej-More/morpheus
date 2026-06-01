#!/usr/bin/env python3
"""
Trigger a demo incident simulation.
Run from project root:  python scripts/simulate_incident.py

The backend must be running on http://localhost:8000
"""
import httpx, sys, time

BASE = "http://localhost:8000"

def main():
    print("Morpheus — Incident Simulation")
    print("=" * 40)

    # Health check
    try:
        r = httpx.get(f"{BASE}/api/v1/health", timeout=5)
        data = r.json()
        print(f"✅ Backend running — agent state: {data.get('agent_state')}")
        print(f"   Gemini available: {data.get('gemini_available', '?')}")
        print(f"   MCP enabled: {data.get('mcp_enabled', '?')}")
    except Exception as e:
        print(f"❌ Backend not reachable at {BASE}")
        print(f"   Error: {e}")
        print(f"\n   Start backend first:")
        print(f"   cd backend && python main.py")
        sys.exit(1)

    print()
    print("Triggering incident simulation...")
    try:
        r = httpx.post(f"{BASE}/api/v1/incidents/simulate", timeout=10)
        data = r.json()
        print(f"✅ Simulation started!")
        print(f"   Problem ID: {data.get('problem_id')}")
        print(f"   Service:    {data.get('service')}")
        print()
        print("Watch the reasoning stream at:")
        print(f"   http://localhost:3000/incidents")
        print()
        print("The agent will now:")
        print("  Step 1 — Query Dynatrace DQL for error logs")
        print("  Step 2 — Check deployment events")
        print("  Step 3 — Analyse JVM heap metrics")
        print("  Step 4 — Search historical incident memory")
        print("  Step 5 — Generate Gemini hypothesis")
        print("  Step 6 — Send Slack alert + create GitHub issue")
        print("  Step 7 — Monitor until resolved (~90 seconds)")
    except Exception as e:
        print(f"❌ Simulation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
