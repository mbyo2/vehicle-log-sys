import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, CalendarClock, Check, FileWarning, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { AlertItem } from '@/hooks/useDashboardMetrics';

const ACK_KEY = 'dashboard_acknowledged_alerts';

const readAck = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(ACK_KEY) ?? '[]');
  } catch {
    return [];
  }
};

interface Props {
  alerts: AlertItem[];
  onRefresh?: () => void;
}

export function AlertsPanel({ alerts, onRefresh }: Props) {
  const { toast } = useToast();
  const [acknowledged, setAcknowledged] = useState<string[]>(readAck);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const persistAck = (ids: string[]) => {
    setAcknowledged(ids);
    localStorage.setItem(ACK_KEY, JSON.stringify(ids));
  };

  const visible = useMemo(
    () => alerts.filter((a) => showAcknowledged || !acknowledged.includes(a.id)),
    [alerts, acknowledged, showAcknowledged]
  );

  const acknowledge = async (alert: AlertItem) => {
    setBusyId(alert.id);
    try {
      if (alert.kind === 'maintenance') {
        const { error } = await supabase
          .from('maintenance_schedules')
          .update({ status: 'acknowledged' })
          .eq('id', alert.id);
        if (error) throw error;
      }
      persistAck([...acknowledged, alert.id]);
      toast({ title: 'Acknowledged', description: alert.title });
      onRefresh?.();
    } catch (err: any) {
      console.error('[Alerts] acknowledge failed:', err);
      toast({
        variant: 'destructive',
        title: 'Could not acknowledge',
        description: err?.message ?? 'Please try again.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const scheduleFollowUp = async (alert: AlertItem, date: Date) => {
    setBusyId(alert.id);
    try {
      if (alert.kind === 'maintenance') {
        const { error } = await supabase
          .from('maintenance_schedules')
          .update({
            scheduled_date: format(date, 'yyyy-MM-dd'),
            status: 'scheduled',
          })
          .eq('id', alert.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('documents')
          .update({ expiry_date: format(date, 'yyyy-MM-dd') })
          .eq('id', alert.id);
        if (error) throw error;
      }
      toast({
        title: 'Follow-up scheduled',
        description: `${alert.title} → ${format(date, 'd MMM yyyy')}`,
      });
      onRefresh?.();
    } catch (err: any) {
      console.error('[Alerts] schedule failed:', err);
      toast({
        variant: 'destructive',
        title: 'Could not schedule follow-up',
        description: err?.message ?? 'Please try again.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const severity = (days: number | null) => {
    if (days === null) return { label: 'No date', variant: 'outline' as const };
    if (days <= 0) return { label: 'Due now', variant: 'destructive' as const };
    if (days <= 7) return { label: `${days}d left`, variant: 'destructive' as const };
    return { label: `${days}d left`, variant: 'secondary' as const };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          Alerts &amp; follow-ups
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{visible.length}</Badge>
          <Button variant="ghost" size="sm" onClick={() => setShowAcknowledged((s) => !s)}>
            {showAcknowledged ? 'Hide acknowledged' : 'Show acknowledged'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No maintenance or document alerts in the next 30 days.
          </p>
        ) : (
          <ScrollArea className="max-h-80 pr-3">
            <ul className="space-y-2">
              {visible.map((a) => {
                const sev = severity(a.daysUntilDue);
                const isAck = acknowledged.includes(a.id);
                const Icon = a.kind === 'maintenance' ? Wrench : FileWarning;
                return (
                  <li
                    key={`${a.kind}-${a.id}`}
                    className={cn(
                      'flex flex-wrap items-center justify-between gap-2 rounded-md border p-3',
                      isAck && 'opacity-60'
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {a.subtitle ? `${a.subtitle} · ` : ''}
                          {a.dueDate ? format(new Date(a.dueDate), 'd MMM yyyy') : 'No due date'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sev.variant}>{sev.label}</Badge>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline" disabled={busyId === a.id}>
                            <CalendarClock className="h-4 w-4 mr-1" />
                            Schedule
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            onSelect={(d) => d && scheduleFollowUp(a, d)}
                            initialFocus
                            className={cn('p-3 pointer-events-auto')}
                          />
                        </PopoverContent>
                      </Popover>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === a.id || isAck}
                        onClick={() => acknowledge(a)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {isAck ? 'Acknowledged' : 'Acknowledge'}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
