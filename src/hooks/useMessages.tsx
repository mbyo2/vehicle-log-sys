
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types/message';
import { useAuth } from '@/contexts/AuthContext';

export function useMessages() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const profileData = profile.get();
  const userId = profileData?.id;
  const companyId = profileData?.company_id;

  const { data: receivedMessages, isLoading: isReceivedLoading } = useQuery({
    queryKey: ['messages', 'received', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, profiles!inner(full_name))
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Normalize the data structure
      return data.map((message: any) => ({
        ...message,
        sender_name: message.sender.profiles.full_name
      })) as Message[];
    },
    enabled: !!userId,
  });

  const { data: sentMessages, isLoading: isSentLoading } = useQuery({
    queryKey: ['messages', 'sent', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          recipient:recipient_id(id, profiles!inner(full_name))
        `)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Normalize the data structure
      return data.map((message: any) => ({
        ...message,
        recipient_name: message.recipient.profiles.full_name
      })) as Message[];
    },
    enabled: !!userId,
  });

  const sendMessage = useMutation({
    mutationFn: async (message: {
      recipient_id: string;
      subject: string;
      content: string;
    }) => {
      if (!userId || !companyId) {
        throw new Error('User not authenticated or company not selected');
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          recipient_id: message.recipient_id,
          company_id: companyId,
          subject: message.subject,
          content: message.content,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to send message: ${error.message}`,
      });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  return {
    receivedMessages,
    sentMessages,
    isLoading: isReceivedLoading || isSentLoading,
    sendMessage,
    markAsRead,
    unreadCount: receivedMessages?.filter(m => !m.is_read).length || 0,
  };
}
