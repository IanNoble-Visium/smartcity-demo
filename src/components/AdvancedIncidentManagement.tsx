import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useDataStore, useUIStore } from '../store';
import { ContextualVideoBackground } from './VideoBackground';
import type { Incident, Evidence } from '../types';

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
  const { incidents } = useDataStore();
  const { addNotification } = useUIStore();
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workflows' | 'evidence' | 'collaboration' | 'analytics'>('workflows');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');

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

  // Workflow Timeline Component
  const WorkflowTimeline = ({ workflow }: { workflow: IncidentWorkflow }) => (
    <div className="card">
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
    <div className="card">
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
    <div className="card">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    <div className={`advanced-incident-management ${className}`}>
      {/* Video Background */}
      <ContextualVideoBackground 
        context="emergency_response"
        className="absolute inset-0 -z-10"
        overlayOpacity={0.85}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
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

      {/* Tab Navigation */}
      <div className="relative z-10 bg-secondary border border-secondary rounded-lg p-1 mb-6 inline-flex">
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

      {/* Content based on active tab */}
      <div className="relative z-10">
        {activeTab === 'workflows' && (
          <div className="space-y-6">
            {incidentWorkflows.map((workflow) => (
              <WorkflowTimeline key={workflow.id} workflow={workflow} />
            ))}
          </div>
        )}
        
        {activeTab === 'evidence' && <EvidenceManagement />}
        {activeTab === 'collaboration' && <CollaborationTools />}
        {activeTab === 'analytics' && <IncidentAnalytics />}
      </div>
    </div>
  );
}