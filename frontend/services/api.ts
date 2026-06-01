/**
 * API client for Morpheus backend.
 * Uses NEXT_PUBLIC_API_URL env var (defaults to localhost:8000 for local dev).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function fetchIncidents(params?: { limit?: number; status?: string; severity?: string }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.status) query.set('status', params.status);
  if (params?.severity) query.set('severity', params.severity);
  const res = await fetch(`${API_BASE}/api/v1/incidents?${query}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.status}`);
  return res.json();
}

export async function fetchIncident(id: string) {
  const res = await fetch(`${API_BASE}/api/v1/incidents/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Incident not found: ${id}`);
  return res.json();
}

export async function simulateIncident() {
  const res = await fetch(`${API_BASE}/api/v1/incidents/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Simulation failed: ${res.status}`);
  return res.json();
}

export async function fetchAgentStatus() {
  const res = await fetch(`${API_BASE}/api/v1/agent/status`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch agent status`);
  return res.json();
}

export async function startAgent() {
  const res = await fetch(`${API_BASE}/api/v1/agent/start`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to start agent`);
  return res.json();
}

export function getWebSocketUrl(): string {
  const wsBase = API_BASE.replace(/^http/, 'ws');
  return `${wsBase}/ws`;
}
