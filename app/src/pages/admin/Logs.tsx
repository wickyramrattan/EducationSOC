import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  User, 
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  LogIn,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';

interface LogEntry {
  id: number;
  userId: number;
  username: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const data = await api.getLogs(100);
      setLogs(data);
    } catch (error) {
      toast.error('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return <LogIn className="w-4 h-4 text-green-500" />;
      case 'logout': return <LogOut className="w-4 h-4 text-blue-500" />;
      case 'create': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'delete': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return 'bg-green-500/10 text-green-500';
      case 'logout': return 'bg-blue-500/10 text-blue-500';
      case 'create': return 'bg-green-500/10 text-green-500';
      case 'update': return 'bg-yellow-500/10 text-yellow-500';
      case 'delete': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted';
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground mt-1">
          Monitor platform activity and user actions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Entries</p>
            <p className="text-2xl font-bold">{logs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Unique Users</p>
            <p className="text-2xl font-bold">
              {new Set(logs.map(l => l.userId)).size}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Logins Today</p>
            <p className="text-2xl font-bold">
              {logs.filter(l => l.action === 'login' && 
                new Date(l.createdAt).toDateString() === new Date().toDateString()).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Actions Today</p>
            <p className="text-2xl font-bold">
              {logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-medium">Time</th>
                  <th className="text-left p-4 font-medium">User</th>
                  <th className="text-left p-4 font-medium">Action</th>
                  <th className="text-left p-4 font-medium">Details</th>
                  <th className="text-left p-4 font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{log.username}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {log.details || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-mono text-muted-foreground">
                        {log.ipAddress || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {logs.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No activity logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
