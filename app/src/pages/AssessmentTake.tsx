import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Question {
  id: number;
  type: string;
  question: string;
  options: string[];
  points: number;
}

interface AssessmentData {
  assessmentId: number;
  questions: Question[];
  timeLimit: number;
  totalQuestions: number;
  totalPoints: number;
}

export default function AssessmentTake() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      startAssessment();
    }
  }, [id]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const startAssessment = async () => {
    try {
      setIsLoading(true);
      const data = await api.startAssessment(Number(id));
      setAssessment(data);
      setTimeRemaining(data.timeLimit * 60);
    } catch (error) {
      toast.error('Failed to start assessment');
      navigate('/assessments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [assessment!.questions[currentQuestion].id]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestion < (assessment?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const timeSpent = (assessment!.timeLimit * 60) - timeRemaining;
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer
      }));

      const result = await api.submitAssessment(Number(id), formattedAnswers, timeSpent);
      
      if (result.passed) {
        toast.success(`Congratulations! You passed with ${result.percentage}%`);
      } else {
        toast.warning(`You scored ${result.percentage}%. Passing score is ${result.passingScore}%`);
      }
      
      navigate(`/assessments/${id}`);
    } catch (error) {
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => Object.keys(answers).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!assessment) return null;

  const question = assessment.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessment.questions.length) * 100;
  const isAnswered = answers[question.id] !== undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Assessment in Progress</h1>
          <p className="text-muted-foreground">
            Question {currentQuestion + 1} of {assessment.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Clock className="w-4 h-4 mr-2" />
            {formatTime(timeRemaining)}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{getAnsweredCount()} of {assessment.questions.length} answered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">Question {currentQuestion + 1}</Badge>
            <span className="text-sm text-muted-foreground">{question.points} points</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-medium">{question.question}</h3>
          
          <RadioGroup 
            value={answers[question.id]?.toString()} 
            onValueChange={(value) => handleAnswer(parseInt(value))}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
              <div 
                key={index} 
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                  answers[question.id] === index 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-accent'
                }`}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="flex-1 cursor-pointer font-normal"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentQuestion < assessment.questions.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={() => setShowSubmitDialog(true)}
              variant={getAnsweredCount() === assessment.questions.length ? 'default' : 'outline'}
            >
              <Flag className="w-4 h-4 mr-2" />
              Submit
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Question Navigator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Question Navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {assessment.questions.map((q, index) => (
              <Button
                key={q.id}
                variant={currentQuestion === index ? 'default' : answers[q.id] !== undefined ? 'secondary' : 'outline'}
                size="sm"
                className="w-10 h-10 p-0"
                onClick={() => setCurrentQuestion(index)}
              >
                {answers[q.id] !== undefined ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              {getAnsweredCount() < assessment.questions.length ? (
                <span className="flex items-center gap-2 text-orange-500">
                  <AlertCircle className="w-4 h-4" />
                  You have {assessment.questions.length - getAnsweredCount()} unanswered questions.
                </span>
              ) : (
                'You have answered all questions. Are you ready to submit?'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Assessment</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
