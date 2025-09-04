import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface WorkflowState {
  id: string;
  entity_type: string;
  entity_id: string;
  current_state: string;
  assigned_to?: string;
  company_id: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface WorkflowTransition {
  from: string;
  to: string;
  action: string;
  requiredRole?: string;
  requiredPermission?: string;
}

// Define workflow rules for different entity types
const WORKFLOW_RULES: Record<string, WorkflowTransition[]> = {
  trip: [
    { from: 'draft', to: 'submitted', action: 'submit', requiredRole: 'driver' },
    { from: 'submitted', to: 'approved', action: 'approve', requiredPermission: 'trips:approve' },
    { from: 'submitted', to: 'rejected', action: 'reject', requiredPermission: 'trips:approve' },
    { from: 'approved', to: 'completed', action: 'complete', requiredRole: 'driver' },
    { from: 'rejected', to: 'draft', action: 'revise', requiredRole: 'driver' }
  ],
  document: [
    { from: 'uploaded', to: 'under_review', action: 'review', requiredPermission: 'documents:review' },
    { from: 'under_review', to: 'approved', action: 'approve', requiredPermission: 'documents:approve' },
    { from: 'under_review', to: 'rejected', action: 'reject', requiredPermission: 'documents:approve' },
    { from: 'rejected', to: 'uploaded', action: 'reupload', requiredRole: 'driver' }
  ],
  maintenance: [
    { from: 'scheduled', to: 'in_progress', action: 'start', requiredPermission: 'maintenance:manage' },
    { from: 'in_progress', to: 'completed', action: 'complete', requiredPermission: 'maintenance:manage' },
    { from: 'in_progress', to: 'on_hold', action: 'hold', requiredPermission: 'maintenance:manage' },
    { from: 'on_hold', to: 'in_progress', action: 'resume', requiredPermission: 'maintenance:manage' }
  ]
};

const getStateColor = (state: string) => {
  switch (state) {
    case 'draft': return 'secondary';
    case 'submitted': return 'yellow';
    case 'under_review': return 'blue';
    case 'approved': return 'green';
    case 'completed': return 'green';
    case 'rejected': return 'destructive';
    case 'on_hold': return 'orange';
    default: return 'secondary';
  }
};

const getStateIcon = (state: string) => {
  switch (state) {
    case 'completed':
    case 'approved':
      return <CheckCircle className="h-4 w-4" />;
    case 'submitted':
    case 'under_review':
    case 'in_progress':
      return <Clock className="h-4 w-4" />;
    case 'rejected':
    case 'on_hold':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

interface WorkflowEngineProps {
  entityType?: string;
  entityId?: string;
  companyId?: string;
}

export function WorkflowEngine({ entityType, entityId, companyId }: WorkflowEngineProps) {
  const { profile, hasPermission } = useEnhancedAuth();
  const [workflows, setWorkflows] = useState<WorkflowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    try {
      let query = supabase
        .from('workflow_states')
        .select('*')
        .order('updated_at', { ascending: false });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching workflows:', error);
        return;
      }

      setWorkflows(data || []);
    } catch (error) {
      console.error('Workflow fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableActions = (workflow: WorkflowState) => {
    const rules = WORKFLOW_RULES[workflow.entity_type] || [];
    return rules.filter(rule => {
      if (rule.from !== workflow.current_state) return false;
      
      if (rule.requiredRole && profile?.role !== rule.requiredRole) return false;
      
      if (rule.requiredPermission) {
        const [resource, action] = rule.requiredPermission.split(':');
        if (!hasPermission(resource, action)) return false;
      }
      
      return true;
    });
  };

  const executeAction = async (workflow: WorkflowState, transition: WorkflowTransition) => {
    try {
      setUpdating(workflow.id);

      const { error } = await supabase
        .from('workflow_states')
        .update({
          current_state: transition.to,
          assigned_to: profile?.id,
          updated_at: new Date().toISOString(),
          metadata: {
            ...workflow.metadata,
            last_action: transition.action,
            last_action_by: profile?.id,
            last_action_at: new Date().toISOString()
          }
        })
        .eq('id', workflow.id);

      if (error) {
        console.error('Error updating workflow:', error);
        return;
      }

      // Log the workflow action
      await supabase.from('security_events').insert({
        event_type: 'workflow_action',
        event_details: {
          workflow_id: workflow.id,
          entity_type: workflow.entity_type,
          entity_id: workflow.entity_id,
          action: transition.action,
          from_state: transition.from,
          to_state: transition.to
        }
      });

      // Refresh workflows
      await fetchWorkflows();
    } catch (error) {
      console.error('Workflow action failed:', error);
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [entityType, entityId, companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No workflow items found for the current filters.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Workflow Management</h3>
        <Button onClick={fetchWorkflows} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {workflows.map((workflow) => {
          const availableActions = getAvailableActions(workflow);
          
          return (
            <Card key={workflow.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {workflow.entity_type.charAt(0).toUpperCase() + workflow.entity_type.slice(1)} Workflow
                  </CardTitle>
                  <Badge variant={getStateColor(workflow.current_state) as any} className="flex items-center gap-1">
                    {getStateIcon(workflow.current_state)}
                    {workflow.current_state.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <CardDescription>
                  Entity ID: {workflow.entity_id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflow.assigned_to && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Assigned to: {workflow.assigned_to === profile?.id ? 'You' : workflow.assigned_to}
                    </div>
                  )}

                  {workflow.metadata?.last_action && (
                    <div className="text-sm text-muted-foreground">
                      Last action: {workflow.metadata.last_action} on{' '}
                      {new Date(workflow.metadata.last_action_at).toLocaleDateString()}
                    </div>
                  )}

                  {availableActions.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium mb-2">Available Actions:</div>
                      <div className="flex flex-wrap gap-2">
                        {availableActions.map((action) => (
                          <Button
                            key={action.action}
                            onClick={() => executeAction(workflow, action)}
                            disabled={updating === workflow.id}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {updating === workflow.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <ArrowRight className="h-3 w-3" />
                            )}
                            {action.action.charAt(0).toUpperCase() + action.action.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {availableActions.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No actions available for your role
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}