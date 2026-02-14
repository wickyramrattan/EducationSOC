import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/store/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  ClipboardCheck, 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardData {
  stats: {
    scenarios: {
      totalScenarios: number;
      completedScenarios: number;
      inProgressScenarios: number;
    };
    assessments: {
      totalAssessments: number;
      passedAssessments: number;
    };
  };
  recentActivity: Array<{
    type: string;
    title: string;
    status: string;
    score: number;
    date: string;
  }>;
  recommendations: {
    recommendedScenarios: Array<{
      id: number;
      title: string;
      category: string;
      difficulty: string;
      estimatedTime: number;
    }>;
    milestones: Array<{
      name: string;
      description: string;
      target: number;
      current: number;
      completed: boolean;
    }>;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [overview, recommendations] = await Promise.all([
        api.getProgressOverview(),
        api.getRecommendations()
      ]);
      
      setData({
        stats: overview.stats,
        recentActivity: overview.recentActivity,
        recommendations
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
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

  const scenarioProgress = data?.stats?.scenarios 
    ? Math.round((data.stats.scenarios.completedScenarios / data.stats.scenarios.totalScenarios) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.fullName?.split(' ')[0] || user?.username}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Continue your journey to becoming a skilled SOC analyst
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            <Zap className="w-3 h-3 mr-1" />
            Level {Math.floor((data?.stats?.scenarios?.totalScore || 0) / 500) + 1}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scenarios Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.stats?.scenarios?.completedScenarios || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {data?.stats?.scenarios?.totalScenarios || 0} total
            </p>
            <Progress value={scenarioProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments Passed</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.stats?.assessments?.passedAssessments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {data?.stats?.assessments?.totalAssessments || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.stats?.scenarios?.totalScore?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Points earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Invested</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((data?.stats?.scenarios?.totalTime || 0) / 60)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Total training time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recommended Scenarios */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recommended for You</CardTitle>
                <CardDescription>Based on your skill level and progress</CardDescription>
              </div>
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.recommendations?.recommendedScenarios?.slice(0, 3).map((scenario) => (
              <div 
                key={scenario.id} 
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{scenario.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {scenario.category}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs capitalize ${
                        scenario.difficulty === 'beginner' ? 'bg-green-500/10 text-green-500' :
                        scenario.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {scenario.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {scenario.estimatedTime} min
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <Link to={`/scenarios/${scenario.id}`}>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            ))}
            
            {(!data?.recommendations?.recommendedScenarios || data.recommendations.recommendedScenarios.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Great job! You've completed all recommended scenarios.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link to="/scenarios">Browse All Scenarios</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Milestones</CardTitle>
                <CardDescription>Track your achievements</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.recommendations?.milestones?.map((milestone, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      milestone.completed ? 'bg-green-500 text-white' : 'bg-muted'
                    }`}>
                      {milestone.completed ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <span className={`font-medium ${milestone.completed ? 'text-green-500' : ''}`}>
                      {milestone.name}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {milestone.current}/{milestone.target}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pl-8">
                  {milestone.description}
                </p>
                <Progress 
                  value={(milestone.current / milestone.target) * 100} 
                  className="ml-8"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest training activities</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'scenario' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                    }`}>
                      {activity.type === 'scenario' ? <BookOpen className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {activity.type} • {activity.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{activity.score} pts</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity. Start your first scenario!</p>
              <Button className="mt-4" asChild>
                <Link to="/scenarios">Start Training</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
