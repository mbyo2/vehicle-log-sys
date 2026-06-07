
import { useEffect } from 'react';
import { WorkflowManager } from '@/components/workflows/WorkflowManager';
import { IndustryDashboardWidgets } from '@/components/workflows/IndustryDashboardWidgets';

export default function Dashboard() {
  useEffect(() => {
    document.title = 'Dashboard | Fleet Manager';
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <IndustryDashboardWidgets />
      <WorkflowManager />
    </div>
  );
}
