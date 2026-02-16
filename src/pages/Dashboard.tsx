
import { useEffect } from 'react';
import { WorkflowManager } from '@/components/workflows/WorkflowManager';

export default function Dashboard() {
  useEffect(() => {
    document.title = 'Dashboard | Fleet Manager';
  }, []);
  
  return <WorkflowManager />;
}
