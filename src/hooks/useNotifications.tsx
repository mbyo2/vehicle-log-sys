
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type NotificationType = 'maintenance' | 'vehicle_issue' | 'document_expiry' | 'user_action' | 'approval_required' | 'urgent';
export type NotificationDelivery = 'in_app' | 'email' | 'sms' | 'all';

export interface Notification {
  id: string;
  vehicle_id?: string;
  company_id: string;
  type: NotificationType;
  message: string;
  status: 'unread' | 'read';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export function useNotifications(limit: number = 10) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as Notification[];
    },
  });

  const sendNotification = useMutation({
    mutationFn: async ({
      to,
      subject,
      type,
      details,
      delivery = 'in_app'
    }: {
      to: string[];
      subject: string;
      type: NotificationType;
      details: Record<string, any>;
      delivery?: NotificationDelivery;
    }) => {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          to,
          subject,
          type,
          details,
          delivery
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Notification sent",
        description: "The notification has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send notification. Please try again.",
      });
      console.error('Notification error:', error);
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('vehicle_notifications')
        .update({ status: 'read' })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('vehicle_notifications')
        .update({ status: 'read' })
        .eq('status', 'unread');

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Notifications updated",
        description: "All notifications have been marked as read.",
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const getUnreadCount = () => {
    if (!notifications) return 0;
    return notifications.filter(n => n.status === 'unread').length;
  };

  return {
    notifications,
    isLoading,
    sendNotification,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
  };
}
