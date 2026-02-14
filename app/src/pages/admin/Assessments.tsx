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
  ClipboardCheck,
  Trash2,
  Edit,
  Clock,
  Trophy,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Assessment {
  id: number;
  title: string;
  description: string;
  category: string;
  passingScore: number;
  timeLimit: number;
  points: number;
  isActive: boolean;
}

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    description: '',
    category: 'fundamentals',
    passingScore: 70,
    timeLimit: 30,
    points: 100,
    questions: []
  });

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

  const handleCreateAssessment = async () => {
    try {
      await api.createAssessment(newAssessment);
      toast.success('Assessment created successfully');
      setShowCreateDialog(false);
      loadAssessments();
    } catch (error) {
      toast.error('Failed to create assessment');
    }
  };

  const handleDeleteAssessment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    
    try {
      await api.deleteAssessment(id);
      toast.success('Assessment deleted successfully');
      loadAssessments();
    } catch (error) {
      toast.error('Failed to delete assessment');
    }
  };

  const filteredAssessments = assessments.filter(assessment => 
    assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground mt-1">
            Manage skill assessments and quizzes
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assessment</DialogTitle>
              <DialogDescription>
                Add a new skill assessment to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newAssessment.title}
                  onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newAssessment.description}
                  onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full p-2 border rounded-md"
                  value={newAssessment.category}
                  onChange={(e) => setNewAssessment({ ...newAssessment, category: e.target.value })}
                >
                  <option value="fundamentals">Fundamentals</option>
                  <option value="log_analysis">Log Analysis</option>
                  <option value="incident_response">Incident Response</option>
                  <option value="threat_hunting">Threat Hunting</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passingScore">Passing Score (%)</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min="0"
                    max="100"
                    value={newAssessment.passingScore}
                    onChange={(e) => setNewAssessment({ ...newAssessment, passingScore: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (min)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={newAssessment.timeLimit}
                    onChange={(e) => setNewAssessment({ ...newAssessment, timeLimit: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newAssessment.points}
                    onChange={(e) => setNewAssessment({ ...newAssessment, points: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAssessment}>Create Assessment</Button>
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
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Assessments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssessments.map((assessment) => (
          <Card key={assessment.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{assessment.title}</CardTitle>
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
                      onClick={() => handleDeleteAssessment(assessment.id)}
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
                {assessment.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="capitalize">
                  {assessment.category}
                </Badge>
                <Badge variant="outline">
                  <Target className="w-3 h-3 mr-1" />
                  Pass: {assessment.passingScore}%
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {assessment.timeLimit} min
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {assessment.points} pts
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
