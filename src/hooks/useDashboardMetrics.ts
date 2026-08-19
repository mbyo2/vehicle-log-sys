import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { isSuperAdmin } from '@/lib/permissions';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ApprovalAgingRow {
  status: string;
  total: number;
  fresh: number; // < 3 days
  aging: number; // 3-7 days
  overdue: number; // > 7 days
  oldestDays: number;
}

export interface AlertItem {
  id: string;
  kind: 'maintenance' | 'document';
  title: string;
  subtitle?: string;
  dueDate: string | null;
  daysUntilDue: number | null;
}

export interface DashboardMetrics {
  vehicles: number;
  activeVehicles: number;
  drivers: number;
  tripsInRange: number;
  kilometersInRange: number;
  pendingApprovals: number;
  fuelCostInRange: number;
  maintenanceDue: number;
  expiringDocs: number;
  tripTrend: { label: string; trips: number; km: number }[];
  fuelTrend: { label: string; cost: number }[];
  approvalAging: ApprovalAgingRow[];
  alerts: AlertItem[];
}

export const defaultRange = (): DateRange => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  };
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

const bucketLabel = (d: Date, monthly: boolean) =>
  monthly
    ? d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export function useDashboardMetrics(range: DateRange) {
  const { profile, role, loading: authLoading } = useEnhancedAuth();
  const companyId = (profile as any)?.company_id ?? null;
  const superAdmin = isSuperAdmin(role);
  const scoped = !superAdmin && !!companyId;

  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics', companyId, superAdmin, range.from.toISOString(), range.to.toISOString()],
    enabled: !authLoading && !!profile,
    staleTime: 60_000,
    queryFn: async () => {
      const fromIso = range.from.toISOString();
      const toIso = range.to.toISOString();

      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      const in30 = dayKey(in30Days);
      const today = dayKey(new Date());

      const scope = <T extends { eq: (c: string, v: any) => T }>(q: T) =>
        scoped ? q.eq('company_id', companyId) : q;

      const [
        vehiclesRes,
        driversRes,
        tripsRes,
        pendingRes,
        fuelRes,
        maintenanceRes,
        docsRes,
      ] = await Promise.all([
        scope(supabase.from('vehicles').select('id, status') as any),
        scope(supabase.from('drivers').select('id') as any),
        scope(
          supabase
            .from('vehicle_logs')
            .select('id, start_time, start_kilometers, end_kilometers')
            .gte('start_time', fromIso)
            .lte('start_time', toIso) as any
        ),
        scope(
          supabase
            .from('vehicle_logs')
            .select('id, approval_status, created_at')
            .neq('approval_status', 'approved') as any
        ),
        scope(
          supabase
            .from('fuel_logs')
            .select('total_cost, created_at')
            .gte('created_at', fromIso)
            .lte('created_at', toIso) as any
        ),
        scope(
          supabase
            .from('maintenance_schedules')
            .select('id, service_type, description, scheduled_date, status, vehicle_id, vehicles(plate_number)')
            .neq('status', 'completed')
            .lte('scheduled_date', in30)
            .order('scheduled_date', { ascending: true }) as any
        ),
        scope(
          supabase
            .from('documents')
            .select('id, name, type, expiry_date')
            .not('expiry_date', 'is', null)
            .gte('expiry_date', today)
            .lte('expiry_date', in30)
            .order('expiry_date', { ascending: true }) as any
        ),
      ]);

      const vehicles = (vehiclesRes.data as any[]) ?? [];
      const trips = (tripsRes.data as any[]) ?? [];
      const fuel = (fuelRes.data as any[]) ?? [];
      const pending = (pendingRes.data as any[]) ?? [];
      const maintenance = (maintenanceRes.data as any[]) ?? [];
      const docs = (docsRes.data as any[]) ?? [];

      // ----- Trend buckets: daily for <= 62 days, monthly beyond that -----
      const spanDays = Math.max(
        1,
        Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000)
      );
      const monthly = spanDays > 62;
      const buckets: { key: string; label: string; trips: number; km: number; cost: number }[] = [];

      if (monthly) {
        const cursor = new Date(range.from.getFullYear(), range.from.getMonth(), 1);
        while (cursor <= range.to) {
          buckets.push({
            key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
            label: bucketLabel(cursor, true),
            trips: 0, km: 0, cost: 0,
          });
          cursor.setMonth(cursor.getMonth() + 1);
        }
      } else {
        const cursor = new Date(range.from);
        cursor.setHours(0, 0, 0, 0);
        while (cursor <= range.to) {
          buckets.push({
            key: dayKey(cursor),
            label: bucketLabel(cursor, false),
            trips: 0, km: 0, cost: 0,
          });
          cursor.setDate(cursor.getDate() + 1);
        }
      }

      const bucketFor = (iso: string | null) => {
        if (!iso) return undefined;
        const d = new Date(iso);
        const key = monthly ? `${d.getFullYear()}-${d.getMonth()}` : dayKey(d);
        return buckets.find((b) => b.key === key);
      };

      let kilometersInRange = 0;
      trips.forEach((t) => {
        const km = Number(t.end_kilometers ?? 0) - Number(t.start_kilometers ?? 0);
        const distance = km > 0 ? km : 0;
        kilometersInRange += distance;
        const b = bucketFor(t.start_time);
        if (b) {
          b.trips += 1;
          b.km += distance;
        }
      });

      let fuelCostInRange = 0;
      fuel.forEach((f) => {
        const cost = Number(f.total_cost ?? 0);
        fuelCostInRange += cost;
        const b = bucketFor(f.created_at);
        if (b) b.cost += cost;
      });

      // ----- Approval aging -----
      const now = Date.now();
      const agingMap = new Map<string, ApprovalAgingRow>();
      pending.forEach((p) => {
        const status = (p.approval_status ?? 'pending') as string;
        const row = agingMap.get(status) ?? {
          status, total: 0, fresh: 0, aging: 0, overdue: 0, oldestDays: 0,
        };
        const days = Math.max(
          0,
          Math.floor((now - new Date(p.created_at).getTime()) / 86_400_000)
        );
        row.total += 1;
        if (days < 3) row.fresh += 1;
        else if (days <= 7) row.aging += 1;
        else row.overdue += 1;
        row.oldestDays = Math.max(row.oldestDays, days);
        agingMap.set(status, row);
      });

      // ----- Alerts -----
      const daysUntil = (iso: string | null) =>
        iso ? Math.ceil((new Date(iso).getTime() - now) / 86_400_000) : null;

      const alerts: AlertItem[] = [
        ...maintenance.map((m) => ({
          id: m.id,
          kind: 'maintenance' as const,
          title: m.service_type ?? 'Scheduled maintenance',
          subtitle: m.vehicles?.plate_number
            ? `Vehicle ${m.vehicles.plate_number}`
            : m.description ?? undefined,
          dueDate: m.scheduled_date ?? null,
          daysUntilDue: daysUntil(m.scheduled_date),
        })),
        ...docs.map((d) => ({
          id: d.id,
          kind: 'document' as const,
          title: d.name ?? 'Document',
          subtitle: d.type ?? undefined,
          dueDate: d.expiry_date ?? null,
          daysUntilDue: daysUntil(d.expiry_date),
        })),
      ].sort((a, b) => (a.daysUntilDue ?? 9999) - (b.daysUntilDue ?? 9999));

      return {
        vehicles: vehicles.length,
        activeVehicles: vehicles.filter((v) => (v.status ?? 'active') === 'active').length,
        drivers: ((driversRes.data as any[]) ?? []).length,
        tripsInRange: trips.length,
        kilometersInRange: Math.round(kilometersInRange),
        pendingApprovals: pending.length,
        fuelCostInRange,
        maintenanceDue: maintenance.length,
        expiringDocs: docs.length,
        tripTrend: buckets.map((b) => ({ label: b.label, trips: b.trips, km: Math.round(b.km) })),
        fuelTrend: buckets.map((b) => ({ label: b.label, cost: Math.round(b.cost) })),
        approvalAging: Array.from(agingMap.values()).sort((a, b) => b.total - a.total),
        alerts,
      };
    },
  });
}
