import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  ClipboardCheck, 
  TrendingUp,
  Target,
  Clock,
  Star,
  ArrowRight,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';

export default function Progress() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setIsLoading(true);
      const progressData = await api.getProgressOverview();
      setData(progressData);
    } catch (error) {
      toast.error('Failed to load progress');
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
        <h1 className="text-3xl font-bold tracking-tight">My Progress</h1>
        <p className="text-muted-foreground mt-1">
          Track your learning journey and achievements
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scenarios Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.stats?.scenarios?.completedScenarios || 0}
            </div>
            <ProgressBar 
              value={((data?.stats?.scenarios?.completedScenarios || 0) / (data?.stats?.scenarios?.totalScenarios || 1)) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assessments Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.stats?.assessments?.passedAssessments || 0}
            </div>
            <ProgressBar 
              value={((data?.stats?.assessments?.passedAssessments || 0) / (data?.stats?.assessments?.totalAssessments || 1)) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.stats?.scenarios?.totalScore || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Points earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Time Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((data?.stats?.scenarios?.totalTime || 0) / 3600)}h
            </div>
            <p className="text-xs text-muted-foreground">Total training time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="difficulty">Difficulty</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {data?.categoryProgress?.map((cat: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{cat.category}</span>
                    <Badge variant="outline">
                      {cat.completed}/{cat.total}
                    </Badge>
                  </div>
                  <ProgressBar 
                    value={cat.total > 0 ? (cat.completed / cat.total) * 100 : 0} 
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    Avg Score: {Math.round(cat.average_score || 0)}%
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="difficulty" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {data?.difficultyProgress?.map((diff: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{diff.difficulty}</span>
                    <Badge variant="outline">
                      {diff.completed}/{diff.total}
                    </Badge>
                  </div>
                  <ProgressBar 
                    value={diff.total > 0 ? (diff.completed / diff.total) * 100 : 0} 
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    Avg Score: {Math.round(diff.average_score || 0)}%
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <div className="grid gap-4">
            {data?.skillProgress?.map((skill: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{skill.name}</p>
                      <p className="text-sm text-muted-foreground">{skill.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge>Level {skill.level}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">{skill.xp} XP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <div className="grid gap-4">
            {data?.milestones?.map((milestone: any, index: number) => (
              <Card key={index} className={milestone.completed ? 'border-green-500/50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      milestone.completed ? 'bg-green-500 text-white' : 'bg-muted'
                    }`}>
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${milestone.completed ? 'text-green-500' : ''}`}>
                        {milestone.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{milestone.current} / {milestone.target}</span>
                          <span>{Math.round((milestone.current / milestone.target) * 100)}%</span>
                        </div>
                        <ProgressBar 
                          value={(milestone.current / milestone.target) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentActivity?.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
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
            <p className="text-center text-muted-foreground py-8">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
