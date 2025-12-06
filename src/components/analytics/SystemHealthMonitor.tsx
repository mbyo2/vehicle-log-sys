import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Database, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: number;
  maxValue?: number;
  description: string;
}

export function SystemHealthMonitor() {
  const { data: healthData, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const oneDayAgo = subDays(new Date(), 1).toISOString();

      // Get error counts
      const { count: recentErrors } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo)
        .eq('resolved', false);

      // Get unresolved errors
      const { count: unresolvedErrors } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false);

      // Get active users (users with activity in last 7 days)
      const { count: activeUsers } = await supabase
        .from('user_activity_logs')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get pending notifications
      const { count: pendingNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      // Get documents expiring soon
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count: expiringDocs } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .gte('expiry_date', new Date().toISOString().split('T')[0]);

      return {
        recentErrors: recentErrors || 0,
        unresolvedErrors: unresolvedErrors || 0,
        activeUsers: activeUsers || 0,
        totalUsers: totalUsers || 0,
        pendingNotifications: pendingNotifications || 0,
        expiringDocs: expiringDocs || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_activity_logs')
        .select('action, created_at, details')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading system health...</div>;
  }

  const metrics: HealthMetric[] = [
    {
      name: 'System Errors (24h)',
      status: (healthData?.recentErrors || 0) === 0 ? 'healthy' : (healthData?.recentErrors || 0) > 5 ? 'critical' : 'warning',
      value: healthData?.recentErrors || 0,
      description: `${healthData?.unresolvedErrors || 0} unresolved total`,
    },
    {
      name: 'Active Users (7d)',
      status: 'healthy',
      value: healthData?.activeUsers || 0,
      maxValue: healthData?.totalUsers || 1,
      description: `of ${healthData?.totalUsers || 0} total users`,
    },
    {
      name: 'Pending Notifications',
      status: (healthData?.pendingNotifications || 0) > 50 ? 'warning' : 'healthy',
      value: healthData?.pendingNotifications || 0,
      description: 'unread notifications',
    },
    {
      name: 'Expiring Documents',
      status: (healthData?.expiringDocs || 0) > 10 ? 'warning' : 'healthy',
      value: healthData?.expiringDocs || 0,
      description: 'expiring in 30 days',
    },
  ];

  const getStatusIcon = (status: HealthMetric['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: HealthMetric['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">Healthy</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
    }
  };

  const overallStatus = metrics.some(m => m.status === 'critical') 
    ? 'critical' 
    : metrics.some(m => m.status === 'warning') 
      ? 'warning' 
      : 'healthy';

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>Real-time monitoring overview</CardDescription>
          </div>
          {getStatusBadge(overallStatus)}
        </CardHeader>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                {metric.name}
                {getStatusIcon(metric.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
              {metric.maxValue && (
                <Progress 
                  value={(metric.value / metric.maxValue) * 100} 
                  className="h-1 mt-2" 
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest system events</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.created_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
