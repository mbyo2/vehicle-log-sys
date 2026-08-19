import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import {
  Car, Users, MapPin, Route, ClipboardCheck, Fuel, Wrench, FileWarning,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';

const numberFmt = new Intl.NumberFormat();

function MetricCard({
  title, value, hint, icon: Icon,
}: { title: string; value: string; hint?: string; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function FleetMetrics() {
  const { data, isLoading, isError } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Fleet metrics are unavailable right now. Please refresh to try again.
        </CardContent>
      </Card>
    );
  }

  const hasTrend = data.tripTrend.some((p) => p.trips > 0 || p.km > 0);
  const hasFuel = data.fuelTrend.some((p) => p.cost > 0);

  return (
    <section className="space-y-4" aria-label="Fleet metrics">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Vehicles"
          value={numberFmt.format(data.vehicles)}
          hint={`${numberFmt.format(data.activeVehicles)} active`}
          icon={Car}
        />
        <MetricCard title="Drivers" value={numberFmt.format(data.drivers)} icon={Users} />
        <MetricCard
          title="Trips this month"
          value={numberFmt.format(data.tripsThisMonth)}
          icon={MapPin}
        />
        <MetricCard
          title="Distance this month"
          value={`${numberFmt.format(data.kilometersThisMonth)} km`}
          icon={Route}
        />
        <MetricCard
          title="Pending approvals"
          value={numberFmt.format(data.pendingApprovals)}
          hint="Trip logs awaiting review"
          icon={ClipboardCheck}
        />
        <MetricCard
          title="Fuel cost this month"
          value={numberFmt.format(Math.round(data.fuelCostThisMonth))}
          icon={Fuel}
        />
        <MetricCard
          title="Maintenance due"
          value={numberFmt.format(data.maintenanceDue)}
          hint="Scheduled within 30 days"
          icon={Wrench}
        />
        <MetricCard
          title="Documents expiring"
          value={numberFmt.format(data.expiringDocs)}
          hint="Next 30 days"
          icon={FileWarning}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trips &amp; distance (6 months)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {hasTrend ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tripTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Bar dataKey="trips" name="Trips" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="km" name="Kilometres" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No trips logged yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fuel spend (6 months)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {hasFuel ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.fuelTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    name="Fuel cost"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No fuel logs recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
