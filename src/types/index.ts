// TruContext Smart City Platform Types

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  permissions: Permission[];
  preferences: UserPreferences;
  lastLogin: string;
  isActive: boolean;
}

export type UserRole = 'admin' | 'operator' | 'analyst' | 'viewer';

export type Permission = 
  | 'read_all' 
  | 'write_all' 
  | 'admin_access' 
  | 'user_management' 
  | 'system_config'
  | 'write_incidents'
  | 'manage_alerts'
  | 'update_status'
  | 'assign_incidents'
  | 'export_data'
  | 'create_reports'
  | 'view_analytics'
  | 'query_data'
  | 'read_public_safety'
  | 'view_incidents'
  | 'view_alerts';

export type DashboardLayout = 'executive' | 'operational' | 'analytical' | 'domain_specific';

export interface UserPreferences {
  theme: 'dark' | 'light';
  dashboardLayout: DashboardLayout;
  notifications: NotificationSettings;
  timezone: string;
  language: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  severityThreshold: AlertSeverity;
}

// Core Data Models
export interface Metrics {
  timestamp: string;
  energyConsumption: number;
  trafficFlow: number;
  airQuality: number;
  infrastructureHealth: number;
  networkLatency: number;
  securityScore: number;
  citizenSatisfaction: number;
  budgetUtilization: number;
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  source: string;
  location?: GeoLocation;
  affectedAssets: string[];
  mitreTactics?: string[];
  correlationId?: string;
  status: AlertStatus;
  assignedTo?: string;
  escalationLevel: number;
  slaDeadline?: string;
  tags: string[];
}

export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type AlertCategory = 
  | 'cybersecurity' 
  | 'infrastructure' 
  | 'traffic' 
  | 'energy' 
  | 'environmental' 
  | 'public_safety' 
  | 'network';

export type AlertStatus = 'open' | 'investigating' | 'resolved' | 'false_positive';

export interface Incident {
  id: string;
  type: IncidentType;
  severity: AlertSeverity;
  status: IncidentStatus;
  location: GeoLocation;
  startTime: string;
  endTime?: string;
  summary: string;
  description: string;
  affectedSystems: string[];
  responders: string[];
  timeline: IncidentEvent[];
  evidence: Evidence[];
  rootCause?: string;
  resolution?: string;
  lessonsLearned?: string[];
  cost?: number;
}

export type IncidentType = 
  | 'cyber_attack' 
  | 'infrastructure_failure' 
  | 'traffic_accident' 
  | 'power_outage' 
  | 'environmental_hazard' 
  | 'public_safety' 
  | 'network_outage';

export type IncidentStatus = 
  | 'reported' 
  | 'investigating' 
  | 'responding' 
  | 'mitigating' 
  | 'resolved' 
  | 'closed';

export interface IncidentEvent {
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export interface Evidence {
  id: string;
  type: 'log' | 'screenshot' | 'video' | 'document' | 'sensor_data';
  filename: string;
  url: string;
  timestamp: string;
  uploadedBy: string;
  hash?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  zone?: string;
}

// Network and Infrastructure
export interface NetworkTopology {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  lastUpdated: string;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: NodeType;
  status: NodeStatus;
  location?: GeoLocation;
  properties: Record<string, any>;
  metrics: NodeMetrics;
}

export type NodeType = 
  | 'router' 
  | 'switch' 
  | 'firewall' 
  | 'sensor' 
  | 'camera' 
  | 'server' 
  | 'controller' 
  | 'gateway';

export type NodeStatus = 'online' | 'offline' | 'warning' | 'critical';

export interface NodeMetrics {
  cpuUsage?: number;
  memoryUsage?: number;
  bandwidth?: number;
  temperature?: number;
  uptime?: number;
  errorRate?: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: 'ethernet' | 'fiber' | 'wireless' | 'cellular';
  bandwidth: number;
  latency: number;
  utilization: number;
  status: 'up' | 'down' | 'degraded';
}

// Dashboard and Visualization
export interface DashboardConfig {
  id: string;
  name: string;
  type: DashboardLayout;
  widgets: Widget[];
  layout: LayoutConfig;
  filters: FilterConfig[];
  refreshInterval: number;
  isDefault: boolean;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  dataSource: string;
  refreshInterval: number;
}

export type WidgetType = 
  | 'metric_card' 
  | 'chart' 
  | 'map' 
  | 'table' 
  | 'alert_feed' 
  | 'topology' 
  | 'gauge' 
  | 'heatmap' 
  | 'timeline';

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  timeRange?: TimeRange;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupBy?: string[];
  filters?: Record<string, any>;
  thresholds?: Threshold[];
  colors?: string[];
}

export interface TimeRange {
  start: string;
  end: string;
  preset?: '1h' | '4h' | '24h' | '7d' | '30d' | 'custom';
}

export interface Threshold {
  value: number;
  color: string;
  label: string;
  operator: '>' | '<' | '>=' | '<=' | '=' | '!=';
}

export interface LayoutConfig {
  columns: number;
  rows: number;
  gap: number;
  responsive: boolean;
}

export interface FilterConfig {
  field: string;
  operator: string;
  value: any;
  label: string;
}

// Analytics and Reporting
export interface AnalyticsQuery {
  id: string;
  name: string;
  description: string;
  query: string;
  parameters: QueryParameter[];
  schedule?: ScheduleConfig;
  outputs: OutputConfig[];
}

export interface QueryParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'enum';
  value: any;
  message: string;
}

export interface ScheduleConfig {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string;
  timezone: string;
  enabled: boolean;
}

export interface OutputConfig {
  type: 'email' | 'webhook' | 'file' | 'dashboard';
  destination: string;
  format: 'json' | 'csv' | 'pdf' | 'html';
  template?: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  type: ReportType;
  generatedAt: string;
  generatedBy: string;
  timeRange: TimeRange;
  data: any;
  metadata: ReportMetadata;
}

export type ReportType = 
  | 'executive_summary' 
  | 'incident_analysis' 
  | 'performance_metrics' 
  | 'security_assessment' 
  | 'compliance_audit' 
  | 'operational_review';

export interface ReportMetadata {
  version: string;
  dataSourcesUsed: string[];
  processingTime: number;
  recordCount: number;
  confidentialityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
}

// API and Integration
export interface ApiEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  authentication: AuthConfig;
  rateLimit: RateLimitConfig;
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2';
  credentials: Record<string, string>;
}

export interface RateLimitConfig {
  requests: number;
  window: number; // seconds
  burst?: number;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  maxBackoffTime: number;
}

// System Configuration
export interface SystemConfig {
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: FeatureFlag[];
  integrations: IntegrationConfig[];
  security: SecurityConfig;
  performance: PerformanceConfig;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: Record<string, any>;
}

export interface IntegrationConfig {
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, any>;
  healthCheck: string;
}

export interface SecurityConfig {
  sessionTimeout: number;
  passwordPolicy: PasswordPolicy;
  mfaRequired: boolean;
  ipWhitelist?: string[];
  auditLogging: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number;
  historyCount: number;
}

export interface PerformanceConfig {
  cacheTimeout: number;
  maxConcurrentRequests: number;
  queryTimeout: number;
  batchSize: number;
  compressionEnabled: boolean;
}

// Real-time Data
export interface DataStream {
  id: string;
  name: string;
  source: string;
  type: DataType;
  schema: DataSchema;
  status: StreamStatus;
  metrics: StreamMetrics;
  lastMessage?: any;
  lastUpdated: string;
}

export type DataType = 
  | 'sensor_telemetry' 
  | 'network_logs' 
  | 'security_events' 
  | 'traffic_data' 
  | 'energy_metrics' 
  | 'environmental_data';

export interface DataSchema {
  fields: SchemaField[];
  version: string;
  encoding: 'json' | 'avro' | 'protobuf';
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required: boolean;
  description?: string;
}

export type StreamStatus = 'active' | 'paused' | 'error' | 'stopped';

export interface StreamMetrics {
  messagesPerSecond: number;
  bytesPerSecond: number;
  errorRate: number;
  latency: number;
  backlog: number;
}
