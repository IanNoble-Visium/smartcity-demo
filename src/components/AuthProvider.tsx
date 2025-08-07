import { createContext, useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    }
    // Temporarily disable auto-login for testing
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

// Enhanced Login form component with professional design and video background
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
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
    { 
      email: 'admin@trucontext.com', 
      role: 'System Administrator',
      icon: '👑',
      description: 'Full system access and management capabilities'
    },
    { 
      email: 'operator@trucontext.com', 
      role: 'Operations Manager',
      icon: '🎯',
      description: 'Operations center management and incident response'
    },
    { 
      email: 'analyst@trucontext.com', 
      role: 'Data Analyst',
      icon: '📊',
      description: 'Analytics, reporting, and data visualization access'
    },
    { 
      email: 'viewer@trucontext.com', 
      role: 'Public Safety Viewer',
      icon: '👁️',
      description: 'Public safety monitoring and incident viewing'
    }
  ];

  const selectUser = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('demo123');
    setSelectedUser(userEmail);
  };

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Enhanced Full-Screen Video Background */}
      <div className="video-background-container">
        <video
          className="video-background"
          autoPlay
          loop
          muted
          playsInline
          poster="/video/Futuristic_NOC_Video_Ready.mp4"
        >
          <source src="/video/Futuristic_NOC_Video_Ready.mp4" type="video/mp4" />
          <source src="/video/Futuristic_NOC_Video_Ready.mp4" type="video/mp4" />
          <source src="/video/Dynamic_City_Map_Video_Ready.mp4" type="video/mp4" />
        </video>

        {/* Enhanced multi-layer overlay for maximum text readability */}
        <div className="absolute inset-0 bg-slate-900/98"></div>
        <div className="absolute inset-0 bg-black/80"></div>

        {/* Additional gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/85 to-slate-900/95"></div>

        {/* Final overlay for optimal readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/90"></div>

      </div>

      {/* Main Content */}
      <div className="relative z-10 h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-5 gap-6 items-center h-full max-h-[calc(100vh-2rem)]">

          {/* Left Side - Compact Branding */}
          <motion.div
            className="lg:col-span-2 text-center lg:text-left space-y-4 p-4 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-white/10"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Compact Logo and Title */}
            <div className="space-y-3">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full border border-cyan-400/50 backdrop-blur-md"
                animate={{
                  boxShadow: [
                    '0 0 15px rgba(6, 182, 212, 0.4)',
                    '0 0 25px rgba(6, 182, 212, 0.7)',
                    '0 0 15px rgba(6, 182, 212, 0.4)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span className="text-2xl">🏙️</span>
                <div className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  TruContext
                </div>
              </motion.div>

              <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight enhanced-text-shadow">
                Smart City
                <span className="block bg-gradient-to-r from-cyan-100 to-blue-100 bg-clip-text text-transparent enhanced-drop-shadow">
                  Operations
                </span>
              </h1>

              <p className="text-sm lg:text-base text-slate-50 max-w-md leading-relaxed enhanced-text-shadow">
                Secure access to city management systems with real-time monitoring and AI-powered analytics.
              </p>
            </div>

            {/* Compact Feature highlights */}
            <div className="grid grid-cols-2 gap-2 max-w-md">
              {[
                { icon: '🛡️', title: 'Secure Access' },
                { icon: '📊', title: 'Real-time Data' },
                { icon: '🤖', title: 'AI Analytics' },
                { icon: '🚨', title: 'Incident Response' }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="flex items-center gap-2 p-2 bg-white/20 rounded-lg border border-white/30 backdrop-blur-sm shadow-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                >
                  <span className="text-lg">{feature.icon}</span>
                  <div className="font-semibold text-white text-xs drop-shadow-sm">{feature.title}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Compact Login Form */}
          <motion.div
            className="lg:col-span-3 w-full max-w-lg mx-auto"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="bg-slate-900/99 backdrop-blur-xl border-2 border-cyan-400/60 rounded-xl p-6 shadow-2xl ring-2 ring-white/20"
                 style={{ backgroundColor: 'rgba(15, 23, 42, 0.98)' }}>
              <div className="relative z-10">
                {/* Compact Form Header */}
                <div className="text-center mb-6">
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-2 ring-cyan-400/30"
                    animate={{
                      boxShadow: [
                        '0 0 15px rgba(6, 182, 212, 0.6)',
                        '0 0 25px rgba(6, 182, 212, 0.9)',
                        '0 0 15px rgba(6, 182, 212, 0.6)'
                      ]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <span className="text-2xl">🔐</span>
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2 enhanced-text-shadow">Welcome Back</h2>
                  <p className="text-slate-50 text-sm enhanced-text-shadow">Sign in to access the command center</p>
                </div>

                {/* Compact Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-white mb-2 enhanced-text-shadow">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white/95 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-900 placeholder-slate-500 transition-all duration-200 text-sm font-medium shadow-inner"
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold text-white mb-2 enhanced-text-shadow">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/95 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-900 placeholder-slate-500 transition-all duration-200 text-sm font-medium shadow-inner"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </div>

                {error && (
                  <motion.div 
                    className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Signing In...
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>
              </form>

                {/* Compact Demo Users */}
                <div className="mt-6 pt-4 border-t border-slate-500/50">
                  <h3 className="text-sm font-semibold mb-3 text-center text-white enhanced-text-shadow">Quick Demo Access</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {demoUsers.map((user, index) => (
                      <motion.button
                        key={user.email}
                        onClick={() => selectUser(user.email)}
                        className={`text-left p-3 rounded-lg border transition-all duration-200 shadow-md ${
                          selectedUser === user.email
                            ? 'bg-cyan-500/40 border-cyan-300/80 text-cyan-50 shadow-cyan-500/20'
                            : 'bg-white/20 border-slate-300/60 hover:bg-white/30 text-white shadow-black/20'
                        }`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{user.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs truncate">{user.email}</div>
                            <div className="text-xs opacity-80 truncate">{user.role}</div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-xs text-center text-slate-100 mt-3 enhanced-text-shadow">
                    Password: <code className="bg-white/30 px-2 py-1 rounded text-cyan-100 font-semibold shadow-lg">demo123</code>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Compact Bottom branding */}
      <motion.div
        className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center text-slate-300 text-xs bg-slate-900/60 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-cyan-200 drop-shadow-sm">Visium Technologies</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-200 drop-shadow-sm">TruContext Platform</span>
        </div>
      </motion.div>
    </div>
  );
}
