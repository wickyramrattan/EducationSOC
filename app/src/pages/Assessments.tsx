import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ClipboardCheck, 
  Clock, 
  Star, 
  CheckCircle, 
  PlayCircle,
  Search,
  Filter,
  Trophy,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface Assessment {
  id: number;
  title: string;
  description: string;
  category: string;
  passingScore: number;
  timeLimit: number;
  points: number;
  userProgress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    score: number;
    passed: boolean;
  };
}

export default function Assessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAssessments();
      setAssessments(data);
    } catch (error) {
      toast.error('Failed to load assessments');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assessment.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || assessment.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusIcon = (status: string, passed?: boolean) => {
    if (status === 'completed') {
      return passed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Star className="w-5 h-5 text-orange-500" />;
    }
    return <PlayCircle className="w-5 h-5 text-muted-foreground" />;
  };

  const categories = Array.from(new Set(assessments.map(a => a.category)));

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
          <h1 className="text-3xl font-bold tracking-tight">Skill Assessments</h1>
          <p className="text-muted-foreground mt-1">
            Test your knowledge and earn certifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-muted-foreground">
            {assessments.filter(a => a.userProgress?.passed).length} of {assessments.length} passed
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Assessments</p>
            <p className="text-2xl font-bold">{assessments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Passed</p>
            <p className="text-2xl font-bold text-green-500">
              {assessments.filter(a => a.userProgress?.passed).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-blue-500">
              {assessments.filter(a => a.userProgress?.status === 'in_progress').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Average Score</p>
            <p className="text-2xl font-bold">
              {Math.round(assessments.reduce((acc, a) => acc + (a.userProgress?.score || 0), 0) / 
                assessments.filter(a => a.userProgress?.status === 'completed').length || 0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assessments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssessments.map(assessment => (
          <Card key={assessment.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                    {assessment.title}
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {assessment.description}
                  </CardDescription>
                </div>
                <div className="ml-2">
                  {getStatusIcon(assessment.userProgress?.status || 'not_started', assessment.userProgress?.passed)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="text-xs capitalize">
                  {assessment.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Target className="w-3 h-3 mr-1" />
                  Pass: {assessment.passingScore}%
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {assessment.timeLimit} min
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {assessment.points} pts
                </span>
              </div>

              {assessment.userProgress?.status === 'completed' && (
                <div className={`mb-4 p-2 rounded-md ${assessment.userProgress.passed ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                  <p className={`text-sm font-medium ${assessment.userProgress.passed ? 'text-green-500' : 'text-orange-500'}`}>
                    {assessment.userProgress.passed ? 'Passed' : 'Failed'} • Score: {assessment.userProgress.score}%
                  </p>
                </div>
              )}

              <Button 
                className="w-full" 
                variant={assessment.userProgress?.status === 'completed' ? 'outline' : 'default'}
                asChild
              >
                <Link to={`/assessments/${assessment.id}`}>
                  {assessment.userProgress?.status === 'completed' ? 'View Results' : 
                   assessment.userProgress?.status === 'in_progress' ? 'Continue' : 'Start Assessment'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAssessments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No assessments found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
