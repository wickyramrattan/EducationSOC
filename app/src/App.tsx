import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/store/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { api } from '@/services/api';

// Simple components for demo
const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      onLogin();
    } catch (error) {
      // Error handled by API
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-primary-foreground">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">SOC Training</h1>
              <p className="text-sm text-muted-foreground">Platform</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-xl border">
          <h2 className="text-xl font-bold text-center mb-4">Welcome back</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
                placeholder="admin123"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90"
            >
              Sign In
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Demo: admin / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [stats, setStats] = useState<any>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getProgressOverview();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card/50">
        <div className="flex items-center justify-between h-full px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground">S</span>
            </div>
            <h1 className="font-bold">SOC Training Platform</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Welcome back, {user?.username}!</h2>
          <p className="text-muted-foreground mt-1">
            Continue your journey to becoming a skilled SOC analyst
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Scenarios Completed</p>
            <p className="text-2xl font-bold">{stats?.stats?.scenarios?.completedScenarios || 0}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Assessments Passed</p>
            <p className="text-2xl font-bold">{stats?.stats?.assessments?.passedAssessments || 0}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Total Score</p>
            <p className="text-2xl font-bold">{(stats?.stats?.scenarios?.totalScore || 0).toLocaleString()}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Time Invested</p>
            <p className="text-2xl font-bold">{Math.floor((stats?.stats?.scenarios?.totalTime || 0) / 3600)}h</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-lg mb-2">Training Scenarios</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Practice with real-world SOC scenarios including phishing, malware, and network intrusion.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">5 scenarios available</span>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                Start Training
              </button>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-lg mb-2">Skill Assessments</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Test your knowledge with comprehensive assessments and earn certificates.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">2 assessments available</span>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                Take Assessment
              </button>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-lg mb-2">Progress Tracking</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Track your skill development with detailed analytics and achievements.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">View your stats</span>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                View Progress
              </button>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">System Status</h4>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm">API Server: Running on port 3001</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm">Database: SQLite connected</span>
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="soc-platform-theme">
      <AuthProvider>
        {isAuthenticated ? (
          <Dashboard onLogout={() => setIsAuthenticated(false)} />
        ) : (
          <Login onLogin={() => setIsAuthenticated(true)} />
        )}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
