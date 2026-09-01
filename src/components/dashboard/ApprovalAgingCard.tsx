import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { ApprovalAgingRow } from '@/hooks/useDashboardMetrics';

interface Props {
  rows: ApprovalAgingRow[];
  onDrillDown?: () => void;
}

export function ApprovalAgingCard({ rows, onDrillDown }: Props) {
  const totalOverdue = rows.reduce((s, r) => s + r.overdue, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Pending approvals by status &amp; age</CardTitle>
        {totalOverdue > 0 && (
          <Badge variant="destructive">{totalOverdue} over 7 days</Badge>
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing awaiting approval.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Under 3d</TableHead>
                  <TableHead className="text-right">3–7d</TableHead>
                  <TableHead className="text-right">Over 7d</TableHead>
                  <TableHead className="text-right">Oldest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.status}>
                    <TableCell className="capitalize font-medium">{r.status}</TableCell>
                    <TableCell className="text-right">{r.total}</TableCell>
                    <TableCell className="text-right">{r.fresh}</TableCell>
                    <TableCell className="text-right">
                      {r.aging > 0 ? <span className="text-amber-600 dark:text-amber-400">{r.aging}</span> : r.aging}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.overdue > 0 ? <span className="text-destructive font-medium">{r.overdue}</span> : r.overdue}
                    </TableCell>
                    <TableCell className="text-right">{r.oldestDays}d</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {onDrillDown && (
              <button
                type="button"
                onClick={onDrillDown}
                className="mt-3 text-sm text-primary underline-offset-4 hover:underline"
              >
                View all pending approvals
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
