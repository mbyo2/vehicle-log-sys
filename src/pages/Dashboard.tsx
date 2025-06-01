
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { WorkflowManager } from '@/components/workflows/WorkflowManager';

export default function Dashboard() {
  useEffect(() => {
    document.title = 'Dashboard | Fleet Manager';
  }, []);
  
  return (
    <DashboardLayout>
      <WorkflowManager />
    </DashboardLayout>
  );
}
