import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { isSuperAdmin } from '@/lib/permissions';
import type { DateRange } from '@/hooks/useDashboardMetrics';

export type DrillDownMetric =
  | 'vehicles'
  | 'activeVehicles'
  | 'drivers'
  | 'trips'
  | 'kilometers'
  | 'approvals'
  | 'fuel'
  | 'maintenance'
  | 'documents';

const TITLES: Record<DrillDownMetric, string> = {
  vehicles: 'All vehicles',
  activeVehicles: 'Active vehicles',
  drivers: 'Drivers',
  trips: 'Trips in selected period',
  kilometers: 'Distance by trip',
  approvals: 'Pending trip approvals',
  fuel: 'Fuel logs in selected period',
  maintenance: 'Maintenance due within 30 days',
  documents: 'Documents expiring within 30 days',
};

interface Props {
  metric: DrillDownMetric | null;
  range: DateRange;
  onClose: () => void;
}

export function DrillDownDialog({ metric, range, onClose }: Props) {
  const { profile, role } = useEnhancedAuth();
  const companyId = (profile as any)?.company_id ?? null;
  const scoped = !isSuperAdmin(role) && !!companyId;

  const { data, isLoading } = useQuery({
    queryKey: ['drilldown', metric, companyId, range.from.toISOString(), range.to.toISOString()],
    enabled: !!metric,
    queryFn: async () => {
      const scope = <T extends { eq: (c: string, v: any) => T }>(q: T) =>
        scoped ? q.eq('company_id', companyId) : q;
      const fromIso = range.from.toISOString();
      const toIso = range.to.toISOString();
      const today = new Date().toISOString().slice(0, 10);
      const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

      switch (metric) {
        case 'vehicles':
        case 'activeVehicles': {
          let q = supabase
            .from('vehicles')
            .select('plate_number, make, model, year, status, current_kilometers')
            .order('plate_number') as any;
          if (metric === 'activeVehicles') q = q.eq('status', 'active');
          const { data } = await scope(q);
          return {
            columns: ['Plate', 'Make', 'Model', 'Year', 'Status', 'Odometer'],
            rows: (data ?? []).map((v: any) => [
              v.plate_number, v.make, v.model, v.year, v.status ?? 'active',
              v.current_kilometers ?? 0,
            ]),
          };
        }
        case 'drivers': {
          const { data } = await scope(
            supabase
              .from('drivers')
              .select('man_number, license_number, license_expiry, profiles:profile_id(full_name, email)')
              .order('man_number') as any
          );
          return {
            columns: ['Employee no.', 'Name', 'Licence', 'Licence expiry'],
            rows: (data ?? []).map((d: any) => [
              d.man_number,
              d.profiles?.full_name ?? d.profiles?.email ?? '—',
              d.license_number ?? '—',
              d.license_expiry ? format(new Date(d.license_expiry), 'd MMM yyyy') : '—',
            ]),
          };
        }
        case 'trips':
        case 'kilometers': {
          const { data } = await scope(
            supabase
              .from('vehicle_logs')
              .select('start_time, purpose, start_kilometers, end_kilometers, approval_status, vehicles(plate_number)')
              .gte('start_time', fromIso)
              .lte('start_time', toIso)
              .order('start_time', { ascending: false }) as any
          );
          return {
            columns: ['Date', 'Vehicle', 'Purpose', 'Distance (km)', 'Approval'],
            rows: (data ?? []).map((t: any) => [
              format(new Date(t.start_time), 'd MMM yyyy'),
              t.vehicles?.plate_number ?? '—',
              t.purpose ?? '—',
              Math.max(0, Number(t.end_kilometers ?? 0) - Number(t.start_kilometers ?? 0)),
              t.approval_status ?? 'pending',
            ]),
          };
        }
        case 'approvals': {
          const { data } = await scope(
            supabase
              .from('vehicle_logs')
              .select('created_at, purpose, approval_status, vehicles(plate_number)')
              .neq('approval_status', 'approved')
              .order('created_at', { ascending: true }) as any
          );
          return {
            columns: ['Submitted', 'Vehicle', 'Purpose', 'Status', 'Age (days)'],
            rows: (data ?? []).map((t: any) => [
              format(new Date(t.created_at), 'd MMM yyyy'),
              t.vehicles?.plate_number ?? '—',
              t.purpose ?? '—',
              t.approval_status ?? 'pending',
              Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86_400_000),
            ]),
          };
        }
        case 'fuel': {
          const { data } = await scope(
            supabase
              .from('fuel_logs')
              .select('created_at, liters_added, cost_per_liter, total_cost, station_name, vehicles(plate_number)')
              .gte('created_at', fromIso)
              .lte('created_at', toIso)
              .order('created_at', { ascending: false }) as any
          );
          return {
            columns: ['Date', 'Vehicle', 'Litres', 'Cost/L', 'Total', 'Station'],
            rows: (data ?? []).map((f: any) => [
              format(new Date(f.created_at), 'd MMM yyyy'),
              f.vehicles?.plate_number ?? '—',
              f.liters_added, f.cost_per_liter, f.total_cost,
              f.station_name ?? '—',
            ]),
          };
        }
        case 'maintenance': {
          const { data } = await scope(
            supabase
              .from('maintenance_schedules')
              .select('scheduled_date, service_type, status, estimated_cost, vehicles(plate_number)')
              .neq('status', 'completed')
              .lte('scheduled_date', in30)
              .order('scheduled_date') as any
          );
          return {
            columns: ['Due', 'Vehicle', 'Service', 'Status', 'Est. cost'],
            rows: (data ?? []).map((m: any) => [
              m.scheduled_date ? format(new Date(m.scheduled_date), 'd MMM yyyy') : '—',
              m.vehicles?.plate_number ?? '—',
              m.service_type, m.status, m.estimated_cost ?? '—',
            ]),
          };
        }
        case 'documents': {
          const { data } = await scope(
            supabase
              .from('documents')
              .select('name, type, expiry_date, verification_status')
              .not('expiry_date', 'is', null)
              .gte('expiry_date', today)
              .lte('expiry_date', in30)
              .order('expiry_date') as any
          );
          return {
            columns: ['Document', 'Type', 'Expires', 'Verification'],
            rows: (data ?? []).map((d: any) => [
              d.name, d.type,
              format(new Date(d.expiry_date), 'd MMM yyyy'),
              d.verification_status ?? '—',
            ]),
          };
        }
        default:
          return { columns: [], rows: [] };
      }
    },
  });

  return (
    <Dialog open={!!metric} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{metric ? TITLES[metric] : ''}</DialogTitle>
          <DialogDescription>
            {format(range.from, 'd MMM yyyy')} – {format(range.to, 'd MMM yyyy')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data || data.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">No records found for this metric.</p>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  {data.columns.map((c: string) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row: any[], i: number) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j} className="whitespace-nowrap">
                        {String(cell ?? '—')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
