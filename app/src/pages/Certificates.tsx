import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Download, 
  Share2, 
  CheckCircle,
  Lock,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';

interface Certificate {
  id: number;
  title: string;
  description: string;
  issuedAt: string;
  certificateId: string;
}

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setIsLoading(true);
      const profile = await api.getProfile();
      setCertificates(profile.certificates || []);
    } catch (error) {
      toast.error('Failed to load certificates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (cert: Certificate) => {
    toast.info('Certificate download feature coming soon!');
  };

  const handleShare = (cert: Certificate) => {
    navigator.clipboard.writeText(`I earned the ${cert.title} certificate on SOC Training Platform! Certificate ID: ${cert.certificateId}`);
    toast.success('Certificate info copied to clipboard!');
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
          <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
          <p className="text-muted-foreground mt-1">
            Showcase your achievements and earned credentials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-muted-foreground">
            {certificates.length} certificates earned
          </span>
        </div>
      </div>

      {/* Certificates Grid */}
      {certificates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Card key={cert.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                    Verified
                  </Badge>
                </div>
                <CardTitle className="mt-4">{cert.title}</CardTitle>
                <CardDescription>{cert.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Certificate ID</p>
                  <p className="font-mono text-sm">{cert.certificateId}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="w-4 h-4" />
                  <span>Issued on {new Date(cert.issuedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
              <div className="p-4 pt-0 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleDownload(cert)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleShare(cert)}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Complete assessments and training scenarios to earn certificates. 
              Certificates are awarded when you pass all assessments in a category.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild>
                <a href="/assessments">Take Assessments</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/scenarios">Practice Scenarios</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How to Earn */}
      <Card>
        <CardHeader>
          <CardTitle>How to Earn Certificates</CardTitle>
          <CardDescription>Complete these requirements to earn credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                <span className="font-bold text-blue-500">1</span>
              </div>
              <h4 className="font-medium mb-1">Complete Scenarios</h4>
              <p className="text-sm text-muted-foreground">
                Practice with real-world SOC scenarios to build your skills
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                <span className="font-bold text-purple-500">2</span>
              </div>
              <h4 className="font-medium mb-1">Pass Assessments</h4>
              <p className="text-sm text-muted-foreground">
                Take and pass all assessments in a category
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                <span className="font-bold text-green-500">3</span>
              </div>
              <h4 className="font-medium mb-1">Earn Certificate</h4>
              <p className="text-sm text-muted-foreground">
                Receive your verified certificate automatically
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
