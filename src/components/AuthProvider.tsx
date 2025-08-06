import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole, Permission } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@trucontext.com',
    name: 'System Administrator',
    role: 'admin',
    department: 'IT Operations',
    permissions: ['read_all', 'write_all', 'admin_access', 'user_management', 'system_config'],
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        sms: false,
        severityThreshold: 'medium'
      },
      dashboardLayout: 'executive',
      timezone: 'America/New_York',
      language: 'en'
    },
    lastLogin: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'user-2',
    email: 'operator@trucontext.com',
    name: 'Operations Manager',
    role: 'operator',
    department: 'Operations Center',
    permissions: ['read_all', 'write_incidents', 'manage_alerts'],
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        sms: true,
        severityThreshold: 'high'
      },
      dashboardLayout: 'operational',
      timezone: 'America/New_York',
      language: 'en'
    },
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
    isActive: true
  },
  {
    id: 'user-3',
    email: 'analyst@trucontext.com',
    name: 'Data Analyst',
    role: 'analyst',
    department: 'Analytics',
    permissions: ['read_all', 'export_data', 'create_reports'],
    preferences: {
      theme: 'dark',
      notifications: {
        email: false,
        push: false,
        sms: false,
        severityThreshold: 'low'
      },
      dashboardLayout: 'analytical',
      timezone: 'America/New_York',
      language: 'en'
    },
    lastLogin: new Date(Date.now() - 7200000).toISOString(),
    isActive: true
  },
  {
    id: 'user-4',
    email: 'viewer@trucontext.com',
    name: 'Public Safety Viewer',
    role: 'viewer',
    department: 'Public Safety',
    permissions: ['read_public_safety', 'view_incidents'],
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        push: false,
        sms: false,
        severityThreshold: 'medium'
      },
      dashboardLayout: 'domain_specific',
      timezone: 'America/New_York',
      language: 'en'
    },
    lastLogin: new Date(Date.now() - 1800000).toISOString(),
    isActive: true
  }
];

// Role-based permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: ['read_all', 'write_all', 'admin_access', 'user_management', 'system_config', 'export_data', 'create_reports'],
  operator: ['read_all', 'write_incidents', 'manage_alerts', 'update_status', 'assign_incidents'],
  analyst: ['read_all', 'export_data', 'create_reports', 'view_analytics', 'query_data'],
  viewer: ['read_public_safety', 'view_incidents', 'view_alerts']
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication
    const storedUser = localStorage.getItem('trucontext_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('trucontext_user');
      }
    } else {
      // Auto-login for demo purposes with admin user
      const demoUser = mockUsers[0]; // Admin user
      const userWithUpdatedLogin = {
        ...demoUser,
        lastLogin: new Date().toISOString()
      };
      setUser(userWithUpdatedLogin);
      localStorage.setItem('trucontext_user', JSON.stringify(userWithUpdatedLogin));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock authentication - in production, this would be a real API call
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser && password === 'demo123') {
      const userWithUpdatedLogin = {
        ...foundUser,
        lastLogin: new Date().toISOString()
      };
      
      setUser(userWithUpdatedLogin);
      localStorage.setItem('trucontext_user', JSON.stringify(userWithUpdatedLogin));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('trucontext_user');
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || rolePermissions[user.role]?.includes(permission) || false;
  };

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protecting routes
export function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">🔄</div>
            <p className="text-lg">Authenticating...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <LoginForm />;
    }

    return <Component {...props} />;
  };
}

// Permission-based component wrapper
export function ProtectedComponent({ 
  permission, 
  role, 
  children, 
  fallback 
}: { 
  permission?: Permission; 
  role?: UserRole; 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  const { hasPermission, hasRole } = useAuth();

  const hasAccess = (permission ? hasPermission(permission) : true) && 
                   (role ? hasRole(role) : true);

  if (!hasAccess) {
    return fallback || (
      <div className="text-center text-muted p-4">
        <div className="text-2xl mb-2">🔒</div>
        <p>Access Denied</p>
        <p className="text-xs mt-1">You don't have permission to view this content</p>
      </div>
    );
  }

  return <>{children}</>;
}

// Login form component
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password);
    
    if (!success) {
      setError('Invalid credentials. Use demo123 as password for any demo user.');
    }
    
    setIsLoading(false);
  };

  const demoUsers = [
    { email: 'admin@trucontext.com', role: 'System Administrator' },
    { email: 'operator@trucontext.com', role: 'Operations Manager' },
    { email: 'analyst@trucontext.com', role: 'Data Analyst' },
    { email: 'viewer@trucontext.com', role: 'Public Safety Viewer' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-md w-full mx-4">
        <div className="bg-primary border border-accent rounded-lg p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-2xl font-bold text-purple mb-2">TruContext</div>
            <h1 className="text-xl font-semibold mb-2">Smart City Operations</h1>
            <p className="text-sm text-secondary">Secure access to city management systems</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-tertiary border border-accent rounded-md focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-tertiary border border-accent rounded-md focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-critical/20 border border-critical text-critical px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Users */}
          <div className="mt-8 pt-6 border-t border-accent">
            <h3 className="text-sm font-medium mb-3 text-center">Demo Users</h3>
            <div className="space-y-2">
              {demoUsers.map(user => (
                <button
                  key={user.email}
                  onClick={() => {
                    setEmail(user.email);
                    setPassword('demo123');
                  }}
                  className="w-full text-left px-3 py-2 bg-tertiary hover:bg-accent rounded-md transition-colors"
                >
                  <div className="font-medium text-sm">{user.email}</div>
                  <div className="text-xs text-secondary">{user.role}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-muted mt-3">
              Password: <code className="bg-tertiary px-1 rounded">demo123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
