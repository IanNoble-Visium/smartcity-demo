// TruContext Smart City Platform State Management
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { 
  User, 
  Metrics, 
  Alert, 
  Incident, 
  NetworkTopology, 
  DashboardLayout,
  DataStream,
  SystemConfig
} from '../types';

// Authentication Store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  permissions: string[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (preferences: Partial<User['preferences']>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  permissions: [],
  
  login: async (email: string, password: string) => {
    // Mock authentication - replace with actual API call
    const mockUser: User = {
      id: 'user-001',
      name: 'Sarah Chen',
      email: email,
      role: 'operations_manager',
      department: 'Smart City Operations',
      permissions: [
        { resource: 'dashboards', actions: ['read', 'write'] },
        { resource: 'incidents', actions: ['read', 'write'] },
        { resource: 'alerts', actions: ['read', 'write'] },
        { resource: 'reports', actions: ['read'] }
      ],
      preferences: {
        theme: 'dark',
        dashboardLayout: {
          id: 'default-ops',
          name: 'Operations Dashboard',
          type: 'operational',
          widgets: [],
          layout: { columns: 12, rows: 8, gap: 16, responsive: true },
          filters: [],
          refreshInterval: 30000,
          isDefault: true
        },
        notifications: {
          email: true,
          push: true,
          sms: false,
          severityThreshold: 'medium'
        },
        timezone: 'America/New_York',
        language: 'en-US'
      },
      lastLogin: new Date().toISOString(),
      isActive: true
    };

    set({
      user: mockUser,
      isAuthenticated: true,
      permissions: mockUser.permissions.flatMap(p => 
        p.actions.map(action => `${p.resource}:${action}`)
      )
    });
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      permissions: []
    });
  },

  updatePreferences: (preferences) => {
    const { user } = get();
    if (user) {
      set({
        user: {
          ...user,
          preferences: { ...user.preferences, ...preferences }
        }
      });
    }
  }
}));

// Real-time Data Store
interface DataState {
  metrics: Metrics | null;
  alerts: Alert[];
  incidents: Incident[];
  networkTopology: NetworkTopology | null;
  dataStreams: DataStream[];
  lastUpdated: string;
  isConnected: boolean;
  updateMetrics: (metrics: Metrics) => void;
  addAlert: (alert: Alert) => void;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  addIncident: (incident: Incident) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  updateTopology: (topology: NetworkTopology) => void;
  setConnectionStatus: (connected: boolean) => void;
}

export const useDataStore = create<DataState>()(
  subscribeWithSelector((set, get) => ({
    metrics: null,
    alerts: [],
    incidents: [],
    networkTopology: null,
    dataStreams: [],
    lastUpdated: new Date().toISOString(),
    isConnected: false,

    updateMetrics: (metrics) => {
      set({
        metrics,
        lastUpdated: new Date().toISOString()
      });
    },

    addAlert: (alert) => {
      const { alerts } = get();
      set({
        alerts: [alert, ...alerts].slice(0, 100), // Keep last 100 alerts
        lastUpdated: new Date().toISOString()
      });
    },

    updateAlert: (id, updates) => {
      const { alerts } = get();
      set({
        alerts: alerts.map(alert => 
          alert.id === id ? { ...alert, ...updates } : alert
        ),
        lastUpdated: new Date().toISOString()
      });
    },

    addIncident: (incident) => {
      const { incidents } = get();
      set({
        incidents: [incident, ...incidents],
        lastUpdated: new Date().toISOString()
      });
    },

    updateIncident: (id, updates) => {
      const { incidents } = get();
      set({
        incidents: incidents.map(incident => 
          incident.id === id ? { ...incident, ...updates } : incident
        ),
        lastUpdated: new Date().toISOString()
      });
    },

    updateTopology: (topology) => {
      set({
        networkTopology: topology,
        lastUpdated: new Date().toISOString()
      });
    },

    setConnectionStatus: (connected) => {
      set({ isConnected: connected });
    }
  }))
);

// Dashboard Store
interface DashboardState {
  currentDashboard: DashboardLayout | null;
  availableDashboards: DashboardLayout[];
  filters: Record<string, any>;
  timeRange: { start: string; end: string };
  refreshInterval: number;
  isAutoRefresh: boolean;
  setCurrentDashboard: (dashboard: DashboardLayout) => void;
  updateFilters: (filters: Record<string, any>) => void;
  setTimeRange: (start: string, end: string) => void;
  setRefreshInterval: (interval: number) => void;
  toggleAutoRefresh: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  currentDashboard: null,
  availableDashboards: [],
  filters: {},
  timeRange: {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  },
  refreshInterval: 30000,
  isAutoRefresh: true,

  setCurrentDashboard: (dashboard) => {
    set({ currentDashboard: dashboard });
  },

  updateFilters: (filters) => {
    const { filters: currentFilters } = get();
    set({ filters: { ...currentFilters, ...filters } });
  },

  setTimeRange: (start, end) => {
    set({ timeRange: { start, end } });
  },

  setRefreshInterval: (interval) => {
    set({ refreshInterval: interval });
  },

  toggleAutoRefresh: () => {
    const { isAutoRefresh } = get();
    set({ isAutoRefresh: !isAutoRefresh });
  }
}));

// UI State Store
interface UIState {
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  loading: Record<string, boolean>;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>;
  modals: Record<string, { open: boolean; data?: any }>;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setLoading: (key: string, loading: boolean) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  openModal: (modalId: string, data?: any) => void;
  closeModal: (modalId: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  theme: 'dark',
  loading: {},
  notifications: [],
  modals: {},

  toggleSidebar: () => {
    const { sidebarOpen } = get();
    set({ sidebarOpen: !sidebarOpen });
  },

  setTheme: (theme) => {
    set({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  },

  setLoading: (key, loading) => {
    const { loading: currentLoading } = get();
    set({
      loading: { ...currentLoading, [key]: loading }
    });
  },

  addNotification: (notification) => {
    const { notifications } = get();
    const newNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    set({
      notifications: [newNotification, ...notifications].slice(0, 50)
    });
  },

  markNotificationRead: (id) => {
    const { notifications } = get();
    set({
      notifications: notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    });
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  openModal: (modalId, data) => {
    const { modals } = get();
    set({
      modals: { ...modals, [modalId]: { open: true, data } }
    });
  },

  closeModal: (modalId) => {
    const { modals } = get();
    set({
      modals: { ...modals, [modalId]: { open: false } }
    });
  }
}));

// System Configuration Store
interface SystemState {
  config: SystemConfig | null;
  health: Record<string, 'healthy' | 'warning' | 'critical'>;
  version: string;
  updateConfig: (config: Partial<SystemConfig>) => void;
  updateHealth: (service: string, status: 'healthy' | 'warning' | 'critical') => void;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  config: null,
  health: {},
  version: '1.0.0',

  updateConfig: (config) => {
    const { config: currentConfig } = get();
    set({
      config: currentConfig ? { ...currentConfig, ...config } : null
    });
  },

  updateHealth: (service, status) => {
    const { health } = get();
    set({
      health: { ...health, [service]: status }
    });
  }
}));

// Analytics Store
interface AnalyticsState {
  queries: Record<string, any>;
  results: Record<string, any>;
  isExecuting: Record<string, boolean>;
  executeQuery: (queryId: string, parameters?: Record<string, any>) => Promise<any>;
  cacheResult: (queryId: string, result: any) => void;
  clearCache: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  queries: {},
  results: {},
  isExecuting: {},

  executeQuery: async (queryId, parameters = {}) => {
    const { isExecuting } = get();
    
    if (isExecuting[queryId]) {
      return null;
    }

    set({
      isExecuting: { ...isExecuting, [queryId]: true }
    });

    try {
      // Mock query execution - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResult = {
        data: [],
        metadata: {
          executionTime: 1000,
          recordCount: 0,
          queryId,
          parameters
        }
      };

      get().cacheResult(queryId, mockResult);
      return mockResult;
    } finally {
      const { isExecuting: currentExecuting } = get();
      set({
        isExecuting: { ...currentExecuting, [queryId]: false }
      });
    }
  },

  cacheResult: (queryId, result) => {
    const { results } = get();
    set({
      results: { ...results, [queryId]: result }
    });
  },

  clearCache: () => {
    set({ results: {} });
  }
}));
