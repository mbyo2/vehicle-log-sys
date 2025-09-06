import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Eye, TrendingUp } from 'lucide-react';

interface SecurityMetric {
  metric_name: string;
  metric_value: number;
  metric_description: string;
  risk_level: string;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  created_at: string;
  risk_level: string;
  event_data: any;
}

export function SecurityMonitoringDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { createBackup, isLogging } = useSecurityMonitoring();

  useEffect(() => {
    loadSecurityData();
    
    // Set up real-time monitoring
    const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      // Load security metrics
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_security_metrics');
      
      if (metricsError) throw metricsError;
      
      // Load recent security events
      const { data: eventsData, error: eventsError } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (eventsError) throw eventsError;
      
      setMetrics(metricsData || []);
      setRecentEvents(eventsData || []);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleCreateBackup = () => {
    createBackup('manual');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time security metrics and event monitoring
          </p>
        </div>
        <Button onClick={handleCreateBackup} disabled={isLogging}>
          <Shield className="w-4 h-4 mr-2" />
          Create Backup
        </Button>
      </div>

      {/* Security Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.metric_name}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={getRiskBadgeVariant(metric.risk_level)}>
                  {metric.risk_level}
                </Badge>
                {metric.risk_level === 'high' ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.metric_value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.metric_description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Recent Security Events
          </CardTitle>
          <CardDescription>
            Latest security events and audit logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No recent security events
              </p>
            ) : (
              recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{event.event_type}</span>
                      <Badge variant={getRiskBadgeVariant(event.risk_level)}>
                        {event.risk_level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                  {event.event_data && Object.keys(event.event_data).length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {JSON.stringify(event.event_data).length > 50
                        ? `${JSON.stringify(event.event_data).substring(0, 50)}...`
                        : JSON.stringify(event.event_data)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}