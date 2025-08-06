import { useState } from 'react';
import { useAuth, ProtectedComponent } from './AuthProvider';
import type { User } from '../types';

interface NotificationItem {
  id: string;
  type: 'alert' | 'incident' | 'system' | 'user';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'incident',
    title: 'New Critical Incident',
    message: 'Cyber security breach detected in traffic control system',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    read: false,
    severity: 'critical'
  },
  {
    id: 'notif-2',
    type: 'alert',
    title: 'High Energy Consumption',
    message: 'Power demand exceeding 85% capacity in downtown grid',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    read: false,
    severity: 'high'
  },
  {
    id: 'notif-3',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance window starting at 2:00 AM',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: true,
    severity: 'low'
  }
];

function UserProfile({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-critical';
      case 'operator': return 'text-warning';
      case 'analyst': return 'text-info';
      default: return 'text-success';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'operator': return '⚙️';
      case 'analyst': return '📊';
      default: return '👁️';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div className="w-8 h-8 bg-purple rounded-full flex items-center justify-center text-sm font-semibold">
          {user.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="text-left hidden md:block">
          <div className="text-sm font-medium">{user.name}</div>
          <div className={`text-xs capitalize ${getRoleColor(user.role)}`}>
            {getRoleIcon(user.role)} {user.role}
          </div>
        </div>
        <div className="text-xs">▼</div>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-primary border border-accent rounded-lg shadow-lg z-20">
            <div className="p-4 border-b border-accent">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-secondary">{user.email}</div>
              <div className="text-xs text-muted mt-1">{user.department}</div>
            </div>
            
            <div className="p-2">
              <button className="w-full text-left px-3 py-2 hover:bg-accent rounded-md text-sm">
                👤 Profile Settings
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-accent rounded-md text-sm">
                🎨 Preferences
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-accent rounded-md text-sm">
                📊 Activity Log
              </button>
              <ProtectedComponent permission="admin_access">
                <button className="w-full text-left px-3 py-2 hover:bg-accent rounded-md text-sm">
                  ⚙️ System Settings
                </button>
              </ProtectedComponent>
            </div>
            
            <div className="p-2 border-t border-accent">
              <button 
                onClick={logout}
                className="w-full text-left px-3 py-2 hover:bg-critical/20 text-critical rounded-md text-sm"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'border-l-critical';
      case 'high': return 'border-l-alert';
      case 'medium': return 'border-l-warning';
      default: return 'border-l-info';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incident': return '🚨';
      case 'alert': return '⚠️';
      case 'system': return '⚙️';
      default: return '📢';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div className="text-xl">🔔</div>
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-critical rounded-full flex items-center justify-center text-xs font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-primary border border-accent rounded-lg shadow-lg z-20 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-accent flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-purple hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted">
                  <div className="text-2xl mb-2">📭</div>
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 border-l-2 hover:bg-accent/30 cursor-pointer transition-colors ${
                      getSeverityColor(notification.severity)
                    } ${!notification.read ? 'bg-accent/10' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg">{getTypeIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-sm">{notification.title}</div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-purple rounded-full"></div>
                          )}
                        </div>
                        <p className="text-xs text-secondary leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="text-xs text-muted mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 border-t border-accent text-center">
              <button className="text-xs text-purple hover:underline">
                View All Notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SystemStatus() {
  const [systemHealth] = useState({
    overall: 98.5,
    services: {
      'Data Processing': 99.2,
      'Alert System': 98.8,
      'Network Monitor': 97.5,
      'Energy Grid': 99.1,
      'Traffic Control': 96.8
    },
    lastUpdate: new Date().toISOString()
  });

  const getHealthColor = (health: number) => {
    if (health >= 98) return 'text-success';
    if (health >= 95) return 'text-warning';
    return 'text-critical';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${systemHealth.overall >= 98 ? 'bg-success' : 'bg-warning'} animate-pulse`}></div>
        <span className="text-sm">
          System Health: <span className={getHealthColor(systemHealth.overall)}>{systemHealth.overall}%</span>
        </span>
      </div>
    </div>
  );
}

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  });

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <header className="bg-primary border-b border-accent px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section - Branding */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-purple">TruContext</div>
            <div className="text-sm text-secondary">Smart City Operations</div>
          </div>
          <SystemStatus />
        </div>

        {/* Center Section - Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          <button className="px-4 py-2 rounded-lg bg-accent text-primary text-sm font-medium">
            🏠 Dashboard
          </button>
          <ProtectedComponent permission="read_all">
            <button className="px-4 py-2 rounded-lg hover:bg-accent/50 text-secondary hover:text-primary text-sm transition-colors">
              📊 Analytics
            </button>
          </ProtectedComponent>
          <ProtectedComponent permission="write_incidents">
            <button className="px-4 py-2 rounded-lg hover:bg-accent/50 text-secondary hover:text-primary text-sm transition-colors">
              🚨 Incidents
            </button>
          </ProtectedComponent>
          <ProtectedComponent permission="create_reports">
            <button className="px-4 py-2 rounded-lg hover:bg-accent/50 text-secondary hover:text-primary text-sm transition-colors">
              📋 Reports
            </button>
          </ProtectedComponent>
          <ProtectedComponent permission="admin_access">
            <button className="px-4 py-2 rounded-lg hover:bg-accent/50 text-secondary hover:text-primary text-sm transition-colors">
              ⚙️ Admin
            </button>
          </ProtectedComponent>
        </nav>

        {/* Right Section - User Actions */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-secondary hidden md:block">
            {currentTime.toLocaleString()}
          </div>
          <NotificationCenter />
          <UserProfile user={user} />
        </div>
      </div>
    </header>
  );
}
