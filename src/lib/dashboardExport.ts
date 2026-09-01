import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DashboardMetrics, DateRange } from '@/hooks/useDashboardMetrics';

const rangeLabel = (range: DateRange) =>
  `${format(range.from, 'd MMM yyyy')} - ${format(range.to, 'd MMM yyyy')}`;

const kpiRows = (m: DashboardMetrics): [string, string][] => [
  ['Vehicles', String(m.vehicles)],
  ['Active vehicles', String(m.activeVehicles)],
  ['Drivers', String(m.drivers)],
  ['Trips in period', String(m.tripsInRange)],
  ['Distance in period (km)', String(m.kilometersInRange)],
  ['Pending approvals', String(m.pendingApprovals)],
  ['Fuel cost in period', String(Math.round(m.fuelCostInRange))],
  ['Maintenance due (30 days)', String(m.maintenanceDue)],
  ['Documents expiring (30 days)', String(m.expiringDocs)],
];

const csvCell = (v: string | number) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportMetricsCsv(m: DashboardMetrics, range: DateRange) {
  const lines: string[] = [];
  lines.push(`Fleet dashboard report,${csvCell(rangeLabel(range))}`);
  lines.push('');
  lines.push('Metric,Value');
  kpiRows(m).forEach(([k, v]) => lines.push(`${csvCell(k)},${csvCell(v)}`));

  lines.push('', 'Period,Trips,Kilometres,Fuel cost');
  m.tripTrend.forEach((t, i) =>
    lines.push([t.label, t.trips, t.km, m.fuelTrend[i]?.cost ?? 0].map(csvCell).join(','))
  );

  lines.push('', 'Approval status,Total,Under 3 days,3-7 days,Over 7 days,Oldest (days)');
  m.approvalAging.forEach((a) =>
    lines.push([a.status, a.total, a.fresh, a.aging, a.overdue, a.oldestDays].map(csvCell).join(','))
  );

  lines.push('', 'Alert type,Item,Detail,Due date,Days until due');
  m.alerts.forEach((a) =>
    lines.push(
      [a.kind, a.title, a.subtitle ?? '', a.dueDate ?? '', a.daysUntilDue ?? ''].map(csvCell).join(',')
    )
  );

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `fleet-dashboard-${format(range.from, 'yyyyMMdd')}-${format(range.to, 'yyyyMMdd')}.csv`);
}

export function exportMetricsPdf(m: DashboardMetrics, range: DateRange) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Fleet dashboard report', 14, 18);
  doc.setFontSize(10);
  doc.text(rangeLabel(range), 14, 25);
  doc.text(`Generated ${format(new Date(), 'd MMM yyyy HH:mm')}`, 14, 30);

  autoTable(doc, {
    startY: 38,
    head: [['Metric', 'Value']],
    body: kpiRows(m),
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    head: [['Period', 'Trips', 'Kilometres', 'Fuel cost']],
    body: m.tripTrend.map((t, i) => [t.label, t.trips, t.km, m.fuelTrend[i]?.cost ?? 0]),
    styles: { fontSize: 9 },
  });

  if (m.approvalAging.length) {
    autoTable(doc, {
      head: [['Approval status', 'Total', '<3 days', '3-7 days', '>7 days', 'Oldest (days)']],
      body: m.approvalAging.map((a) => [a.status, a.total, a.fresh, a.aging, a.overdue, a.oldestDays]),
      styles: { fontSize: 9 },
    });
  }

  if (m.alerts.length) {
    autoTable(doc, {
      head: [['Type', 'Item', 'Detail', 'Due', 'Days']],
      body: m.alerts.map((a) => [a.kind, a.title, a.subtitle ?? '', a.dueDate ?? '', a.daysUntilDue ?? '']),
      styles: { fontSize: 9 },
    });
  }

  doc.save(`fleet-dashboard-${format(range.from, 'yyyyMMdd')}-${format(range.to, 'yyyyMMdd')}.pdf`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
