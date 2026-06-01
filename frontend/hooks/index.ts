'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { AgentStatus, Incident, SystemHealth } from '../types';
import { mockAgentStatus, mockIncidents, mockSystemHealth, mockReasoningStream } from '../mock/data';

export function useAgentStatus() {
  const [status, setStatus] = useState<AgentStatus>(mockAgentStatus);

  useEffect(() => {
    const tasks = [
      'Validating memory leak hypothesis in payments-api',
      'Running DQL query against Dynatrace Grail…',
      'Correlating deployment events with anomaly timeline',
      'Searching historical incident patterns',
      'Analyzing JVM heap metrics — last 30 minutes',
      'Dispatching resolution notification',
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % tasks.length;
      setStatus(s => ({ ...s, currentTask: tasks[i], confidence: 75 + Math.random() * 20 }));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return status;
}

export function useLiveIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);

  useEffect(() => {
    const interval = setInterval(() => {
      setIncidents(prev => prev.map(inc => {
        if (inc.status === 'resolving') {
          const elapsed = (Date.now() - new Date(inc.detectedAt).getTime()) / 1000;
          return { ...inc, mttrSeconds: Math.floor(elapsed) };
        }
        return inc;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return incidents;
}

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth>(mockSystemHealth);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(prev => ({
        ...prev,
        services: prev.services.map(s => ({
          ...s,
          latency: s.status === 'healthy'
            ? Math.max(1, s.latency + (Math.random() - 0.5) * 10)
            : Math.max(100, s.latency + (Math.random() - 0.5) * 200),
          errorRate: s.status === 'healthy'
            ? Math.max(0, s.errorRate + (Math.random() - 0.5) * 0.2)
            : Math.max(0, s.errorRate + (Math.random() - 0.5) * 2),
        })),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return health;
}

export function useReasoningStream(autoStart = false) {
  const [lines, setLines] = useState<{ text: string; type: string; id: number }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const idRef = useRef(0);

  const start = useCallback(() => {
    setLines([]);
    setIsRunning(true);
    setIsComplete(false);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    mockReasoningStream.forEach(({ delay, text, type }) => {
      const t = setTimeout(() => {
        setLines(prev => [...prev, { text, type, id: idRef.current++ }]);
      }, delay);
      timeoutsRef.current.push(t);
    });

    const lastDelay = mockReasoningStream[mockReasoningStream.length - 1].delay + 800;
    const finalT = setTimeout(() => {
      setIsRunning(false);
      setIsComplete(true);
    }, lastDelay);
    timeoutsRef.current.push(finalT);
  }, []);

  const reset = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    setLines([]);
    setIsRunning(false);
    setIsComplete(false);
  }, []);

  useEffect(() => {
    if (autoStart) {
      const t = setTimeout(start, 1000);
      return () => clearTimeout(t);
    }
  }, [autoStart, start]);

  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

  return { lines, isRunning, isComplete, start, reset };
}

export function useCounter(target: number, duration = 2000) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const steps = 60;
    const stepMs = duration / steps;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setValue(Math.round((current / steps) * target));
      if (current >= steps) clearInterval(interval);
    }, stepMs);
    return () => clearInterval(interval);
  }, [target, duration]);

  return value;
}

export function useLiveTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

export function useElapsedTime(startIso: string) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - new Date(startIso).getTime()) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startIso]);
  return elapsed;
}
