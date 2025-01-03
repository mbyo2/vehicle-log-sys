import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useNotifications() {
  const { toast } = useToast();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const sendNotification = useMutation({
    mutationFn: async (notification: {
      to: string[];
      subject: string;
      type: 'maintenance' | 'vehicle_issue' | 'document_expiry' | 'user_action';
      details: Record<string, any>;
    }) => {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: notification,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Notification sent",
        description: "The notification has been sent successfully.",
      });
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
  });

  return {
    notifications,
    isLoading,
    sendNotification,
    markAsRead,
  };
}