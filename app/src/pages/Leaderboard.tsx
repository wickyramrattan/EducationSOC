import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/store/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Trophy, 
  Medal, 
  Award,
  Star,
  TrendingUp,
  BookOpen,
  ClipboardCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface LeaderboardEntry {
  id: number;
  username: string;
  fullName: string;
  totalScore: number;
  scenariosCompleted: number;
  assessmentsPassed: number;
  rank: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const data = await api.getLeaderboard(50);
      setEntries(data);
    } catch (error) {
      toast.error('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500/10 border-yellow-500/30';
      case 2: return 'bg-gray-500/10 border-gray-500/30';
      case 3: return 'bg-amber-600/10 border-amber-600/30';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentUserEntry = entries.find(e => e.id === user?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">
          Top performers in the SOC Training Platform
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {entries.slice(0, 3).map((entry, index) => (
          <Card 
            key={entry.id} 
            className={`text-center ${getRankStyle(entry.rank)} ${entry.rank === 1 ? 'md:order-2 md:scale-110' : entry.rank === 2 ? 'md:order-1' : 'md:order-3'}`}
          >
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                {getRankIcon(entry.rank)}
              </div>
              <Avatar className="w-16 h-16 mx-auto mb-4">
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {entry.fullName?.charAt(0) || entry.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg">{entry.fullName || entry.username}</h3>
              <p className="text-muted-foreground text-sm">@{entry.username}</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold">{entry.totalScore.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">points</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {entry.scenariosCompleted}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardCheck className="w-3 h-3" />
                    {entry.assessmentsPassed}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Full Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {entries.slice(3).map((entry) => (
              <div 
                key={entry.id} 
                className={`flex items-center gap-4 p-3 rounded-lg ${entry.id === user?.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'}`}
              >
                <div className="w-8 text-center font-bold text-muted-foreground">
                  {entry.rank}
                </div>
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {entry.fullName?.charAt(0) || entry.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {entry.fullName || entry.username}
                    {entry.id === user?.id && (
                      <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">@{entry.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{entry.totalScore.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Your Ranking */}
      {currentUserEntry && currentUserEntry.rank > 3 && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-sm">Your Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-8 text-center font-bold text-primary">
                #{currentUserEntry.rank}
              </div>
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentUserEntry.fullName?.charAt(0) || currentUserEntry.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{currentUserEntry.fullName || currentUserEntry.username}</p>
                <p className="text-sm text-muted-foreground">
                  {currentUserEntry.scenariosCompleted} scenarios • {currentUserEntry.assessmentsPassed} assessments
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{currentUserEntry.totalScore.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">total points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
