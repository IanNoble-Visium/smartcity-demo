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
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster="/video/Smart_City_Sunrise_Video_Generation.mp4"
        >
          <source src="/video/Smart_City_Sunrise_Video_Generation.mp4" type="video/mp4" />
          <source src="/video/Futuristic_NOC_Video_Ready.mp4" type="video/mp4" />
          <source src="/video/Dynamic_City_Map_Video_Ready.mp4" type="video/mp4" />
        </video>
        
        {/* Animated overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-slate-800/90"></div>
        
        {/* Animated grid overlay */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`grid-h-${i}`}
              className="absolute border-t border-cyan-400/30"
              style={{ top: `${i * 5}%`, width: '100%' }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ 
                opacity: [0, 0.6, 0],
                scaleX: [0, 1, 0]
              }}
              transition={{ 
                duration: 4, 
                delay: i * 0.1, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`grid-v-${i}`}
              className="absolute border-l border-green-400/30"
              style={{ left: `${i * 5}%`, height: '100%' }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ 
                opacity: [0, 0.6, 0],
                scaleY: [0, 1, 0]
              }}
              transition={{ 
                duration: 4, 
                delay: i * 0.15, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-2 h-2 bg-cyan-400/60 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 200 - 100],
                y: [0, Math.random() * 200 - 100],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding and Info */}
          <motion.div 
            className="text-center lg:text-left space-y-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Logo and Title */}
            <div className="space-y-4">
              <motion.div 
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/30 backdrop-blur-md"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(6, 182, 212, 0.3)',
                    '0 0 40px rgba(6, 182, 212, 0.6)',
                    '0 0 20px rgba(6, 182, 212, 0.3)'
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <span className="text-3xl">🏙️</span>
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  TruContext
                </div>
              </motion.div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Smart City
                <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Operations
                </span>
              </h1>
              
              <p className="text-xl text-slate-300 max-w-lg">
                Secure access to city management systems with real-time monitoring, 
                AI-powered analytics, and comprehensive incident response capabilities.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              {[
                { icon: '🛡️', title: 'Secure Access', desc: 'Enterprise-grade security' },
                { icon: '📊', title: 'Real-time Data', desc: 'Live city monitoring' },
                { icon: '🤖', title: 'AI Analytics', desc: 'Intelligent insights' },
                { icon: '🚨', title: 'Incident Response', desc: 'Rapid emergency handling' }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <div className="font-semibold text-white text-sm">{feature.title}</div>
                    <div className="text-xs text-slate-400">{feature.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div 
            className="w-full max-w-md mx-auto"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 shadow-2xl">
              {/* Form Header */}
              <div className="text-center mb-8">
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(6, 182, 212, 0.5)',
                      '0 0 30px rgba(6, 182, 212, 0.8)',
                      '0 0 20px rgba(6, 182, 212, 0.5)'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="text-2xl">🔐</span>
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-slate-400 text-sm">Sign in to access the command center</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-slate-400 transition-all duration-200"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-slate-400 transition-all duration-200"
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
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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

              {/* Demo Users */}
              <div className="mt-8 pt-6 border-t border-slate-700">
                <h3 className="text-sm font-medium mb-4 text-center text-slate-300">Demo Access</h3>
                <div className="grid grid-cols-1 gap-3">
                  {demoUsers.map((user, index) => (
                    <motion.button
                      key={user.email}
                      onClick={() => selectUser(user.email)}
                      className={`text-left p-4 rounded-lg border transition-all duration-200 ${
                        selectedUser === user.email
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-800/30 border-slate-600 hover:bg-slate-700/50 text-slate-300'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{user.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{user.email}</div>
                          <div className="text-xs opacity-75">{user.role}</div>
                          <div className="text-xs opacity-60 mt-1">{user.description}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-center text-slate-500 mt-4">
                  Password: <code className="bg-slate-800 px-2 py-1 rounded text-cyan-400">demo123</code>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom branding */}
      <motion.div 
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-slate-400 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <div className="flex items-center gap-2">
          <span>Powered by</span>
          <span className="font-semibold text-cyan-400">Visium Technologies</span>
          <span>•</span>
          <span>TruContext Platform</span>
        </div>
      </motion.div>
    </div>
  );
}
