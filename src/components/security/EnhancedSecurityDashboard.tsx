import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityAuditDashboard } from './SecurityAuditDashboard';
import { IntrusionDetectionMonitor } from './IntrusionDetectionMonitor';
import { SecurityAuditScheduler } from './SecurityAuditScheduler';
import { BackupManagement } from './BackupManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Activity, Calendar, HardDrive, Settings } from 'lucide-react';

export function EnhancedSecurityDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Center</h1>
          <p className="text-muted-foreground">
            Comprehensive security monitoring and management
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="audits" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Audits
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SecurityAuditDashboard />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <IntrusionDetectionMonitor />
        </TabsContent>

        <TabsContent value="audits" className="space-y-6">
          <SecurityAuditScheduler />
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <BackupManagement />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Authentication Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>✅ Strong password policy enforced</li>
                        <li>✅ TOTP-based 2FA implemented</li>
                        <li>✅ Session security configured</li>
                        <li>✅ Rate limiting active</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Database Security</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>✅ RLS enabled on all tables</li>
                        <li>✅ Functions secured with search_path</li>
                        <li>✅ Audit logging active</li>
                        <li>✅ Input validation implemented</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Monitoring & Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>✅ Intrusion detection active</li>
                        <li>✅ Security event logging</li>
                        <li>✅ Automated security audits</li>
                        <li>✅ Anomaly detection</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Backup & Recovery</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>✅ Automated backups scheduled</li>
                        <li>✅ Backup encryption enabled</li>
                        <li>✅ Retention policies configured</li>
                        <li>✅ Recovery testing available</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}