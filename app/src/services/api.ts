import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(username: string, password: string) {
    const data = await this.request<{ token: string; user: unknown }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(data.token);
    return data;
  }

  async register(username: string, email: string, password: string, fullName?: string) {
    const data = await this.request<{ token: string; user: unknown }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, fullName })
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request<{ user: unknown; skills: unknown; progress: unknown }>('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  // Scenarios endpoints
  async getScenarios(category?: string, difficulty?: string) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (difficulty) params.append('difficulty', difficulty);
    return this.request(`/scenarios?${params}`);
  }

  async getScenarioCategories() {
    return this.request('/scenarios/categories');
  }

  async getScenario(id: number) {
    return this.request(`/scenarios/${id}`);
  }

  async submitScenario(id: number, answers: unknown, timeSpent: number) {
    return this.request(`/scenarios/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, timeSpent })
    });
  }

  async getHint(id: number, hintIndex: number) {
    return this.request(`/scenarios/${id}/hint?hintIndex=${hintIndex}`);
  }

  // Assessments endpoints
  async getAssessments(category?: string) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    return this.request(`/assessments?${params}`);
  }

  async getAssessment(id: number) {
    return this.request(`/assessments/${id}`);
  }

  async startAssessment(id: number) {
    return this.request(`/assessments/${id}/start`, {
      method: 'POST'
    });
  }

  async submitAssessment(id: number, answers: unknown[], timeSpent: number) {
    return this.request(`/assessments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, timeSpent })
    });
  }

  async getAssessmentResults(id: number) {
    return this.request(`/assessments/${id}/results`);
  }

  // User endpoints
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(fullName?: string, email?: string) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName, email })
    });
  }

  async getLeaderboard(limit?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    return this.request(`/users/leaderboard?${params}`);
  }

  async getAchievements() {
    return this.request('/users/achievements');
  }

  // Progress endpoints
  async getProgressOverview() {
    return this.request('/progress/overview');
  }

  async getScenarioProgress() {
    return this.request('/progress/scenarios');
  }

  async getAssessmentProgress() {
    return this.request('/progress/assessments');
  }

  async getRecommendations() {
    return this.request('/progress/recommendations');
  }

  async getSkillsProgress() {
    return this.request('/progress/skills');
  }

  // Admin endpoints
  async getDashboardStats() {
    return this.request('/admin/dashboard');
  }

  async getUsers(role?: string, search?: string) {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    return this.request(`/admin/users?${params}`);
  }

  async createUser(userData: unknown) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(id: number, userData: unknown) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(id: number) {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  }

  async createScenario(scenarioData: unknown) {
    return this.request('/admin/scenarios', {
      method: 'POST',
      body: JSON.stringify(scenarioData)
    });
  }

  async updateScenario(id: number, scenarioData: unknown) {
    return this.request(`/admin/scenarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scenarioData)
    });
  }

  async deleteScenario(id: number) {
    return this.request(`/admin/scenarios/${id}`, {
      method: 'DELETE'
    });
  }

  async createAssessment(assessmentData: unknown) {
    return this.request('/admin/assessments', {
      method: 'POST',
      body: JSON.stringify(assessmentData)
    });
  }

  async updateAssessment(id: number, assessmentData: unknown) {
    return this.request(`/admin/assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assessmentData)
    });
  }

  async deleteAssessment(id: number) {
    return this.request(`/admin/assessments/${id}`, {
      method: 'DELETE'
    });
  }

  async getLogs(limit?: number, userId?: number, action?: string) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (userId) params.append('userId', userId.toString());
    if (action) params.append('action', action);
    return this.request(`/admin/logs?${params}`);
  }
}

export const api = new ApiService();
