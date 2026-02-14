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
  BookOpen, 
  Clock, 
  Star, 
  CheckCircle, 
  PlayCircle,
  Search,
  Filter,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';

interface Scenario {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  points: number;
  userProgress: {
    status: 'not_started' | 'in_progress' | 'completed';
    score: number;
    attempts: number;
  };
}

interface Category {
  id: string;
  name: string;
  count: number;
}

export default function Scenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [scenariosData, categoriesData] = await Promise.all([
        api.getScenarios(),
        api.getScenarioCategories()
      ]);
      setScenarios(scenariosData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error('Failed to load scenarios');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredScenarios = scenarios.filter(scenario => {
    const matchesSearch = scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scenario.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || scenario.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || scenario.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress': return <PlayCircle className="w-5 h-5 text-blue-500" />;
      default: return <BookOpen className="w-5 h-5 text-muted-foreground" />;
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Scenarios</h1>
          <p className="text-muted-foreground mt-1">
            Practice real-world SOC scenarios to build your skills
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-muted-foreground">
            {scenarios.filter(s => s.userProgress?.status === 'completed').length} of {scenarios.length} completed
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search scenarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-[150px]">
                  <Star className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {categories.map(category => (
          <Card 
            key={category.id} 
            className={`cursor-pointer transition-colors ${selectedCategory === category.id ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => setSelectedCategory(selectedCategory === category.id ? 'all' : category.id)}
          >
            <CardContent className="p-4">
              <p className="font-medium text-sm">{category.name}</p>
              <p className="text-2xl font-bold">{category.count}</p>
              <p className="text-xs text-muted-foreground">scenarios</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scenarios Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredScenarios.map(scenario => (
          <Card key={scenario.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                    {scenario.title}
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {scenario.description}
                  </CardDescription>
                </div>
                <div className="ml-2">
                  {getStatusIcon(scenario.userProgress?.status || 'not_started')}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="text-xs capitalize">
                  {scenario.category}
                </Badge>
                <Badge variant="outline" className={`text-xs capitalize ${getDifficultyColor(scenario.difficulty)}`}>
                  {scenario.difficulty}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {scenario.estimatedTime} min
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {scenario.points} pts
                </span>
              </div>

              {scenario.userProgress?.status === 'completed' && (
                <div className="mb-4 p-2 bg-green-500/10 rounded-md">
                  <p className="text-sm text-green-500 font-medium">
                    Completed • Score: {scenario.userProgress.score}
                  </p>
                </div>
              )}

              <Button 
                className="w-full" 
                variant={scenario.userProgress?.status === 'completed' ? 'outline' : 'default'}
                asChild
              >
                <Link to={`/scenarios/${scenario.id}`}>
                  {scenario.userProgress?.status === 'completed' ? 'Review' : 
                   scenario.userProgress?.status === 'in_progress' ? 'Continue' : 'Start Scenario'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredScenarios.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No scenarios found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
