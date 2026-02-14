import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Target,
  CheckCircle,
  XCircle,
  Play,
  FileText,
  BarChart3
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
  userAssessment?: {
    status: 'not_started' | 'in_progress' | 'completed';
    score: number;
    passed: boolean;
  };
}

export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAssessment();
    }
  }, [id]);

  const loadAssessment = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAssessment(Number(id));
      setAssessment(data);
    } catch (error) {
      toast.error('Failed to load assessment');
      navigate('/assessments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = () => {
    navigate(`/assessments/${id}/take`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!assessment) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/assessments')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{assessment.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="capitalize">{assessment.category}</Badge>
              <span className="text-sm text-muted-foreground flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {assessment.timeLimit} min
              </span>
              <span className="text-sm text-muted-foreground flex items-center">
                <Trophy className="w-3 h-3 mr-1" />
                {assessment.points} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{assessment.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Assessment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Passing Score</p>
                  <p className="text-2xl font-bold">{assessment.passingScore}%</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Time Limit</p>
                  <p className="text-2xl font-bold">{assessment.timeLimit} min</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold">{assessment.points}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold">Multiple Choice</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {assessment.userAssessment?.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Your Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-4 rounded-lg ${assessment.userAssessment.passed ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {assessment.userAssessment.passed ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-orange-500" />
                    )}
                    <span className={`text-xl font-bold ${assessment.userAssessment.passed ? 'text-green-500' : 'text-orange-500'}`}>
                      {assessment.userAssessment.passed ? 'Passed!' : 'Failed'}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Your Score: <span className="font-bold">{assessment.userAssessment.score}%</span>
                    {' '}({assessment.userAssessment.passed ? 'Meets' : 'Below'} passing score of {assessment.passingScore}%)
                  </p>
                </div>
                <Progress 
                  value={assessment.userAssessment.score} 
                  className="h-3"
                />
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/assessments/${id}/results`}>View Detailed Results</Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Ready to Start?</CardTitle>
              <CardDescription>
                {assessment.userAssessment?.status === 'completed' 
                  ? 'You can retake this assessment to improve your score'
                  : 'Make sure you have enough time to complete the assessment'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Time Limit</p>
                  <p className="text-sm text-muted-foreground">{assessment.timeLimit} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Target className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Passing Score</p>
                  <p className="text-sm text-muted-foreground">{assessment.passingScore}% required</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Trophy className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Points</p>
                  <p className="text-sm text-muted-foreground">Earn up to {assessment.points} points</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleStart}
              >
                <Play className="w-4 h-4 mr-2" />
                {assessment.userAssessment?.status === 'completed' ? 'Retake Assessment' : 'Start Assessment'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
