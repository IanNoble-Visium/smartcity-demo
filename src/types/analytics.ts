// Advanced Analytics and Reporting Types
export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  unit: string;
  category: 'performance' | 'security' | 'infrastructure' | 'environmental' | 'financial';
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  timestamp: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'gauge' | 'treemap';
  title: string;
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  interactive?: boolean;
  drillDown?: DrillDownConfig;
}

export interface DrillDownConfig {
  enabled: boolean;
  levels: DrillDownLevel[];
}

export interface DrillDownLevel {
  field: string;
  label: string;
  aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min';
}

export interface AnalyticsQuery {
  id: string;
  name: string;
  description: string;
  sql?: string;
  filters: QueryFilter[];
  groupBy: string[];
  orderBy: string[];
  limit?: number;
  timeRange: TimeRange;
  refreshInterval: number;
}

export interface QueryFilter {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'like' | 'between';
  value: any;
  type: 'string' | 'number' | 'date' | 'boolean';
}

export interface TimeRange {
  start: string;
  end: string;
  preset?: '15m' | '1h' | '4h' | '24h' | '7d' | '30d' | '90d' | 'custom';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'executive' | 'operational' | 'compliance' | 'incident' | 'performance';
  sections: ReportSection[];
  schedule?: ReportSchedule;
  recipients: string[];
  format: 'pdf' | 'html' | 'csv' | 'excel';
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'text' | 'kpi' | 'image';
  config: any;
  dataSource: string;
  order: number;
}

export interface ReportSchedule {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone: string;
  enabled: boolean;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'linear_regression' | 'time_series' | 'anomaly_detection' | 'classification';
  status: 'training' | 'ready' | 'error' | 'updating';
  accuracy?: number;
  lastTrained: string;
  features: string[];
  target: string;
  predictions: Prediction[];
}

export interface Prediction {
  timestamp: string;
  value: number;
  confidence: number;
  bounds: {
    lower: number;
    upper: number;
  };
}

export interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  formula: string;
  unit: string;
  target: number;
  thresholds: {
    excellent: number;
    good: number;
    warning: number;
    critical: number;
  };
  category: string;
  owner: string;
  updateFrequency: string;
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description: string;
  widgets: AnalyticsWidget[];
  layout: DashboardLayout;
  filters: GlobalFilter[];
  timeRange: TimeRange;
  refreshInterval: number;
  isPublic: boolean;
  owner: string;
  tags: string[];
}

export interface AnalyticsWidget {
  id: string;
  title: string;
  type: 'chart' | 'kpi' | 'table' | 'text' | 'image' | 'video';
  position: { x: number; y: number; w: number; h: number };
  config: ChartConfig | KPIConfig | TableConfig;
  dataSource: string;
  refreshInterval: number;
}

export interface KPIConfig {
  metric: string;
  showTrend: boolean;
  showSparkline: boolean;
  format: 'number' | 'percentage' | 'currency' | 'duration';
  precision: number;
}

export interface TableConfig {
  columns: TableColumn[];
  sortable: boolean;
  filterable: boolean;
  paginated: boolean;
  pageSize: number;
  exportable: boolean;
}

export interface TableColumn {
  field: string;
  header: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'action';
  sortable: boolean;
  filterable: boolean;
  width?: number;
  format?: string;
}

export interface DashboardLayout {
  cols: number;
  rows: number;
  margin: [number, number];
  containerPadding: [number, number];
  rowHeight: number;
  isDraggable: boolean;
  isResizable: boolean;
}

export interface GlobalFilter {
  id: string;
  field: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'number';
  options?: FilterOption[];
  defaultValue?: any;
}

export interface FilterOption {
  label: string;
  value: any;
}

export interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'png' | 'svg';
  filename?: string;
  includeFilters: boolean;
  includeTimestamp: boolean;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'A3' | 'letter' | 'legal';
}

export interface AnalyticsAlert {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  actions: AlertAction[];
  enabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '=' | '!=';
  threshold: number;
  timeWindow: string;
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'notification' | 'incident';
  config: any;
}