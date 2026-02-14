export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'student' | 'admin';
  createdAt: string;
  lastLogin?: string;
}

export interface Skill {
  name: string;
  description: string;
  category: 'technical' | 'soft';
  level: number;
  xp: number;
}

export interface Scenario {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  points: number;
  content?: ScenarioContent;
  hints?: string[];
  userProgress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    score: number;
    attempts: number;
  };
}

export interface ScenarioContent {
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
}

export interface Assessment {
  id: number;
  title: string;
  description: string;
  category: string;
  passingScore: number;
  timeLimit: number;
  points: number;
  questions?: Question[];
  userProgress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    score: number;
    passed: boolean;
  };
}

export interface Question {
  id: number;
  type: 'multiple_choice' | 'true_false' | 'text';
  question: string;
  options?: string[];
  correctAnswer?: number | string | boolean;
  points: number;
}

export interface UserProgress {
  totalScenarios: number;
  completedScenarios: number;
  inProgressScenarios: number;
  totalScore: number;
  totalTime: number;
}

export interface Certificate {
  id: number;
  title: string;
  description: string;
  issuedAt: string;
  expiresAt?: string;
  certificateId: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  fullName: string;
  totalScore: number;
  scenariosCompleted: number;
  assessmentsPassed: number;
  rank: number;
}

export interface DashboardStats {
  users: {
    totalUsers: number;
    students: number;
    admins: number;
    newToday: number;
  };
  scenarios: {
    totalScenarios: number;
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  progress: {
    totalAttempts: number;
    completed: number;
    averageScore: number;
    totalTimeSpent: number;
  };
  assessments: {
    totalAttempts: number;
    passed: number;
    averageScore: number;
  };
}

export interface ActivityLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  details: string;
  createdAt: string;
}
