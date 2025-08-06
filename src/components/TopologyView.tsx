
import type { NetworkTopology, NetworkNode } from "../types";

const nodeTypeStyles: Record<string, string> = {
  router: "bg-info/20 border-info text-info",
  switch: "bg-success/20 border-success text-success",
  server: "bg-warning/20 border-warning text-warning",
  sensor: "bg-purple/20 border-purple text-purple",
  gateway: "bg-alert/20 border-alert text-alert",
  endpoint: "bg-muted/20 border-muted text-muted"
};

const statusStyles: Record<string, string> = {
  online: "border-l-success",
  offline: "border-l-critical",
  warning: "border-l-warning",
  maintenance: "border-l-info"
};

export function TopologyView({ topology }: { topology: NetworkTopology | null }) {
  if (!topology || !topology.nodes || topology.nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center">
        <div className="text-muted">
          <div className="text-4xl mb-2">🌐</div>
          <p>No network topology data</p>
          <p className="text-xs mt-1">Network discovery in progress...</p>
        </div>
      </div>
    );
  }

  const getNodeStyle = (node: NetworkNode) => {
    const typeStyle = nodeTypeStyles[node.type] || nodeTypeStyles.endpoint;
    const statusStyle = statusStyles[node.status] || "";
    return `${typeStyle} ${statusStyle}`;
  };

  const nodesByType = topology.nodes.reduce((acc, node) => {
    if (!acc[node.type]) acc[node.type] = [];
    acc[node.type].push(node);
    return acc;
  }, {} as Record<string, NetworkNode[]>);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-accent pb-3 mb-4">
        <h3 className="font-semibold mb-2">Network Topology</h3>
        <div className="flex items-center gap-4 text-sm text-secondary">
          <span>Nodes: {topology.nodes.length}</span>
          <span>Edges: {topology.edges.length}</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-success rounded-full"></span>
            Online: {topology.nodes.filter(n => n.status === 'online').length}
          </span>
        </div>
      </div>

      {/* Network Overview */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-4">
          {Object.entries(nodesByType).map(([type, nodes]) => (
            <div key={type}>
              <h4 className="font-medium mb-2 capitalize flex items-center gap-2">
                <span>{type}s</span>
                <span className="text-xs bg-tertiary px-2 py-0.5 rounded">
                  {nodes.length}
                </span>
              </h4>
              
              <div className="grid grid-cols-3 gap-2">
                {nodes.slice(0, 9).map(node => (
                  <div 
                    key={node.id} 
                    className={`p-2 rounded border-l-2 text-xs transition-all hover:shadow-sm ${getNodeStyle(node)}`}
                  >
                    <div className="font-medium truncate" title={node.label}>
                      {node.label}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {node.id}
                    </div>
                    {node.location && (
                      <div className="text-xs opacity-60 mt-1">
                        {node.location.zone || 'Unknown Zone'}
                      </div>
                    )}
                  </div>
                ))}
                {nodes.length > 9 && (
                  <div className="p-2 rounded border border-dashed border-accent text-xs text-center text-muted flex items-center justify-center">
                    +{nodes.length - 9} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Health */}
      <div className="border-t border-accent pt-3 mt-4">
        <div className="text-xs text-secondary">
          <div className="flex justify-between mb-1">
            <span>Network Health:</span>
            <span className="text-success">98.5%</span>
          </div>
          <div className="w-full bg-tertiary rounded-full h-1.5">
            <div className="bg-success h-1.5 rounded-full" style={{ width: '98.5%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}