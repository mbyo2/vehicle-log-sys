import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AcceptRequest {
  token: string;
  password: string;
  fullName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = (await req.json()) as AcceptRequest;
    const { token, password, fullName } = body || ({} as AcceptRequest);

    if (!token || !password || password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Missing token or password (min 8 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1) Load invitation via SECURITY DEFINER RPC (table is no longer publicly readable)
    const { data: inviteRows, error: invErr } = await admin.rpc('get_invitation_by_token', { _token: token });
    const invite = Array.isArray(inviteRows) ? inviteRows[0] : inviteRows;

    if (invErr || !invite) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired invitation" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) Find or create user
    let userId: string | null = null;

    // Try to look up existing user by email via admin listUsers (paged)
    // Note: createUser will fail if email already exists, so we attempt creation first.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || invite.email.split("@")[0],
        role: invite.role,
        invited: true,
      },
    });

    if (createErr) {
      // If user exists, fail with a clear message — we don't reset password silently.
      const msg = (createErr.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return new Response(
          JSON.stringify({
            error:
              "An account with this email already exists. Please sign in instead.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.error("[accept-invitation] createUser error:", createErr);
      return new Response(
        JSON.stringify({ error: createErr.message || "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    userId = created.user!.id;

    // 3) Upsert profile with company assignment
    const { error: profileErr } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: invite.email,
          full_name: fullName || invite.email.split("@")[0],
          company_id: invite.company_id,
        },
        { onConflict: "id" },
      );

    if (profileErr) {
      console.error("[accept-invitation] profile upsert error:", profileErr);
    }

    // 4) Ensure user_role row exists for invited company.
    // The handle_new_user trigger may have inserted a row with NULL company.
    // Remove any null-company role rows for this user, then insert the correct one.
    await admin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .is("company_id", null);

    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert(
        {
          user_id: userId,
          role: invite.role,
          company_id: invite.company_id,
        },
        { onConflict: "user_id,company_id" },
      );

    if (roleErr) {
      console.error("[accept-invitation] role upsert error:", roleErr);
      return new Response(
        JSON.stringify({ error: "Failed to assign role: " + roleErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 5) Mark invitation accepted
    await admin
      .from("user_invitations")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    return new Response(
      JSON.stringify({
        success: true,
        email: invite.email,
        role: invite.role,
        company_id: invite.company_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("[accept-invitation] fatal:", e);
    return new Response(
      JSON.stringify({ error: e?.message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
