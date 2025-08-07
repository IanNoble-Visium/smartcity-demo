import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ContextualVideoBackground } from './VideoBackground';
import type { Evidence } from '../types';
import { useMockRealtime } from '../mock/useMockRealtime';

interface AdvancedIncidentManagementProps {
  className?: string;
}

interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  assignedTo?: string;
  estimatedDuration: number;
  actualDuration?: number;
  dependencies: string[];
  automationLevel: 'manual' | 'semi_automated' | 'fully_automated';
  slaDeadline: string;
}

interface IncidentWorkflow {
  id: string;
  incidentId: string;
  name: string;
  type: 'standard' | 'emergency' | 'security' | 'infrastructure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  stages: WorkflowStage[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  escalationRules: EscalationRule[];
}

interface EscalationRule {
  id: string;
  condition: string;
  action: 'notify' | 'reassign' | 'escalate' | 'auto_resolve';
  target: string;
  delay: number;
  enabled: boolean;
}

interface CollaborationTool {
  id: string;
  type: 'chat' | 'video_call' | 'document_share' | 'whiteboard';
  name: string;
  participants: string[];
  status: 'active' | 'inactive';
  lastActivity: string;
}

export function AdvancedIncidentManagement({ className = '' }: AdvancedIncidentManagementProps) {
  const [activeTab, setActiveTab] = useState<'workflows' | 'evidence' | 'collaboration' | 'analytics'>('workflows');
  const { incidents, alerts, lastUpdated, isConnected } = useMockRealtime();
  
  // UI state for filtering/sorting and selection
  const [severityFilter, setSeverityFilter] = useState<('low' | 'medium' | 'high' | 'critical')[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<('reported' | 'investigating' | 'responding' | 'mitigating')[] | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'severity'>('time');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);
  
  // Mount animation/load state (prevents perceived refresh loop by stabilizing initial render)
  useEffect(() => {
    let timeoutId: number | undefined = undefined as any;
    try {
      setIsLoading(true);
      timeoutId = window.setTimeout(() => setIsLoading(false), 500);
    } catch (e: any) {
      setHasError(e?.message || 'Failed to initialize');
      setIsLoading(false);
    }
    return () => clearTimeout(timeoutId);
  }, []);

  // Mock incident workflows
  const incidentWorkflows = useMemo((): IncidentWorkflow[] => [
    {
      id: 'wf-001',
      incidentId: 'inc-001',
      name: 'Cybersecurity Incident Response',
      type: 'security',
      priority: 'critical',
      status: 'active',
      stages: [
        {
          id: 'stage-001',
          name: 'Initial Assessment',
          description: 'Evaluate threat scope and impact',
          status: 'completed',
          assignedTo: 'security.analyst@city.gov',
          estimatedDuration: 30,
          actualDuration: 25,
          dependencies: [],
          automationLevel: 'semi_automated',
          slaDeadline: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        },
        {
          id: 'stage-002',
          name: 'Containment',
          description: 'Isolate affected systems',
          status: 'active',
          assignedTo: 'network.admin@city.gov',
          estimatedDuration: 60,
          dependencies: ['stage-001'],
          automationLevel: 'manual',
          slaDeadline: new Date(Date.now() + 90 * 60 * 1000).toISOString()
        },
        {
          id: 'stage-003',
          name: 'Evidence Collection',
          description: 'Gather forensic evidence',
          status: 'pending',
          assignedTo: 'forensics.team@city.gov',
          estimatedDuration: 120,
          dependencies: ['stage-002'],
          automationLevel: 'semi_automated',
          slaDeadline: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'stage-004',
          name: 'Recovery',
          description: 'Restore normal operations',
          status: 'pending',
          assignedTo: 'it.operations@city.gov',
          estimatedDuration: 180,
          dependencies: ['stage-003'],
          automationLevel: 'manual',
          slaDeadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      createdBy: 'incident.commander@city.gov',
      escalationRules: [
        {
          id: 'esc-001',
          condition: 'stage_overdue',
          action: 'escalate',
          target: 'chief.security@city.gov',
          delay: 30,
          enabled: true
        }
      ]
    },
    {
      id: 'wf-002',
      incidentId: 'inc-002',
      name: 'Infrastructure Failure Response',
      type: 'infrastructure',
      priority: 'high',
      status: 'active',
      stages: [
        {
          id: 'stage-005',
          name: 'Damage Assessment',
          description: 'Evaluate infrastructure damage',
          status: 'completed',
          assignedTo: 'field.engineer@city.gov',
          estimatedDuration: 45,
          actualDuration: 40,
          dependencies: [],
          automationLevel: 'manual',
          slaDeadline: new Date(Date.now() + 45 * 60 * 1000).toISOString()
        },
        {
          id: 'stage-006',
          name: 'Emergency Repairs',
          description: 'Implement temporary fixes',
          status: 'active',
          assignedTo: 'repair.crew@city.gov',
          estimatedDuration: 240,
          dependencies: ['stage-005'],
          automationLevel: 'manual',
          slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      createdBy: 'operations.manager@city.gov',
      escalationRules: []
    }
  ], []);

  // Mock evidence items
  const evidenceItems = useMemo((): Evidence[] => [
    {
      id: 'ev-001',
      type: 'log',
      filename: 'firewall_logs_20250106.txt',
      url: '/evidence/firewall_logs_20250106.txt',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      uploadedBy: 'security.analyst@city.gov',
      hash: 'sha256:a1b2c3d4e5f6...'
    },
    {
      id: 'ev-002',
      type: 'screenshot',
      filename: 'network_topology_anomaly.png',
      url: '/evidence/network_topology_anomaly.png',
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      uploadedBy: 'network.admin@city.gov',
      hash: 'sha256:f6e5d4c3b2a1...'
    },
    {
      id: 'ev-003',
      type: 'sensor_data',
      filename: 'traffic_sensor_data.json',
      url: '/evidence/traffic_sensor_data.json',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      uploadedBy: 'field.engineer@city.gov',
      hash: 'sha256:1a2b3c4d5e6f...'
    }
  ], []);

  // Mock collaboration tools
  const collaborationTools = useMemo((): CollaborationTool[] => [
    {
      id: 'collab-001',
      type: 'chat',
      name: 'Incident Response Team Chat',
      participants: ['security.analyst@city.gov', 'network.admin@city.gov', 'incident.commander@city.gov'],
      status: 'active',
      lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 'collab-002',
      type: 'video_call',
      name: 'Emergency Response Briefing',
      participants: ['operations.manager@city.gov', 'field.engineer@city.gov', 'repair.crew@city.gov'],
      status: 'active',
      lastActivity: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 'collab-003',
      type: 'document_share',
      name: 'Incident Documentation',
      participants: ['incident.commander@city.gov', 'forensics.team@city.gov'],
      status: 'inactive',
      lastActivity: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    }
  ], []);

  // Derived incident list with filters/sorting; memoized to avoid unnecessary re-renders
  const filteredIncidents = useMemo(() => {
    try {
      const base = incidents || [];
      let result = base;
      if (severityFilter && severityFilter.length) {
        result = result.filter(i => severityFilter.includes(i.severity as any));
      }
      if (statusFilter && statusFilter.length) {
        result = result.filter(i => statusFilter.includes(i.status as any));
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        result = result.filter(i => i.summary.toLowerCase().includes(q) || i.type.toLowerCase().includes(q));
      }
      if (sortBy === 'severity') {
        const rank: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
        result = [...result].sort((a, b) => (rank[b.severity] - rank[a.severity]));
      } else {
        result = [...result].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      }
      return result;
    } catch (e) {
      setHasError('Failed to process incidents');
      return [];
    }
  }, [incidents, severityFilter, statusFilter, search, sortBy]);

  // Ensure a selected incident stays valid
  useEffect(() => {
    if (selectedIncidentId && !filteredIncidents.some(i => i.id === selectedIncidentId)) {
      setSelectedIncidentId(filteredIncidents[0]?.id || null);
    } else if (!selectedIncidentId && filteredIncidents.length) {
      setSelectedIncidentId(filteredIncidents[0].id);
    }
  }, [filteredIncidents, selectedIncidentId]);

  // Workflow Timeline Component
  const WorkflowTimeline = ({ workflow }: { workflow: IncidentWorkflow }) => (
    <div className="card h-full min-h-0 overflow-auto">
      <div className="card-header">
        <h3 className="card-title">{workflow.name}</h3>
        <div className="flex items-center gap-2">
          <span className={`status-indicator ${
            workflow.priority === 'critical' ? 'status-error' :
            workflow.priority === 'high' ? 'status-warning' :
            workflow.priority === 'medium' ? 'status-info' : 'status-success'
          }`}>
            {workflow.priority}
          </span>
          <span className="text-xs text-muted">{workflow.type}</span>
        </div>
      </div>
      
      <div className="card-content">
        <div className="space-y-4">
          {workflow.stages.map((stage, index) => (
            <motion.div
              key={stage.id}
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  stage.status === 'completed' ? 'bg-success border-success' :
                  stage.status === 'active' ? 'bg-primary border-primary animate-pulse' :
                  stage.status === 'pending' ? 'bg-secondary border-muted' : 'bg-muted border-muted'
                }`} />
                {index < workflow.stages.length - 1 && (
                  <div className="w-0.5 h-8 bg-secondary mt-2" />
                )}
              </div>
              
              {/* Stage content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{stage.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      stage.automationLevel === 'fully_automated' ? 'bg-success/20 text-success' :
                      stage.automationLevel === 'semi_automated' ? 'bg-warning/20 text-warning' : 'bg-info/20 text-info'
                    }`}>
                      {stage.automationLevel.replace('_', ' ')}
                    </span>
                    {stage.assignedTo && (
                      <span className="text-xs text-muted">{stage.assignedTo.split('@')[0]}</span>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-muted mb-2">{stage.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted">Estimated:</span>
                    <span className="ml-2 font-medium">{stage.estimatedDuration}min</span>
                  </div>
                  {stage.actualDuration && (
                    <div>
                      <span className="text-muted">Actual:</span>
                      <span className="ml-2 font-medium">{stage.actualDuration}min</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted">SLA:</span>
                    <span className="ml-2 font-medium">
                      {new Date(stage.slaDeadline).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Dependencies:</span>
                    <span className="ml-2 font-medium">{stage.dependencies.length}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // Evidence Management Component
  const EvidenceManagement = () => (
    <div className="card h-full min-h-0 overflow-auto">
      <div className="card-header">
        <h3 className="card-title">Evidence Chain of Custody</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{evidenceItems.length} items</span>
          <button className="btn btn-primary text-xs">
            Add Evidence
          </button>
        </div>
      </div>
      
      <div className="card-content">
        <div className="space-y-3">
          {evidenceItems.map((evidence) => (
            <div key={evidence.id} className="p-3 bg-secondary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    evidence.type === 'log' ? 'bg-info' :
                    evidence.type === 'screenshot' ? 'bg-warning' :
                    evidence.type === 'video' ? 'bg-success' :
                    evidence.type === 'document' ? 'bg-primary' : 'bg-muted'
                  }`} />
                  <span className="font-medium">{evidence.filename}</span>
                </div>
                <span className="text-xs text-muted capitalize">{evidence.type}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                <div>
                  <span className="text-muted">Uploaded by:</span>
                  <span className="ml-2 font-medium">{evidence.uploadedBy.split('@')[0]}</span>
                </div>
                <div>
                  <span className="text-muted">Timestamp:</span>
                  <span className="ml-2 font-medium">
                    {new Date(evidence.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="text-xs">
                <span className="text-muted">Hash:</span>
                <span className="ml-2 font-mono text-primary">{evidence.hash}</span>
              </div>
              
              <div className="flex gap-2 mt-3">
                <button className="btn btn-ghost text-xs">Download</button>
                <button className="btn btn-ghost text-xs">Verify</button>
                <button className="btn btn-ghost text-xs">Share</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Collaboration Tools Component
  const CollaborationTools = () => (
    <div className="card h-full min-h-0 overflow-auto">
      <div className="card-header">
        <h3 className="card-title">Cross-Department Collaboration</h3>
        <span className="text-xs text-muted">{collaborationTools.filter(t => t.status === 'active').length} active sessions</span>
      </div>
      
      <div className="card-content">
        <div className="space-y-3">
          {collaborationTools.map((tool) => (
            <div key={tool.id} className="p-3 bg-secondary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    tool.status === 'active' ? 'bg-success animate-pulse' : 'bg-muted'
                  }`} />
                  <span className="font-medium">{tool.name}</span>
                </div>
                <span className="text-xs text-muted capitalize">{tool.type.replace('_', ' ')}</span>
              </div>
              
              <div className="text-xs text-muted mb-2">
                {tool.participants.length} participants: {tool.participants.map(p => p.split('@')[0]).join(', ')}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">
                  Last activity: {new Date(tool.lastActivity).toLocaleTimeString()}
                </span>
                <div className="flex gap-2">
                  <button className="btn btn-ghost text-xs">Join</button>
                  {tool.status === 'active' && (
                    <button className="btn btn-primary text-xs">Active</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t border-secondary mt-4">
          <button className="btn btn-primary text-xs w-full">
            Start New Collaboration Session
          </button>
        </div>
      </div>
    </div>
  );

  // Analytics Component
  const IncidentAnalytics = () => {
    const workflowMetrics = {
      totalWorkflows: incidentWorkflows.length,
      activeWorkflows: incidentWorkflows.filter(w => w.status === 'active').length,
      avgResolutionTime: 4.2,
      slaCompliance: 94.5
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Workflow Performance</h3>
          </div>
          
          <div className="card-content">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary rounded-lg">
                <div className="text-sm text-muted">Active Workflows</div>
                <div className="text-2xl font-bold text-primary">{workflowMetrics.activeWorkflows}</div>
              </div>
              
              <div className="p-3 bg-secondary rounded-lg">
                <div className="text-sm text-muted">Total Workflows</div>
                <div className="text-2xl font-bold text-info">{workflowMetrics.totalWorkflows}</div>
              </div>
              
              <div className="p-3 bg-secondary rounded-lg">
                <div className="text-sm text-muted">Avg Resolution</div>
                <div className="text-2xl font-bold text-success">{workflowMetrics.avgResolutionTime}h</div>
              </div>
              
              <div className="p-3 bg-secondary rounded-lg">
                <div className="text-sm text-muted">SLA Compliance</div>
                <div className="text-2xl font-bold text-warning">{workflowMetrics.slaCompliance}%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Automation Impact</h3>
          </div>
          
          <div className="card-content">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <div className="font-medium">Fully Automated Stages</div>
                  <div className="text-xs text-muted">No human intervention required</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-success">23%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <div className="font-medium">Semi-Automated Stages</div>
                  <div className="text-xs text-muted">Human oversight with automation</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-warning">45%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <div className="font-medium">Manual Stages</div>
                  <div className="text-xs text-muted">Full human control required</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-info">32%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`advanced-incident-management h-full min-h-0 overflow-hidden flex flex-col ${className}`}>
      {/* Video Background */}
      <ContextualVideoBackground
        context="emergency_response"
        className="absolute inset-0 -z-10"
        overlayOpacity={0.6}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-2 pb-3">
        <div>
          <h2 className="text-2xl font-bold text-primary">Advanced Incident Management Workflows</h2>
          <p className="text-muted">Multi-stage response protocols, evidence management, and cross-department collaboration</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost text-xs">
            Create Workflow
          </button>
          <button className="btn btn-primary text-xs">
            Emergency Protocol
          </button>
        </div>
      </div>

      {/* Status + Filters Row */}
      <div className="relative z-10 flex items-center justify-between px-2 pb-2">
        <div className="flex items-center gap-3 text-xs">
          <span className={`px-2 py-1 rounded ${isConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          <span className="text-muted">Last updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incidents" className="px-2 py-1 text-xs rounded bg-secondary border border-secondary" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-2 py-1 text-xs rounded bg-secondary border border-secondary">
            <option value="time">Sort: Time</option>
            <option value="severity">Sort: Severity</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 bg-secondary border border-secondary rounded-lg p-1 mx-2 mb-2 inline-flex self-start">
        {(['workflows', 'evidence', 'collaboration', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 text-xs rounded transition-all ${
              activeTab === tab ? 'bg-primary text-white' : 'text-muted hover:text-primary'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content grid - single viewport, no outer scroll */}
      <div className="relative z-10 grid grid-cols-12 gap-3 p-2 flex-1 min-h-0 overflow-hidden">
        {/* Left: Workflows/Analytics content with internal scroll */}
        <div className="col-span-8 min-h-0 overflow-hidden">
          {isLoading && (
            <div className="card h-full flex items-center justify-center">
              <div className="text-muted text-sm">Loading Incident Management...</div>
            </div>
          )}
          {!isLoading && hasError && (
            <div className="card h-full flex items-center justify-center">
              <div className="text-rose-300 text-sm">{hasError}</div>
            </div>
          )}
          {!isLoading && !hasError && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-full min-h-0 overflow-hidden">
              {activeTab === 'workflows' && (
                <div className="h-full min-h-0 overflow-auto space-y-4 pr-1">
                  {incidentWorkflows.map((workflow) => (
                    <WorkflowTimeline key={workflow.id} workflow={workflow} />
                  ))}
                </div>
              )}
              {activeTab === 'evidence' && <EvidenceManagement />}
              {activeTab === 'collaboration' && <CollaborationTools />}
              {activeTab === 'analytics' && <IncidentAnalytics />}
            </motion.div>
          )}
        </div>

        {/* Right: Live incidents panel */}
        <div className="col-span-4 min-h-0 overflow-hidden">
          <div className="card h-full min-h-0 flex flex-col">
            <div className="card-header">
              <h3 className="card-title">Live Incidents</h3>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost text-xs" onClick={() => setSeverityFilter(null)}>Clear</button>
                <select className="px-2 py-1 text-xs rounded bg-secondary border border-secondary" onChange={(e) => setSeverityFilter(e.target.value ? [e.target.value as any] : null)}>
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="card-content flex-1 min-h-0 overflow-auto">
              {filteredIncidents.map((i) => (
                <motion.div key={i.id} className={`p-3 rounded-lg mb-2 cursor-pointer border ${selectedIncidentId === i.id ? 'border-primary bg-secondary' : 'border-secondary bg-secondary'}`} onClick={() => setSelectedIncidentId(i.id)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{i.summary}</div>
                    <span className={`text-xs px-2 py-1 rounded capitalize ${i.severity === 'critical' ? 'bg-rose-500/20 text-rose-300' : i.severity === 'high' ? 'bg-amber-500/20 text-amber-300' : i.severity === 'medium' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>{i.severity}</span>
                  </div>
                  <div className="text-xs text-muted">{i.type.replace('_',' ')} • {new Date(i.startTime).toLocaleTimeString()}</div>
                  {selectedIncidentId === i.id && (
                    <div className="mt-2 flex gap-2">
                      <button className="btn btn-primary text-xs">Acknowledge</button>
                      <button className="btn btn-ghost text-xs">Assign</button>
                      <button className="btn btn-ghost text-xs">Escalate</button>
                      <button className="btn btn-ghost text-xs">Resolve</button>
                    </div>
                  )}
                </motion.div>
              ))}
              {filteredIncidents.length === 0 && (
                <div className="text-xs text-muted">No incidents match current filters.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}