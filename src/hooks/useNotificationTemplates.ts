import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { NotificationType, NotificationDelivery } from './useNotifications';

export interface NotificationTemplate {
  id: string;
  company_id?: string;
  template_name: string;
  notification_type: NotificationType;
  delivery_method: NotificationDelivery;
  subject_template?: string;
  body_template: string;
  html_template?: string;
  styling_config?: Record<string, any>;
  variables?: string[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export function useNotificationTemplates(companyId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['notification-templates', companyId],
    queryFn: async () => {
      let query = supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (companyId) {
        query = query.or(`company_id.eq.${companyId},company_id.is.null`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as NotificationTemplate[];
    },
    enabled: !!companyId,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert([template])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Template created",
        description: "Notification template has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create template. Please try again.",
      });
      console.error('Create template error:', error);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NotificationTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('notification_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Template updated",
        description: "Notification template has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update template. Please try again.",
      });
      console.error('Update template error:', error);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Template deleted",
        description: "Notification template has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete template. Please try again.",
      });
      console.error('Delete template error:', error);
    },
  });

  const getTemplate = (type: NotificationType, delivery: NotificationDelivery, companyId?: string) => {
    if (!templates) return null;
    
    // First try to find company-specific template
    const companyTemplate = templates.find(t => 
      t.notification_type === type && 
      t.delivery_method === delivery && 
      t.company_id === companyId
    );
    
    if (companyTemplate) return companyTemplate;
    
    // Fall back to default template
    return templates.find(t => 
      t.notification_type === type && 
      t.delivery_method === delivery && 
      t.is_default
    );
  };

  const renderTemplate = (template: NotificationTemplate, variables: Record<string, any>) => {
    let subject = template.subject_template || '';
    let body = template.body_template;
    let html = template.html_template || '';

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
      html = html.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return { subject, body, html };
  };

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    renderTemplate,
  };
}