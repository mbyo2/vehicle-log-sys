import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.8';
import { VerificationEmail } from './_templates/verification-email.tsx';
import { PasswordResetEmail } from './_templates/password-reset-email.tsx';
import { WelcomeEmail } from './_templates/welcome-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'verification' | 'password_reset' | 'welcome' | 'invitation';
  email: string;
  data?: {
    name?: string;
    confirmationUrl?: string;
    resetUrl?: string;
    inviteUrl?: string;
    companyName?: string;
    inviterName?: string;
    role?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, data = {} }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to ${email}`);

    let html = '';
    let subject = '';
    let fromEmail = 'Fleet Manager <noreply@yourdomain.com>';

    switch (type) {
      case 'verification':
        html = await renderAsync(
          React.createElement(VerificationEmail, {
            confirmationUrl: data.confirmationUrl || '',
            userEmail: email,
          })
        );
        subject = 'Verify your email address';
        break;

      case 'password_reset':
        html = await renderAsync(
          React.createElement(PasswordResetEmail, {
            resetUrl: data.resetUrl || '',
            userEmail: email,
          })
        );
        subject = 'Reset your password';
        break;

      case 'welcome':
        html = await renderAsync(
          React.createElement(WelcomeEmail, {
            userName: data.name || 'User',
            userEmail: email,
            companyName: data.companyName || 'Fleet Manager',
          })
        );
        subject = 'Welcome to Fleet Manager';
        break;

      case 'invitation':
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>You're invited to join ${data.companyName || 'Fleet Manager'}</h1>
            <p>Hello,</p>
            <p>${data.inviterName || 'A team member'} has invited you to join their company as a ${data.role || 'team member'}.</p>
            <p>Click the link below to accept the invitation and create your account:</p>
            <a href="${data.inviteUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Accept Invitation</a>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>Best regards,<br>The Fleet Manager Team</p>
          </div>
        `;
        subject = `Invitation to join ${data.companyName || 'Fleet Manager'}`;
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);