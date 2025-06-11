
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailData {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  template?: 'document_expiry' | 'booking_reminder' | 'welcome' | 'password_reset';
  data?: Record<string, any>;
}

export function useEmailService() {
  const { toast } = useToast();

  const sendEmail = useMutation({
    mutationFn: async (emailData: EmailData) => {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData,
      });

      if (error) {
        throw new Error(error.message || 'Failed to send email');
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Email Error",
        description: error.message || 'Failed to send email',
      });
    },
  });

  // Helper functions for common email types
  const sendDocumentExpiryReminder = async (userEmail: string, documentData: {
    userName: string;
    documentName: string;
    expiryDate: string;
    daysRemaining: number;
  }) => {
    return sendEmail.mutateAsync({
      to: [userEmail],
      subject: `Document Expiry Reminder - ${documentData.documentName}`,
      template: 'document_expiry',
      data: documentData,
    });
  };

  const sendBookingReminder = async (userEmail: string, bookingData: {
    userName: string;
    serviceType: string;
    bookingDate: string;
    vehicleInfo: string;
    serviceCenterName: string;
  }) => {
    return sendEmail.mutateAsync({
      to: [userEmail],
      subject: `Service Booking Reminder - ${bookingData.serviceType}`,
      template: 'booking_reminder',
      data: bookingData,
    });
  };

  const sendWelcomeEmail = async (userEmail: string, userData: {
    userName: string;
    email: string;
    role: string;
    companyName?: string;
  }) => {
    return sendEmail.mutateAsync({
      to: [userEmail],
      subject: 'Welcome to Fleet Manager',
      template: 'welcome',
      data: userData,
    });
  };

  const sendPasswordResetEmail = async (userEmail: string, resetData: {
    userName: string;
    resetLink: string;
  }) => {
    return sendEmail.mutateAsync({
      to: [userEmail],
      subject: 'Password Reset Request',
      template: 'password_reset',
      data: resetData,
    });
  };

  return {
    sendEmail,
    sendDocumentExpiryReminder,
    sendBookingReminder,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    isLoading: sendEmail.isPending,
  };
}
