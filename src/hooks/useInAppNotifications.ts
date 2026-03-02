import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef } from 'react';
import { usePushNotifications } from './usePushNotifications';

export interface InAppNotification {
  id: string;
  user_id: string;
  company_id: string | null;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export function useInAppNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { permission, showNotification } = usePushNotifications();
  const shownNotifications = useRef<Set<string>>(new Set());

  // Extract the actual user value from the observable
  const currentUser = user.get();
  const userId = currentUser?.id;

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['in-app-notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      return data as InAppNotification[];
    },
    enabled: !!userId,
  });

  // Real-time subscription for new notifications with push notification support
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as InAppNotification;
          
          if (permission === 'granted' && !shownNotifications.current.has(newNotification.id)) {
            shownNotifications.current.add(newNotification.id);
            showNotification({
              title: newNotification.title,
              body: newNotification.message,
              tag: newNotification.id,
            });
          }
          
          queryClient.invalidateQueries({ queryKey: ['in-app-notifications', userId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['in-app-notifications', userId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['in-app-notifications', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, permission, showNotification]);

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications', userId] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications', userId] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications', userId] });
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications', userId] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    clearAll: clearAll.mutate,
  };
}
