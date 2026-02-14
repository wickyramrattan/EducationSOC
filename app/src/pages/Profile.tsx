import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/store/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Trophy,
  BookOpen,
  ClipboardCheck,
  Edit,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
    createdAt: string;
    lastLogin?: string;
  };
  skills: Array<{
    name: string;
    description: string;
    category: string;
    level: number;
    xp: number;
  }>;
  statistics: {
    scenarios: {
      totalScenarios: number;
      completedScenarios: number;
      inProgressScenarios: number;
      totalScenarioScore: number;
      totalScenarioTime: number;
    };
    assessments: {
      totalAssessments: number;
      passedAssessments: number;
      failedAssessments: number;
      averageScore: number;
    };
  };
  certificates: Array<{
    id: number;
    title: string;
    description: string;
    issuedAt: string;
    certificateId: string;
  }>;
}

export default function Profile() {
  const { user } = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await api.getProfile();
      setData(profileData);
      setEditForm({
        fullName: profileData.user.fullName || '',
        email: profileData.user.email || ''
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.updateProfile(editForm.fullName, editForm.email);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      loadProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your account information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {data.user.fullName?.charAt(0) || data.user.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{data.user.fullName || data.user.username}</CardTitle>
            <CardDescription>@{data.user.username}</CardDescription>
            <Badge variant={data.user.role === 'admin' ? 'destructive' : 'secondary'} className="mt-2">
              <Shield className="w-3 h-3 mr-1" />
              {data.user.role}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{data.user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                Joined {new Date(data.user.createdAt).toLocaleDateString()}
              </span>
            </div>
            {data.user.lastLogin && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Last login: {new Date(data.user.lastLogin).toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats & Edit */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="edit">Edit Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Scenarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {data.statistics.scenarios.completedScenarios}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{data.statistics.scenarios.totalScenarios}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((data.statistics.scenarios.completedScenarios / data.statistics.scenarios.totalScenarios) * 100)}% completion
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4" />
                      Assessments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {data.statistics.assessments.passedAssessments}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{data.statistics.assessments.totalAssessments}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(data.statistics.assessments.averageScore)}% average score
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Total Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {data.statistics.scenarios.totalScenarioScore.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Points earned</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Certificates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.certificates.length}</div>
                    <p className="text-xs text-muted-foreground">Earned</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <div className="grid gap-4">
                {data.skills.map((skill, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{skill.name}</p>
                          <p className="text-sm text-muted-foreground">{skill.description}</p>
                        </div>
                        <Badge variant="outline">Level {skill.level}</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>XP: {skill.xp}</span>
                          <span>Next: {skill.level * 100} XP</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${(skill.xp % 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="edit">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
