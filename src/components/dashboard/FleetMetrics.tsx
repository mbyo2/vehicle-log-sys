import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardMetrics, defaultRange, type DateRange } from '@/hooks/useDashboardMetrics';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { ApprovalAgingCard } from '@/components/dashboard/ApprovalAgingCard';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { DrillDownDialog, type DrillDownMetric } from '@/components/dashboard/DrillDownDialog';
import { exportMetricsCsv, exportMetricsPdf } from '@/lib/dashboardExport';
import {
  Car, Users, MapPin, Route, ClipboardCheck, Fuel, Wrench, FileWarning,
  Download, FileText,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';

const numberFmt = new Intl.NumberFormat();

function MetricCard({
  title, value, hint, icon: Icon, onClick,
}: {
  title: string; value: string; hint?: string;
  icon: React.ElementType; onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={onClick ? 'cursor-pointer transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none' : undefined}
    >
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
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [drillDown, setDrillDown] = useState<DrillDownMetric | null>(null);
  const { data, isLoading, isError, refetch } = useDashboardMetrics(range);

  return (
    <section className="space-y-4" aria-label="Fleet metrics">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter value={range} onChange={setRange} />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!data}
            onClick={() => data && exportMetricsCsv(data, range)}
          >
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!data}
            onClick={() => data && exportMetricsPdf(data, range)}
          >
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError || !data ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Fleet metrics are unavailable right now. Please refresh to try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Vehicles" value={numberFmt.format(data.vehicles)}
              hint={`${numberFmt.format(data.activeVehicles)} active`}
              icon={Car} onClick={() => setDrillDown('vehicles')}
            />
            <MetricCard
              title="Drivers" value={numberFmt.format(data.drivers)}
              icon={Users} onClick={() => setDrillDown('drivers')}
            />
            <MetricCard
              title="Trips in period" value={numberFmt.format(data.tripsInRange)}
              icon={MapPin} onClick={() => setDrillDown('trips')}
            />
            <MetricCard
              title="Distance in period" value={`${numberFmt.format(data.kilometersInRange)} km`}
              icon={Route} onClick={() => setDrillDown('kilometers')}
            />
            <MetricCard
              title="Pending approvals" value={numberFmt.format(data.pendingApprovals)}
              hint="Trip logs awaiting review"
              icon={ClipboardCheck} onClick={() => setDrillDown('approvals')}
            />
            <MetricCard
              title="Fuel cost in period"
              value={numberFmt.format(Math.round(data.fuelCostInRange))}
              icon={Fuel} onClick={() => setDrillDown('fuel')}
            />
            <MetricCard
              title="Maintenance due" value={numberFmt.format(data.maintenanceDue)}
              hint="Scheduled within 30 days"
              icon={Wrench} onClick={() => setDrillDown('maintenance')}
            />
            <MetricCard
              title="Documents expiring" value={numberFmt.format(data.expiringDocs)}
              hint="Next 30 days"
              icon={FileWarning} onClick={() => setDrillDown('documents')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ApprovalAgingCard
              rows={data.approvalAging}
              onDrillDown={() => setDrillDown('approvals')}
            />
            <AlertsPanel alerts={data.alerts} onRefresh={() => refetch()} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Trips &amp; distance</CardTitle></CardHeader>
              <CardContent className="h-64">
                {data.tripTrend.some((p) => p.trips > 0 || p.km > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.tripTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        color: 'hsl(var(--popover-foreground))',
                      }} />
                      <Bar dataKey="trips" name="Trips" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="km" name="Kilometres" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    No trips logged in this period.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Fuel spend</CardTitle></CardHeader>
              <CardContent className="h-64">
                {data.fuelTrend.some((p) => p.cost > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.fuelTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        color: 'hsl(var(--popover-foreground))',
                      }} />
                      <Line type="monotone" dataKey="cost" name="Fuel cost"
                        stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    No fuel logs in this period.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <DrillDownDialog metric={drillDown} range={range} onClose={() => setDrillDown(null)} />
    </section>
  );
}
