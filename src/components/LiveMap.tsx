import React from "react";
import type { Incident } from "./IncidentDetail";

export function LiveMap({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="bg-slate-900 rounded-lg p-2 border border-slate-800 h-full">
      <div className="font-medium px-2 py-1">City Map (placeholder)</div>
      <div className="relative h-80 bg-slate-950 rounded border border-slate-800 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <div className="text-lg mb-2">🗺️</div>
          <div>MapLibre/deck.gl would render here</div>
          <div className="text-xs mt-2">Interactive 3D city visualization</div>
        </div>
        <div className="absolute bottom-2 left-2 text-xs bg-slate-900/70 px-2 py-1 rounded">
          Incidents: {incidents.length}
        </div>
        <div className="absolute top-2 right-2 text-xs bg-slate-900/70 px-2 py-1 rounded">
          Baltimore, MD
        </div>
      </div>
    </div>
  );
}