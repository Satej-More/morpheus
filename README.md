# Morpheus — Autonomous SRE Agent

> **Google Cloud Rapid Agent Hackathon — Dynatrace Track**
> Deadline: June 11, 2026

[![Demo](https://img.shields.io/badge/▶_Watch_Demo-YouTube-FF0000?style=for-the-badge)](https://youtube.com/YOUR_VIDEO_LINK](https://youtu.be/mM0O3Pm51gM?si=b2_v_ZppK9vQlSmb))
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Morpheus reduces Mean Time To Resolution from 38 minutes to under 3 minutes — autonomously.**

---

## What It Does

Morpheus is an autonomous AI SRE agent that:

1. **Detects** production incidents via Dynatrace Problems API (MCP)
2. **Investigates** using real DQL queries through `@dynatrace-oss/dynatrace-mcp-server`
3. **Correlates** deployment events with incident onset
4. **Remembers** patterns from 20+ historical incidents (MongoDB)
5. **Hypothesises** root causes using Gemini 2.5 Flash with confidence scoring
6. **Acts** — Slack notification + GitHub issue with full forensic context
7. **Monitors** until metrics normalize, then auto-resolves

---

## Dynatrace MCP Integration

Morpheus uses the **official Dynatrace MCP Server** as its primary data layer:

```
Morpheus Agent → JSON-RPC 2.0 (stdio) → npx @dynatrace-oss/dynatrace-mcp-server → Dynatrace
```

| MCP Tool | Used For |
|----------|----------|
| `execute_dql` | Error logs, latency, heap metrics, deployment events |
| `list_problems` | Detect OPEN problems every 60s |
| `get_entities` | Service topology and blast radius |
| `generate_dql_from_natural_language` | Davis AI: questions → DQL |

Graceful fallback to REST API if Node.js/npx unavailable.

---

## Quick Start

```bash
# 1. Copy and fill in your keys
cp backend/.env.example backend/.env  # or just edit backend/.env directly

# 2. Start MongoDB
docker run -d --name morpheus-mongo -p 27017:27017 mongo:7.0

# 3. Start backend (new terminal)
cd backend && pip install -r requirements.txt && python main.py

# 4. Seed historical data (new terminal)
python scripts/seed_demo_data.py

# 5. Start frontend (new terminal)
cd frontend && npm install && npm run dev

# 6. Trigger a demo incident
python scripts/simulate_incident.py
```

Dashboard: http://localhost:3000/incidents  
Backend API: http://localhost:8000/docs  
Diagnostics: http://localhost:8000/api/v1/diagnostics

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Reasoning | Gemini 2.5 Flash (google-generativeai) |
| Observability | Dynatrace MCP Server + REST API |
| Memory | MongoDB Atlas (Motor async driver) |
| Backend | Python 3.12 + FastAPI + WebSockets |
| Frontend | Next.js 14 + TypeScript + Tailwind |
| Notifications | Slack Webhooks + GitHub Issues API |
| Deployment | Docker + Google Cloud Run |

---

## Required API Keys

See `backend/.env` — all keys needed:
- `GOOGLE_API_KEY` — Gemini (free at [ai.google.dev](https://ai.google.dev))
- `DYNATRACE_API_URL` + `DYNATRACE_API_TOKEN` — your Dynatrace environment
- `MONGODB_URI` — Atlas free tier or local Docker
- `GITHUB_TOKEN` + `GITHUB_REPO` — for auto issue creation
- `SLACK_WEBHOOK_URL` — for notifications

---

## License

MIT — see [LICENSE](LICENSE)
