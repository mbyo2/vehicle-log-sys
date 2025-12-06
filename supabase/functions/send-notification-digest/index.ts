import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface DigestEntry {
  id: string;
  user_id: string;
  company_id: string;
  notification_type: string;
  subject: string;
  message: string;
  data: Record<string, any>;
  created_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing notification digests...");

    // Get users with digest mode enabled
    const { data: digestPrefs, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id, company_id, digest_frequency')
      .eq('digest_mode', true)
      .eq('email_enabled', true);

    if (prefsError) {
      throw new Error(`Failed to fetch digest preferences: ${prefsError.message}`);
    }

    if (!digestPrefs || digestPrefs.length === 0) {
      console.log("No users with digest mode enabled");
      return new Response(JSON.stringify({ success: true, message: "No digests to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let totalProcessed = 0;

    for (const pref of digestPrefs) {
      // Fetch queued notifications for this user
      const { data: queuedNotifications, error: queueError } = await supabase
        .from('notification_digest_queue')
        .select('*')
        .eq('user_id', pref.user_id)
        .eq('delivery_method', 'email')
        .order('created_at', { ascending: true });

      if (queueError) {
        console.error(`Error fetching queue for user ${pref.user_id}:`, queueError);
        continue;
      }

      if (!queuedNotifications || queuedNotifications.length === 0) {
        continue;
      }

      // Get user details
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', pref.user_id)
        .single();

      if (userError || !user?.email) {
        console.error(`Error fetching user ${pref.user_id}:`, userError);
        continue;
      }

      // Generate digest email
      const digestHtml = generateDigestEmail(
        user.full_name || 'User',
        queuedNotifications as DigestEntry[]
      );

      // Send digest email
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Fleet Manager <notifications@resend.dev>",
          to: [user.email],
          subject: `Your Notification Digest (${queuedNotifications.length} notifications)`,
          html: digestHtml,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error(`Failed to send digest to ${user.email}:`, error);
        continue;
      }

      console.log(`Sent digest with ${queuedNotifications.length} notifications to ${user.email}`);

      // Delete processed notifications from queue
      const notificationIds = queuedNotifications.map(n => n.id);
      const { error: deleteError } = await supabase
        .from('notification_digest_queue')
        .delete()
        .in('id', notificationIds);

      if (deleteError) {
        console.error(`Error deleting processed notifications:`, deleteError);
      }

      totalProcessed += queuedNotifications.length;
    }

    console.log(`Processed ${totalProcessed} notifications in digests`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${totalProcessed} notifications` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error processing digests:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

function generateDigestEmail(userName: string, notifications: DigestEntry[]): string {
  const groupedByType = notifications.reduce((acc, n) => {
    if (!acc[n.notification_type]) {
      acc[n.notification_type] = [];
    }
    acc[n.notification_type].push(n);
    return acc;
  }, {} as Record<string, DigestEntry[]>);

  const typeLabels: Record<string, string> = {
    maintenance: 'Maintenance Reminders',
    vehicle_issue: 'Vehicle Issues',
    document_expiry: 'Document Expiry',
    user_action: 'User Actions',
    approval_required: 'Approvals Required',
    urgent: 'Urgent Alerts'
  };

  const typeColors: Record<string, string> = {
    urgent: '#dc2626',
    vehicle_issue: '#dc2626',
    approval_required: '#f59e0b',
    document_expiry: '#f59e0b',
    maintenance: '#2563eb',
    user_action: '#6b7280'
  };

  let notificationSections = '';

  for (const [type, items] of Object.entries(groupedByType)) {
    const color = typeColors[type] || '#2563eb';
    const label = typeLabels[type] || type;

    notificationSections += `
      <div style="margin-bottom: 24px;">
        <h3 style="color: ${color}; margin: 0 0 12px 0; font-size: 16px; border-bottom: 2px solid ${color}; padding-bottom: 8px;">
          ${label} (${items.length})
        </h3>
        <ul style="margin: 0; padding: 0; list-style: none;">
          ${items.map(item => `
            <li style="padding: 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 8px;">
              <strong style="color: #111827;">${item.subject}</strong>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">${item.message}</p>
              <small style="color: #9ca3af;">${new Date(item.created_at).toLocaleString()}</small>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; color: white;">
        <h1 style="margin: 0; font-size: 24px;">Your Notification Digest</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">${notifications.length} notification${notifications.length !== 1 ? 's' : ''} since your last digest</p>
      </div>
      <div style="padding: 24px;">
        <p style="margin: 0 0 24px 0; color: #374151;">Hello ${userName},</p>
        <p style="margin: 0 0 24px 0; color: #374151;">Here's a summary of your recent notifications:</p>
        ${notificationSections}
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            You're receiving this digest because you have digest mode enabled in your notification preferences.
            <br>To receive notifications immediately, disable digest mode in your settings.
          </p>
        </div>
      </div>
    </div>
  `;
}

serve(handler);
