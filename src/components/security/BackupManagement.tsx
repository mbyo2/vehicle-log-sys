
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Database, Download, RefreshCw, Calendar, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BackupLog {
  id: string;
  company_id?: string;
  backup_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  file_path?: string;
  size_bytes?: number;
  backup_frequency: string;
  retention_days: number;
  encryption_enabled: boolean;
}

export function BackupManagement() {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: backupLogs, isLoading } = useQuery({
    queryKey: ['backup-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as BackupLog[];
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: async (backupType: string) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = user.user ? await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.user.id)
        .single() : { data: null };

      const { data, error } = await supabase.rpc('create_backup', {
        p_company_id: profile?.company_id || null,
        p_backup_type: backupType,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Backup Created",
        description: "Manual backup has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['backup-logs'] });
      setIsCreatingBackup(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Backup Failed",
        description: error.message || "Failed to create backup.",
      });
      setIsCreatingBackup(false);
    },
  });

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    createBackupMutation.mutate('manual');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'manual':
        return <Database className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Backup Management</h2>
          <p className="text-muted-foreground">Monitor and manage data backups</p>
        </div>
        <Button 
          onClick={handleCreateBackup}
          disabled={isCreatingBackup}
          className="flex items-center gap-2"
        >
          {isCreatingBackup ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          Create Manual Backup
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backupLogs?.[0] ? format(new Date(backupLogs[0].started_at), 'MMM dd, HH:mm') : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {backupLogs?.[0]?.status || 'No backups found'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Frequency</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Daily</div>
            <p className="text-xs text-muted-foreground">
              Automated at 2:00 AM UTC
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Period</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30 Days</div>
            <p className="text-xs text-muted-foreground">
              Encrypted storage
            </p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          All backups are encrypted at rest and stored securely. Daily automated backups run at 2:00 AM UTC with 30-day retention.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>Recent backup operations and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse"></div>
            </div>
          ) : backupLogs && backupLogs.length > 0 ? (
            <div className="space-y-4">
              {backupLogs.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getBackupTypeIcon(backup.backup_type)}
                    <div>
                      <div className="font-medium capitalize">
                        {backup.backup_type} Backup
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Started: {format(new Date(backup.started_at), 'PPp')}
                        {backup.completed_at && (
                          <span className="ml-2">
                            • Completed: {format(new Date(backup.completed_at), 'PPp')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {backup.size_bytes && (
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(backup.size_bytes)}
                      </span>
                    )}
                    {getStatusBadge(backup.status)}
                    {backup.status === 'completed' && backup.file_path && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No backup history found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
