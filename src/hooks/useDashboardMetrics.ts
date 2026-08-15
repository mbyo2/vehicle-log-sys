import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { isSuperAdmin } from '@/lib/permissions';

export interface DashboardMetrics {
  vehicles: number;
  activeVehicles: number;
  drivers: number;
  tripsThisMonth: number;
  kilometersThisMonth: number;
  pendingApprovals: number;
  fuelCostThisMonth: number;
  maintenanceDue: number;
  expiringDocs: number;
  tripTrend: { label: string; trips: number; km: number }[];
  fuelTrend: { label: string; cost: number }[];
}

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const monthLabel = (d: Date) =>
  d.toLocaleDateString(undefined, { month: 'short' });

export function useDashboardMetrics() {
  const { profile, role, loading: authLoading } = useEnhancedAuth();
  const companyId = (profile as any)?.company_id ?? null;
  const superAdmin = isSuperAdmin(role);
  const scoped = !superAdmin && !!companyId;

  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics', companyId, superAdmin],
    enabled: !authLoading && !!profile,
    staleTime: 60_000,
    queryFn: async () => {
      const monthStart = startOfMonth().toISOString();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      const trendStart = sixMonthsAgo.toISOString();

      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      const in30 = in30Days.toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);

      const scope = <T extends { eq: (c: string, v: any) => T }>(q: T) =>
        scoped ? q.eq('company_id', companyId) : q;

      const [
        vehiclesRes,
        driversRes,
        tripsMonthRes,
        pendingRes,
        fuelRes,
        maintenanceRes,
        docsRes,
        tripsTrendRes,
      ] = await Promise.all([
        scope(supabase.from('vehicles').select('id, status') as any),
        scope(supabase.from('drivers').select('id') as any),
        scope(
          supabase
            .from('vehicle_logs')
            .select('id, start_kilometers, end_kilometers')
            .gte('start_time', monthStart) as any
        ),
        scope(
          supabase
            .from('vehicle_logs')
            .select('id')
            .eq('approval_status', 'pending') as any
        ),
        scope(
          supabase
            .from('fuel_logs')
            .select('total_cost, created_at')
            .gte('created_at', trendStart) as any
        ),
        scope(
          supabase
            .from('maintenance_schedules')
            .select('id')
            .neq('status', 'completed')
            .lte('scheduled_date', in30) as any
        ),
        scope(
          supabase
            .from('documents')
            .select('id, expiry_date')
            .not('expiry_date', 'is', null)
            .gte('expiry_date', today)
            .lte('expiry_date', in30) as any
        ),
        scope(
          supabase
            .from('vehicle_logs')
            .select('start_time, start_kilometers, end_kilometers')
            .gte('start_time', trendStart) as any
        ),
      ]);

      const vehicles = (vehiclesRes.data as any[]) ?? [];
      const tripsMonth = (tripsMonthRes.data as any[]) ?? [];
      const fuel = (fuelRes.data as any[]) ?? [];
      const tripsTrendRows = (tripsTrendRes.data as any[]) ?? [];

      // Build the last 6 month buckets
      const buckets: { key: string; label: string; trips: number; km: number; cost: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        buckets.push({
          key: `${d.getFullYear()}-${d.getMonth()}`,
          label: monthLabel(d),
          trips: 0,
          km: 0,
          cost: 0,
        });
      }
      const bucketFor = (iso: string | null) => {
        if (!iso) return undefined;
        const d = new Date(iso);
        return buckets.find((b) => b.key === `${d.getFullYear()}-${d.getMonth()}`);
      };

      tripsTrendRows.forEach((t) => {
        const b = bucketFor(t.start_time);
        if (!b) return;
        b.trips += 1;
        const km = Number(t.end_kilometers ?? 0) - Number(t.start_kilometers ?? 0);
        if (km > 0) b.km += km;
      });

      let fuelCostThisMonth = 0;
      const monthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`;
      fuel.forEach((f) => {
        const b = bucketFor(f.created_at);
        if (b) b.cost += Number(f.total_cost ?? 0);
        const d = new Date(f.created_at);
        if (`${d.getFullYear()}-${d.getMonth()}` === monthKey) {
          fuelCostThisMonth += Number(f.total_cost ?? 0);
        }
      });

      const kilometersThisMonth = tripsMonth.reduce((sum, t) => {
        const km = Number(t.end_kilometers ?? 0) - Number(t.start_kilometers ?? 0);
        return sum + (km > 0 ? km : 0);
      }, 0);

      return {
        vehicles: vehicles.length,
        activeVehicles: vehicles.filter((v) => (v.status ?? 'active') === 'active').length,
        drivers: ((driversRes.data as any[]) ?? []).length,
        tripsThisMonth: tripsMonth.length,
        kilometersThisMonth,
        pendingApprovals: ((pendingRes.data as any[]) ?? []).length,
        fuelCostThisMonth,
        maintenanceDue: ((maintenanceRes.data as any[]) ?? []).length,
        expiringDocs: ((docsRes.data as any[]) ?? []).length,
        tripTrend: buckets.map((b) => ({ label: b.label, trips: b.trips, km: Math.round(b.km) })),
        fuelTrend: buckets.map((b) => ({ label: b.label, cost: Math.round(b.cost) })),
      };
    },
  });
}
