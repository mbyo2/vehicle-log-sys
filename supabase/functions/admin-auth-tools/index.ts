import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.8";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "bootstrap_super_admin" | "generate_reset_link" | "set_password";

async function findUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<string | null> {
  // Auth Admin API has no direct getUserByEmail; we page through users (safe for small tenants).
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);

    const found = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (found?.id) return found.id;

    // Stop early if we've exhausted the list.
    if (!data.users.length || (data.lastPage && page >= data.lastPage)) break;
  }
  return null;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return json(500, {
        error:
          "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY environment variables.",
      });
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => null) as
      | {
          action?: Action;
          email?: string;
          full_name?: string;
          redirectTo?: string;
        }
      | null;

    const action = body?.action;
    if (!action) return json(400, { error: "Missing 'action' in request body" });

    if (action === "bootstrap_super_admin") {
      const email = (body?.email || "admin@yourcompany.com").trim().toLowerCase();
      const fullName = (body?.full_name || "Super Admin").trim();
      const origin = req.headers.get("origin") || "";
      const redirectTo = body?.redirectTo || (origin ? `${origin}/reset-password` : undefined);

      // Only allow this once (when no super_admin exists yet)
      const { data: isFirstUser, error: firstUserError } = await admin.rpc("check_if_first_user");
      if (firstUserError) return json(500, { error: firstUserError.message });
      if (!isFirstUser) {
        return json(403, {
          error: "Super admin already exists. Bootstrap is disabled.",
        });
      }

      // Create or reuse auth user
      let userId: string | null = null;
      try {
        userId = await findUserIdByEmail(admin, email);
      } catch (e) {
        return json(500, { error: e instanceof Error ? e.message : "Failed to list users" });
      }

      if (!userId) {
        // Some Supabase Auth configs disallow creating email users without a password.
        // We create a temporary strong password, then immediately return a recovery link
        // so the admin can set a real password via the normal reset flow.
        const tempPassword = `Tmp-${crypto.randomUUID()}aA1!`;
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

        if (createError) return json(500, { error: createError.message });
        userId = created.user?.id ?? null;
      }

      if (!userId) return json(500, { error: "Failed to determine created user id" });

      // Ensure profile exists (roles must be stored separately)
      const { error: profileError } = await admin
        .from("profiles")
        .upsert({ id: userId, email, full_name: fullName }, { onConflict: "id" });
      if (profileError) return json(500, { error: profileError.message });

      // Ensure role exists using RPC function to avoid enum comparison issues
      const { data: hasRole } = await admin.rpc("user_has_super_admin_role", { _user_id: userId });
      
      if (!hasRole) {
        // Insert super_admin role using RPC function
        const { error: roleError } = await admin.rpc("insert_super_admin_role", { _user_id: userId });
        if (roleError) return json(500, { error: roleError.message });
      }

      // Return a set-password link (recovery flow) so we don't handle passwords here
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });
      if (linkError) return json(500, { error: linkError.message });

      const setPasswordLink = linkData?.properties?.action_link;
      if (!setPasswordLink) return json(500, { error: "Failed to generate set-password link" });

      return json(200, {
        userId,
        email,
        full_name: fullName,
        setPasswordLink,
      });
    }

    if (action === "generate_reset_link") {
      const targetEmail = (body?.email || "").trim().toLowerCase();
      if (!targetEmail) return json(400, { error: "Missing 'email'" });

      const origin = req.headers.get("origin") || "";
      const redirectTo = body?.redirectTo || (origin ? `${origin}/reset-password` : undefined);

      // Require a valid logged-in user
      const authHeader = req.headers.get("Authorization") || "";
      if (!authHeader) return json(401, { error: "Missing Authorization header" });

      const authed = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      });

      const { data: userData, error: userError } = await authed.auth.getUser();
      if (userError) return json(401, { error: userError.message });
      const caller = userData.user;
      if (!caller) return json(401, { error: "Not authenticated" });

      // Check caller role using RPC function to avoid enum comparison issues
      const { data: callerRole, error: callerRoleError } = await admin.rpc("user_has_admin_role", { _user_id: caller.id });
      
      if (callerRoleError) return json(500, { error: callerRoleError.message });
      if (!callerRole) return json(403, { error: "Insufficient permissions" });

      // If company_admin, only allow resets within the same company
      if (callerRole === "company_admin") {
        const [{ data: callerProfile }, { data: targetProfile }] = await Promise.all([
          admin.from("profiles").select("company_id").eq("id", caller.id).maybeSingle(),
          admin.from("profiles").select("company_id").eq("email", targetEmail).maybeSingle(),
        ]);

        if (!callerProfile?.company_id || !targetProfile?.company_id) {
          return json(403, { error: "Company scoping failed for password reset" });
        }
        if (callerProfile.company_id !== targetProfile.company_id) {
          return json(403, { error: "Cannot reset password for users in other companies" });
        }
      }

      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: targetEmail,
        options: redirectTo ? { redirectTo } : undefined,
      });

      if (linkError) return json(500, { error: linkError.message });

      const actionLink = linkData?.properties?.action_link;
      if (!actionLink) return json(500, { error: "Failed to generate reset link" });

      return json(200, {
        email: targetEmail,
        actionLink,
        redirectTo: linkData?.properties?.redirect_to,
      });
    }

    if (action === "set_password") {
      const targetEmail = (body?.email || "").trim().toLowerCase();
      const newPassword = (body as any)?.password || "";
      if (!targetEmail || !newPassword) return json(400, { error: "Missing 'email' or 'password'" });

      let userId: string | null = null;
      try {
        userId = await findUserIdByEmail(admin, targetEmail);
      } catch (e) {
        return json(500, { error: e instanceof Error ? e.message : "Failed to find user" });
      }
      if (!userId) return json(404, { error: "User not found" });

      const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
      if (updateError) return json(500, { error: updateError.message });

      return json(200, { success: true, email: targetEmail });
    }

    return json(400, { error: `Unknown action '${action}'` });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json(500, { error: message });
  }
});
