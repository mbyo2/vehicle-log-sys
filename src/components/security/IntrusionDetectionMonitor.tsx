import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Activity, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SecurityUtils } from '@/lib/security';

interface SecurityEvent {
  id: string;
  event_type: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  event_data: any;
  user_id?: string;
  ip_address?: string;
}

interface ThreatMetrics {
  totalEvents: number;
  criticalThreats: number;
  suspiciousIPs: string[];
  failedLogins: number;
  lastScan: string;
}

export function IntrusionDetectionMonitor() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<ThreatMetrics>({
    totalEvents: 0,
    criticalThreats: 0,
    suspiciousIPs: [],
    failedLogins: 0,
    lastScan: new Date().toISOString()
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  const fetchSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      if (data) {
        setEvents(data);
        
        // Calculate threat metrics
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentEvents = data.filter(event => 
          new Date(event.created_at) > last24Hours
        );
        
        const criticalEvents = recentEvents.filter(event => 
          event.risk_level === 'critical' || event.risk_level === 'high'
        );
        
        const failedLogins = recentEvents.filter(event => 
          event.event_type === 'user_login_failure'
        ).length;
        
        const suspiciousIPs = [...new Set(
          recentEvents
            .filter(event => event.risk_level === 'high' || event.risk_level === 'critical')
            .map(event => event.ip_address)
            .filter(Boolean)
        )];

        setMetrics({
          totalEvents: recentEvents.length,
          criticalThreats: criticalEvents.length,
          suspiciousIPs,
          failedLogins,
          lastScan: now.toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching security events:', error);
    }
  };

  const detectAnomalies = () => {
    // Real-time anomaly detection
    const anomalies = [];
    
    // Check for unusual login patterns
    if (metrics.failedLogins > 10) {
      anomalies.push({
        type: 'brute_force_attempt',
        severity: 'high',
        description: `${metrics.failedLogins} failed login attempts detected in 24h`
      });
    }
    
    // Check for suspicious IP activity
    if (metrics.suspiciousIPs.length > 3) {
      anomalies.push({
        type: 'multiple_suspicious_ips',
        severity: 'medium',
        description: `${metrics.suspiciousIPs.length} suspicious IP addresses detected`
      });
    }
    
    // Check for critical events
    if (metrics.criticalThreats > 5) {
      anomalies.push({
        type: 'high_threat_activity',
        severity: 'critical',
        description: `${metrics.criticalThreats} critical security events in 24h`
      });
    }
    
    return anomalies;
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    fetchSecurityEvents();
    
    // Set up real-time monitoring
    const interval = setInterval(() => {
      fetchSecurityEvents();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (profile?.get()?.role === 'super_admin' || profile?.get()?.role === 'company_admin') {
      const cleanup = startMonitoring();
      return cleanup;
    }
  }, [profile]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const anomalies = detectAnomalies();

  if (profile?.get()?.role !== 'super_admin' && profile?.get()?.role !== 'company_admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Alert for critical anomalies */}
      {anomalies.filter(a => a.severity === 'critical').map((anomaly, index) => (
        <Alert key={index} variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Security Alert:</strong> {anomaly.description}
          </AlertDescription>
        </Alert>
      ))}

      {/* Threat Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.criticalThreats}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.failedLogins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious IPs</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.suspiciousIPs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={isMonitoring ? "default" : "secondary"}>
              {isMonitoring ? "Monitoring Active" : "Monitoring Inactive"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Last scan: {new Date(metrics.lastScan).toLocaleTimeString()}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.slice(0, 10).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getRiskColor(event.risk_level)}>
                      {event.risk_level}
                    </Badge>
                    <span className="font-medium">{event.event_type}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {event.ip_address && `IP: ${event.ip_address} • `}
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                  {event.event_data && Object.keys(event.event_data).length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {JSON.stringify(event.event_data, null, 2).substring(0, 100)}...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Detection Results */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detected Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anomalies.map((anomaly, index) => (
                <Alert key={index} variant={anomaly.severity === 'critical' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{anomaly.type}:</strong> {anomaly.description}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}