import React from "react";

export interface Graph {
  nodes: { id: string; label: string; group: string }[];
  edges: { source: string; target: string; weight: number }[];
}

export function TopologyView({ graph }: { graph: Graph }) {
  return (
    <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
      <div className="font-medium mb-2">Network Topology (mock)</div>
      <div className="text-xs text-slate-400">
        Nodes: {graph.nodes.length} • Edges: {graph.edges.length}
      </div>
      <div className="mt-2 grid grid-cols-6 gap-2 max-h-40 overflow-auto">
        {graph.nodes.map(node => (
          <div 
            key={node.id} 
            className="px-2 py-1 rounded border border-slate-800 bg-slate-950 text-slate-200 text-xs"
          >
            {node.label}
          </div>
        ))}
      </div>
    </div>
  );
}