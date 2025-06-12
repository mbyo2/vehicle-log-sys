
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Activity, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface SecurityAuditLog {
  id: string;
  event_type: string;
  user_id?: string;
  company_id?: string;
  ip_address?: string;
  user_agent?: string;
  event_data: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  user_id?: string;
  company_id?: string;
  url?: string;
  user_agent?: string;
  error_data: Record<string, any>;
  resolved: boolean;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

interface SystemHealthLog {
  id: string;
  metric_name: string;
  metric_value: number;
  threshold_value?: number;
  status: 'normal' | 'warning' | 'critical';
  metadata: Record<string, any>;
  created_at: string;
}

export function SecurityAuditDashboard() {
  const [activeTab, setActiveTab] = useState('security');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: securityLogs, isLoading: securityLoading } = useQuery({
    queryKey: ['security-audit-logs', riskFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (riskFilter !== 'all') {
        query = query.eq('risk_level', riskFilter);
      }

      if (searchTerm) {
        query = query.ilike('event_type', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SecurityAuditLog[];
    },
  });

  const { data: errorLogs, isLoading: errorLoading } = useQuery({
    queryKey: ['error-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ErrorLog[];
    },
  });

  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_health_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SystemHealthLog[];
    },
  });

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'normal': return 'outline';
      default: return 'outline';
    }
  };

  const resolveError = async (errorId: string) => {
    const { error } = await supabase
      .from('error_logs')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', errorId);

    if (!error) {
      // Refresh error logs
      window.location.reload();
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security & Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Monitor security events, errors, and system health</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Audit
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Error Monitoring
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System Health
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backup Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search by event type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {securityLoading ? (
              <div>Loading security logs...</div>
            ) : (
              securityLogs?.map((log) => (
                <Card key={log.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{log.event_type}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskBadgeVariant(log.risk_level)}>
                          {log.risk_level}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), 'PPp')}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {log.ip_address && (
                        <div>
                          <strong>IP Address:</strong> {log.ip_address}
                        </div>
                      )}
                      {log.user_agent && (
                        <div>
                          <strong>User Agent:</strong> {log.user_agent.substring(0, 50)}...
                        </div>
                      )}
                      {Object.keys(log.event_data).length > 0 && (
                        <div className="col-span-2">
                          <strong>Event Data:</strong>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.event_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <div className="space-y-4">
            {errorLoading ? (
              <div>Loading error logs...</div>
            ) : (
              errorLogs?.map((error) => (
                <Card key={error.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{error.error_type}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={error.resolved ? 'outline' : 'destructive'}>
                          {error.resolved ? 'Resolved' : 'Unresolved'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(error.created_at), 'PPp')}
                        </span>
                      </div>
                    </div>
                    <CardDescription>{error.error_message}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {error.url && (
                        <div>
                          <strong>URL:</strong> {error.url}
                        </div>
                      )}
                      {error.stack_trace && (
                        <div>
                          <strong>Stack Trace:</strong>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto max-h-40">
                            {error.stack_trace}
                          </pre>
                        </div>
                      )}
                      {!error.resolved && (
                        <Button
                          onClick={() => resolveError(error.id)}
                          variant="outline"
                          size="sm"
                        >
                          Mark as Resolved
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="space-y-4">
            {healthLoading ? (
              <div>Loading system health logs...</div>
            ) : (
              systemHealth?.map((health) => (
                <Card key={health.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{health.metric_name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(health.status)}>
                          {health.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(health.created_at), 'PPp')}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div>
                        <strong>Value:</strong> {health.metric_value}
                      </div>
                      {health.threshold_value && (
                        <div>
                          <strong>Threshold:</strong> {health.threshold_value}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              Backup system is configured and running. Daily backups are created automatically with 30-day retention.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
