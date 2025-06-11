
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  template?: 'document_expiry' | 'booking_reminder' | 'welcome' | 'password_reset';
  data?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text, template, data }: EmailRequest = await req.json()

    // Get Resend API key from secrets
    const resendApiKey = Deno.env.get('RESEND')
    if (!resendApiKey) {
      throw new Error('RESEND API key not configured')
    }

    let emailContent = { html, text }

    // Generate content from template if specified
    if (template) {
      emailContent = generateTemplateContent(template, data || {})
    }

    // Send email using Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Fleet Manager <noreply@fleet-manager.com>',
        to,
        subject,
        html: emailContent.html,
        text: emailContent.text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${error}`)
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Email sending error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function generateTemplateContent(template: string, data: Record<string, any>) {
  const templates = {
    document_expiry: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Document Expiry Reminder</h2>
          <p>Hello ${data.userName || 'there'},</p>
          <p>This is a reminder that the following document will expire soon:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>${data.documentName}</strong><br>
            Expiry Date: ${data.expiryDate}<br>
            Days Remaining: ${data.daysRemaining}
          </div>
          <p>Please renew this document before it expires to avoid any service interruptions.</p>
          <p>Best regards,<br>Fleet Manager Team</p>
        </div>
      `,
      text: `Document Expiry Reminder\n\nHello ${data.userName || 'there'},\n\nThis is a reminder that the following document will expire soon:\n\n${data.documentName}\nExpiry Date: ${data.expiryDate}\nDays Remaining: ${data.daysRemaining}\n\nPlease renew this document before it expires.\n\nBest regards,\nFleet Manager Team`
    },
    booking_reminder: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Service Booking Reminder</h2>
          <p>Hello ${data.userName || 'there'},</p>
          <p>This is a reminder about your upcoming service booking:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>Service:</strong> ${data.serviceType}<br>
            <strong>Date:</strong> ${data.bookingDate}<br>
            <strong>Vehicle:</strong> ${data.vehicleInfo}<br>
            <strong>Service Center:</strong> ${data.serviceCenterName}
          </div>
          <p>Please ensure your vehicle is available at the scheduled time.</p>
          <p>Best regards,<br>Fleet Manager Team</p>
        </div>
      `,
      text: `Service Booking Reminder\n\nHello ${data.userName || 'there'},\n\nThis is a reminder about your upcoming service booking:\n\nService: ${data.serviceType}\nDate: ${data.bookingDate}\nVehicle: ${data.vehicleInfo}\nService Center: ${data.serviceCenterName}\n\nPlease ensure your vehicle is available at the scheduled time.\n\nBest regards,\nFleet Manager Team`
    },
    welcome: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Welcome to Fleet Manager</h2>
          <p>Hello ${data.userName || 'there'},</p>
          <p>Welcome to Fleet Manager! Your account has been successfully created.</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>Account Details:</strong><br>
            Email: ${data.email}<br>
            Role: ${data.role}<br>
            Company: ${data.companyName || 'Not assigned'}
          </div>
          <p>You can now log in and start managing your fleet operations.</p>
          <p>Best regards,<br>Fleet Manager Team</p>
        </div>
      `,
      text: `Welcome to Fleet Manager\n\nHello ${data.userName || 'there'},\n\nWelcome to Fleet Manager! Your account has been successfully created.\n\nAccount Details:\nEmail: ${data.email}\nRole: ${data.role}\nCompany: ${data.companyName || 'Not assigned'}\n\nYou can now log in and start managing your fleet operations.\n\nBest regards,\nFleet Manager Team`
    },
    password_reset: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Password Reset Request</h2>
          <p>Hello ${data.userName || 'there'},</p>
          <p>You requested a password reset for your Fleet Manager account.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.resetLink}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p>This link will expire in 24 hours. If you didn't request this reset, please ignore this email.</p>
          <p>Best regards,<br>Fleet Manager Team</p>
        </div>
      `,
      text: `Password Reset Request\n\nHello ${data.userName || 'there'},\n\nYou requested a password reset for your Fleet Manager account.\n\nClick here to reset your password: ${data.resetLink}\n\nThis link will expire in 24 hours. If you didn't request this reset, please ignore this email.\n\nBest regards,\nFleet Manager Team`
    }
  }

  return templates[template as keyof typeof templates] || { html: '', text: '' }
}
