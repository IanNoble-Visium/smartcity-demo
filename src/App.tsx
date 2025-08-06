import React from "react";
import "./index.css";
import { ExecutiveKpis } from "./components/ExecutiveKpis";
import { LiveMap } from "./components/LiveMap";
import { AlertsFeed } from "./components/AlertsFeed";
import { EnergyPanel } from "./components/EnergyPanel";
import { TopologyView } from "./components/TopologyView";
import { IncidentDetail } from "./components/IncidentDetail";
import { useMockRealtime } from "./mock/useMockRealtime";

export default function App(){
  const { metrics, alerts, incidents, topology } = useMockRealtime();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Unified Smart City Operations Demo</h1>
        <span className="text-xs text-slate-400">Visium TruContext • Mock Data</span>
      </header>
      <main className="p-4 grid grid-cols-12 gap-4">
        <section className="col-span-12"><ExecutiveKpis metrics={metrics}/></section>
        <section className="col-span-8 row-span-2"><LiveMap incidents={incidents}/></section>
        <aside className="col-span-4 row-span-2"><AlertsFeed alerts={alerts}/></aside>
        <section className="col-span-6"><EnergyPanel metrics={metrics}/></section>
        <section className="col-span-6"><TopologyView graph={topology}/></section>
        <section className="col-span-12"><IncidentDetail incident={incidents[0]}/></section>
      </main>
    </div>
  );
}
