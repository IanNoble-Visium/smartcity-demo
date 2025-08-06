import { useEffect, useMemo, useState } from "react";
import type { Metrics } from "../components/ExecutiveKpis";
import type { Alert } from "../components/AlertsFeed";
import type { Incident } from "../components/IncidentDetail";
import type { Graph } from "../components/TopologyView";

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function useMockRealtime() {
  const [tick, setTick] = useState(0);
  
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1500);
    return () => clearInterval(id);
  }, []);

  const metrics: Metrics = useMemo(() => ({
    energyConsumption: 60 + rand(-5, 5),
    trafficFlow: 0.6 + rand(-0.1, 0.1),
    airQuality: 45 + rand(-10, 10),
    infrastructureHealth: 0.92 + rand(-0.02, 0.01)
  }), [tick]);

  const alerts: Alert[] = useMemo(() => [
    {
      id: "a-" + tick,
      time: new Date().toISOString(),
      severity: (tick % 5 === 0 ? "crit" : (tick % 2 ? "warn" : "info")),
      title: "Event " + tick,
      details: "Mock cross-domain correlation (#" + tick + ")"
    }
  ], [tick]);

  const incidents: Incident[] = useMemo(() => [
    {
      id: "inc-1001",
      type: "Traffic",
      severity: "medium",
      location: [-76.61, 39.29],
      started: new Date(Date.now() - 3600e3).toISOString(),
      summary: "Collision on I-95 causing congestion; adaptive signal plan active."
    },
    {
      id: "inc-1002",
      type: "Cyber Probe",
      severity: "high",
      location: [-76.61, 39.30],
      started: new Date(Date.now() - 1800e3).toISOString(),
      summary: "Suspicious authentication spikes near traffic control VLAN; OT segment isolation check."
    }
  ], [tick]);

  const topology: Graph = useMemo(() => ({
    nodes: Array.from({ length: 18 }).map((_, i) => ({
      id: "n" + i,
      label: (i % 3 ? "Switch-" : "Sensor-") + i,
      group: i % 2 ? "edge" : "core"
    })),
    edges: Array.from({ length: 24 }).map((_, i) => ({
      source: "n" + (i % 10),
      target: "n" + ((i + 7) % 18),
      weight: 1 + (i % 3)
    }))
  }), [tick]);

  return { metrics, alerts, incidents, topology };
}