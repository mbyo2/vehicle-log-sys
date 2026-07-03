// Shared auth helpers for edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.8";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function safeUrl(url: string | undefined | null): string {
  if (!url) return "#";
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "#";
    return u.toString();
  } catch {
    return "#";
  }
}

export interface AuthedCaller {
  userId: string;
  role: string | null;
  companyId: string | null;
}

/**
 * Validates the caller's JWT and returns their user id + primary role + company id.
 * Returns null on any failure — caller should respond 401.
 */
export async function getAuthedCaller(req: Request): Promise<AuthedCaller | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role, company_id")
    .eq("user_id", data.user.id)
    .order("role", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    userId: data.user.id,
    role: roleRow?.role ?? null,
    companyId: roleRow?.company_id ?? null,
  };
}

export function isAdminRole(role: string | null): boolean {
  return role === "super_admin" || role === "company_admin";
}

/**
 * For background/cron functions: require the incoming Authorization Bearer
 * token to equal the service role key (Supabase cron supplies this automatically).
 * Also accepts a shared INTERNAL_FUNCTION_SECRET header for manual triggers.
 */
export function isInternalCaller(req: Request): boolean {
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.replace("Bearer ", "").trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (bearer && serviceKey && bearer === serviceKey) return true;

  const secret = req.headers.get("x-internal-secret");
  const expected = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  if (secret && expected && secret === expected) return true;

  return false;
}

export function unauthorized(msg = "Unauthorized"): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function forbidden(msg = "Forbidden"): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
