import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Target,
  Zap,
  Shield,
  FileSearch,
  Network,
  Lock,
  Eye,
  FileText,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Skill {
  id: number;
  name: string;
  description: string;
  category: string;
  level: number;
  xp: number;
  xpForNextLevel: number;
  xpNeeded: number;
}

const skillIcons: Record<string, React.ElementType> = {
  'Log Analysis': FileSearch,
  'SIEM Navigation': Shield,
  'IOC Identification': Eye,
  'Incident Classification': AlertTriangle,
  'Malware Analysis': Lock,
  'Network Analysis': Network,
  'Threat Intelligence': Target,
  'Documentation': FileText,
  'Decision Making': Zap,
  'Time Management': Clock
};

export default function Skills() {
  const [skills, setSkills] = useState<Record<string, Skill[]>>({});
  const [overallStats, setOverallStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSkillsProgress();
      setSkills(data.skills);
      setOverallStats(data.overallStats);
    } catch (error) {
      toast.error('Failed to load skills');
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'text-purple-500';
    if (level >= 7) return 'text-blue-500';
    if (level >= 5) return 'text-green-500';
    if (level >= 3) return 'text-yellow-500';
    return 'text-gray-500';
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Skills</h1>
          <p className="text-muted-foreground mt-1">
            Track your skill development and expertise levels
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Average Level</p>
                <p className="font-bold">{Math.round(overallStats?.averageLevel || 0)}</p>
              </div>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total XP</p>
                <p className="font-bold">{(overallStats?.totalXp || 0).toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="technical" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="technical">Technical Skills</TabsTrigger>
          <TabsTrigger value="soft">Soft Skills</TabsTrigger>
        </TabsList>

        {Object.entries(skills).map(([category, categorySkills]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid gap-4">
              {categorySkills.map((skill) => {
                const Icon = skillIcons[skill.name] || Brain;
                const xpProgress = ((skill.xp % 100) / 100) * 100;
                
                return (
                  <Card key={skill.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold">{skill.name}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getLevelColor(skill.level)}>
                                Level {skill.level}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {skill.description}
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {skill.xp} / {skill.xpForNextLevel} XP
                              </span>
                              <span className="text-muted-foreground">
                                {skill.xpNeeded} XP to next level
                              </span>
                            </div>
                            <Progress value={xpProgress} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* How to Improve */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            How to Improve Your Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                <Brain className="w-5 h-5 text-blue-500" />
              </div>
              <h4 className="font-medium mb-1">Complete Scenarios</h4>
              <p className="text-sm text-muted-foreground">
                Earn XP by completing training scenarios. Higher scores give more XP.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <h4 className="font-medium mb-1">Pass Assessments</h4>
              <p className="text-sm text-muted-foreground">
                Passing assessments awards significant XP bonuses to all skills.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-green-500" />
              </div>
              <h4 className="font-medium mb-1">Level Up Benefits</h4>
              <p className="text-sm text-muted-foreground">
                Higher skill levels unlock advanced scenarios and demonstrate expertise.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
