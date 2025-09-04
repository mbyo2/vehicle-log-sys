import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Users, 
  Lock, 
  Eye,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SecurityEvent {
  id: string;
  event_type: string;
  event_details: any;
  created_at: string;
  risk_score: number;
  ip_address?: string;
  user_agent?: string;
}

interface UserSession {
  id: string;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  last_activity: string;
  is_active: boolean;
}

export function SecurityDashboard() {
  const { profile, hasPermission } = useEnhancedAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const canViewSecurity = hasPermission('security', 'read') || 
                         profile?.role === 'super_admin' || 
                         profile?.role === 'company_admin';

  const fetchSecurityData = async () => {
    if (!canViewSecurity) return;
    
    try {
      setRefreshing(true);
      
      // Fetch security events
      const { data: events, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) {
        console.error('Error fetching security events:', eventsError);
      } else {
        setSecurityEvents(events || []);
      }

      // Fetch active sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
      } else {
        setActiveSessions(sessions || []);
      }
    } catch (error) {
      console.error('Security data fetch failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [canViewSecurity]);

  const getRiskLevelColor = (riskScore: number) => {
    if (riskScore >= 80) return 'destructive';
    if (riskScore >= 60) return 'yellow';
    if (riskScore >= 40) return 'orange';
    return 'green';
  };

  const getEventTypeIcon = (eventType: string) => {
    if (eventType.includes('signin')) return <Users className="h-4 w-4" />;
    if (eventType.includes('profile')) return <Eye className="h-4 w-4" />;
    if (eventType.includes('mfa')) return <Lock className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  if (!canViewSecurity) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view security information.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor security events and user sessions
          </p>
        </div>
        <Button 
          onClick={fetchSecurityData} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Security Events
              </CardTitle>
              <CardDescription>
                Monitor authentication and security-related activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading security events...</div>
              ) : securityEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No security events found
                </div>
              ) : (
                <div className="space-y-4">
                  {securityEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getEventTypeIcon(event.event_type)}
                        <div>
                          <div className="font-medium">{event.event_type}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                          </div>
                          {event.ip_address && (
                            <div className="text-xs text-muted-foreground">
                              IP: {event.ip_address}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={getRiskLevelColor(event.risk_score) as any}>
                        Risk: {event.risk_score}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Active User Sessions
              </CardTitle>
              <CardDescription>
                View and manage currently active user sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading active sessions...</div>
              ) : activeSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active sessions found
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div 
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">Session {session.id.slice(0, 8)}...</div>
                        <div className="text-sm text-muted-foreground">
                          Last activity: {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })}
                        </div>
                        {session.ip_address && (
                          <div className="text-xs text-muted-foreground">
                            IP: {session.ip_address}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Security Events (24h)
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securityEvents.filter(e => 
                    new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Sessions
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSessions.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  High Risk Events
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securityEvents.filter(e => e.risk_score >= 80).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Failed Logins (24h)
                </CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securityEvents.filter(e => 
                    e.event_type.includes('signin_failed') &&
                    new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}