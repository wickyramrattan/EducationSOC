import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  BookOpen,
  Trash2,
  Edit,
  Clock,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Scenario {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTime: number;
  points: number;
  isActive: boolean;
}

export default function AdminScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newScenario, setNewScenario] = useState({
    title: '',
    description: '',
    category: 'phishing',
    difficulty: 'beginner',
    estimatedTime: 15,
    points: 100,
    content: {},
    solution: {},
    hints: []
  });

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      setIsLoading(true);
      const data = await api.getScenarios();
      setScenarios(data);
    } catch (error) {
      toast.error('Failed to load scenarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateScenario = async () => {
    try {
      await api.createScenario(newScenario);
      toast.success('Scenario created successfully');
      setShowCreateDialog(false);
      loadScenarios();
    } catch (error) {
      toast.error('Failed to create scenario');
    }
  };

  const handleDeleteScenario = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;
    
    try {
      await api.deleteScenario(id);
      toast.success('Scenario deleted successfully');
      loadScenarios();
    } catch (error) {
      toast.error('Failed to delete scenario');
    }
  };

  const filteredScenarios = scenarios.filter(scenario => 
    scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scenario.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-500';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500';
      case 'advanced': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scenarios</h1>
          <p className="text-muted-foreground mt-1">
            Manage training scenarios and content
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Scenario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Scenario</DialogTitle>
              <DialogDescription>
                Add a new training scenario to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newScenario.title}
                  onChange={(e) => setNewScenario({ ...newScenario, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newScenario.description}
                  onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full p-2 border rounded-md"
                    value={newScenario.category}
                    onChange={(e) => setNewScenario({ ...newScenario, category: e.target.value })}
                  >
                    <option value="phishing">Phishing</option>
                    <option value="malware">Malware</option>
                    <option value="network">Network</option>
                    <option value="web">Web</option>
                    <option value="insider">Insider Threat</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    className="w-full p-2 border rounded-md"
                    value={newScenario.difficulty}
                    onChange={(e) => setNewScenario({ ...newScenario, difficulty: e.target.value })}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Estimated Time (min)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={newScenario.estimatedTime}
                    onChange={(e) => setNewScenario({ ...newScenario, estimatedTime: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newScenario.points}
                    onChange={(e) => setNewScenario({ ...newScenario, points: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateScenario}>Create Scenario</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Scenarios Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredScenarios.map((scenario) => (
          <Card key={scenario.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{scenario.title}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDeleteScenario(scenario.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {scenario.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="capitalize">
                  {scenario.category}
                </Badge>
                <Badge className={`capitalize ${getDifficultyColor(scenario.difficulty)}`}>
                  {scenario.difficulty}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {scenario.estimatedTime} min
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {scenario.points} pts
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
