import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  TrendingUp,
  Activity,
  User,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  users: {
    totalUsers: number;
    students: number;
    admins: number;
    newToday: number;
  };
  scenarios: {
    totalScenarios: number;
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  progress: {
    totalAttempts: number;
    completed: number;
    averageScore: number;
    totalTimeSpent: number;
  };
  assessments: {
    totalAttempts: number;
    passed: number;
    averageScore: number;
  };
  topPerformers: Array<{
    id: number;
    username: string;
    fullName: string;
    totalScore: number;
    scenariosCompleted: number;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Platform overview and key metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.users?.newToday || 0} today
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats?.users?.students || 0} students • {stats?.users?.admins || 0} admins
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scenarios</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.scenarios?.totalScenarios || 0}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats?.scenarios?.beginner || 0} beginner • {stats?.scenarios?.intermediate || 0} intermediate • {stats?.scenarios?.advanced || 0} advanced
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.progress?.totalAttempts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.progress?.completed || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats?.progress?.averageScore || 0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all scenarios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Top Performers
            </CardTitle>
            <CardDescription>Highest scoring students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topPerformers?.slice(0, 5).map((performer, index) => (
                <div key={performer.id} className="flex items-center gap-4">
                  <div className="w-8 text-center font-bold text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{performer.fullName || performer.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {performer.scenariosCompleted} scenarios completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{performer.totalScore.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assessment Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Assessment Performance
            </CardTitle>
            <CardDescription>Overall assessment statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Pass Rate</span>
                <span className="text-sm text-muted-foreground">
                  {stats?.assessments?.passed || 0} / {stats?.assessments?.totalAttempts || 0}
                </span>
              </div>
              <Progress 
                value={stats?.assessments?.totalAttempts > 0 
                  ? (stats.assessments.passed / stats.assessments.totalAttempts) * 100 
                  : 0} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Attempts</p>
                <p className="text-2xl font-bold">{stats?.assessments?.totalAttempts || 0}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{Math.round(stats?.assessments?.averageScore || 0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
