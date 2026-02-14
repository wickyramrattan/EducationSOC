import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Mail,
  FileText,
  Activity,
  Globe,
  Terminal
} from 'lucide-react';
import { toast } from 'sonner';

interface Scenario {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTime: number;
  points: number;
  content: {
    email?: {
      from: string;
      to: string;
      subject: string;
      date: string;
      headers: Record<string, string>;
      body: string;
    };
    logs?: Array<{
      timestamp: string;
      source: string;
      event: string;
      severity: string;
    }>;
    alerts?: Array<{
      id: string;
      timestamp: string;
      source: string;
      severity: string;
      description: string;
    }>;
    endpoint_logs?: Array<{
      timestamp: string;
      process: string;
      user: string;
      action: string;
      details: string;
    }>;
    network_logs?: Array<{
      timestamp: string;
      src_ip: string;
      dst_ip: string;
      port: number;
      protocol: string;
      bytes: number;
    }>;
    [key: string]: unknown;
  };
  hints: string[];
  progress?: {
    status: string;
    score: number;
    attempts: number;
  };
}

export default function ScenarioDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [answers, setAnswers] = useState({
    isPhishing: false,
    indicators: [] as string[],
    action: ''
  });
  const [result, setResult] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    feedback: Array<{ correct: boolean; message: string }>;
    solution?: unknown;
  } | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      loadScenario();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const loadScenario = async () => {
    try {
      setIsLoading(true);
      const data = await api.getScenario(Number(id));
      setScenario(data);
      setStartTime(Date.now());
      
      // If already completed, show results
      if (data.progress?.status === 'completed') {
        // Load previous results
      }
    } catch (error) {
      toast.error('Failed to load scenario');
      navigate('/scenarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetHint = async () => {
    try {
      const hint = await api.getHint(Number(id), hintsUsed);
      setCurrentHint(hint.hint);
      setHintsUsed(hintsUsed + 1);
      toast.info(`Hint ${hint.hintNumber}/${hint.totalHints} (Penalty: -${hint.penalty} points)`);
    } catch (error) {
      toast.error('No more hints available');
    }
  };

  const handleSubmit = async () => {
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const response = await api.submitScenario(Number(id), answers, timeSpent);
      setResult(response);
      
      if (response.passed) {
        toast.success(`Scenario completed! Score: ${response.score}/${response.maxScore}`);
      } else {
        toast.warning(`Try again! Score: ${response.score}/${response.maxScore}`);
      }
    } catch (error) {
      toast.error('Failed to submit scenario');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'warning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'info': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!scenario) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/scenarios')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{scenario.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="capitalize">{scenario.category}</Badge>
              <Badge variant="outline" className={`capitalize ${
                scenario.difficulty === 'beginner' ? 'bg-green-500/10 text-green-500' :
                scenario.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-red-500/10 text-red-500'
              }`}>
                {scenario.difficulty}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {scenario.estimatedTime} min
              </span>
              <span className="text-sm text-muted-foreground flex items-center">
                <Trophy className="w-3 h-3 mr-1" />
                {scenario.points} pts
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={handleGetHint} disabled={hintsUsed >= (scenario.hints?.length || 0)}>
          <Lightbulb className="w-4 h-4 mr-2" />
          Get Hint ({hintsUsed}/{scenario.hints?.length || 0})
        </Button>
      </div>

      {/* Hint Alert */}
      {currentHint && (
        <Alert className="bg-yellow-500/10 border-yellow-500/20">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <AlertTitle>Hint</AlertTitle>
          <AlertDescription>{currentHint}</AlertDescription>
        </Alert>
      )}

      {/* Result Alert */}
      {result && (
        <Alert className={result.passed ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'}>
          {result.passed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-orange-500" />}
          <AlertTitle>{result.passed ? 'Scenario Completed!' : 'Try Again'}</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Score: {result.score}/{result.maxScore} ({result.percentage}%)</p>
            <div className="space-y-1">
              {result.feedback.map((fb, i) => (
                <div key={i} className={`flex items-center gap-2 ${fb.correct ? 'text-green-500' : 'text-orange-500'}`}>
                  {fb.correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span className="text-sm">{fb.message}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Evidence Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Evidence & Logs
              </CardTitle>
              <CardDescription>Analyze the following information to solve the scenario</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  {scenario.content?.email && <TabsTrigger value="email">Email</TabsTrigger>}
                  {scenario.content?.logs && <TabsTrigger value="logs">Logs</TabsTrigger>}
                  {scenario.content?.alerts && <TabsTrigger value="alerts">Alerts</TabsTrigger>}
                  {scenario.content?.endpoint_logs && <TabsTrigger value="endpoint">Endpoint</TabsTrigger>}
                  {scenario.content?.network_logs && <TabsTrigger value="network">Network</TabsTrigger>}
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Scenario Description</h4>
                    <p className="text-muted-foreground">{scenario.description}</p>
                  </div>
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTitle>Your Task</AlertTitle>
                    <AlertDescription>
                      Analyze the available evidence and answer the questions below. 
                      Use the tabs above to review different types of evidence.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                {scenario.content?.email && (
                  <TabsContent value="email">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Mail className="w-4 h-4" />
                          Email Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">From:</span>
                            <p className="font-mono">{scenario.content.email.from}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">To:</span>
                            <p className="font-mono">{scenario.content.email.to}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Subject:</span>
                            <p>{scenario.content.email.subject}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <p>{scenario.content.email.date}</p>
                          </div>
                        </div>
                        <div className="border-t pt-4">
                          <span className="text-muted-foreground text-sm">Headers:</span>
                          <div className="mt-2 space-y-1 text-sm font-mono bg-muted p-3 rounded">
                            {Object.entries(scenario.content.email.headers).map(([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <span className="text-primary">{key}:</span>
                                <span>{value as string}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="border-t pt-4">
                          <span className="text-muted-foreground text-sm">Body:</span>
                          <div className="mt-2 p-4 bg-white dark:bg-black rounded border whitespace-pre-wrap font-mono text-sm">
                            {scenario.content.email.body}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {scenario.content?.logs && (
                  <TabsContent value="logs">
                    <div className="space-y-2">
                      {scenario.content.logs.map((log, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <Badge variant="outline" className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium">{log.event}</p>
                            <p className="text-sm text-muted-foreground">
                              {log.timestamp} • {log.source}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {scenario.content?.alerts && (
                  <TabsContent value="alerts">
                    <div className="space-y-2">
                      {scenario.content.alerts.map((alert, index) => (
                        <Alert key={index} className={getSeverityColor(alert.severity)}>
                          <AlertTriangle className="w-4 h-4" />
                          <AlertTitle className="flex items-center justify-between">
                            <span>{alert.id}</span>
                            <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                          </AlertTitle>
                          <AlertDescription>
                            <p>{alert.description}</p>
                            <p className="text-sm mt-1">{alert.timestamp} • {alert.source}</p>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {scenario.content?.endpoint_logs && (
                  <TabsContent value="endpoint">
                    <div className="space-y-2">
                      {scenario.content.endpoint_logs.map((log, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg font-mono text-sm">
                          <Terminal className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{log.timestamp}</span>
                          <span className="text-primary">{log.process}</span>
                          <span>{log.action}</span>
                          <span className="text-muted-foreground">{log.details}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {scenario.content?.network_logs && (
                  <TabsContent value="network">
                    <div className="space-y-2">
                      {scenario.content.network_logs.map((log, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg font-mono text-sm">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{log.timestamp}</span>
                          <span className="text-green-500">{log.src_ip}</span>
                          <span>→</span>
                          <span className="text-red-500">{log.dst_ip}:{log.port}</span>
                          <Badge variant="outline">{log.protocol}</Badge>
                          <span className="text-muted-foreground">{log.bytes} bytes</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Questions Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Analysis Questions
              </CardTitle>
              <CardDescription>Answer based on your analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question 1: Is this a threat? */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Is this a security threat?</Label>
                <RadioGroup 
                  value={answers.isPhishing ? 'yes' : 'no'} 
                  onValueChange={(value) => setAnswers({ ...answers, isPhishing: value === 'yes' })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="threat-yes" />
                    <Label htmlFor="threat-yes">Yes, this is a threat</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="threat-no" />
                    <Label htmlFor="threat-no">No, this is legitimate</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Question 2: Indicators */}
              <div className="space-y-3">
                <Label className="text-base font-medium">What indicators support your conclusion?</Label>
                <Textarea
                  placeholder="List the indicators you identified (one per line)..."
                  value={answers.indicators.join('\n')}
                  onChange={(e) => setAnswers({ ...answers, indicators: e.target.value.split('\n').filter(i => i.trim()) })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Enter each indicator on a new line
                </p>
              </div>

              {/* Question 3: Action */}
              <div className="space-y-3">
                <Label className="text-base font-medium">What action should be taken?</Label>
                <RadioGroup 
                  value={answers.action} 
                  onValueChange={(value) => setAnswers({ ...answers, action: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quarantine_and_alert" id="action-quarantine" />
                    <Label htmlFor="action-quarantine">Quarantine and alert</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monitor_only" id="action-monitor" />
                    <Label htmlFor="action-monitor">Monitor only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no_action" id="action-none" />
                    <Label htmlFor="action-none">No action needed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="escalate" id="action-escalate" />
                    <Label htmlFor="action-escalate">Escalate to senior analyst</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleSubmit}
                disabled={!answers.action}
              >
                <Play className="w-4 h-4 mr-2" />
                Submit Analysis
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
