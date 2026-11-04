// Shared Lenco helpers (docs: https://lenco-api.readme.io/v2.0/reference/accept-payments)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.8";

export const LENCO_ENV = (Deno.env.get("LENCO_ENV") ?? "sandbox").toLowerCase() === "live" ? "live" : "sandbox";

export function lencoApiBase(): string {
  const override = Deno.env.get("LENCO_API_BASE");
  if (override) return override.replace(/\/$/, "");
  return LENCO_ENV === "live" ? "https://api.lenco.co/access/v2" : "https://sandbox.lenco.co/access/v2";
}

export function planConfig() {
  const amount = Number(Deno.env.get("LENCO_MONTHLY_AMOUNT") ?? "");
  const currency = (Deno.env.get("LENCO_CURRENCY") ?? "ZMW").toUpperCase();
  return { amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null, currency };
}

export function serviceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

export interface LencoCollection {
  amount: string;
  currency: string;
  reference: string | null;
  lencoReference: string;
  type: string | null;
  status: "pending" | "successful" | "failed" | "pay-offline" | "3ds-auth-required";
  reasonForFailure: string | null;
  completedAt: string | null;
}

export async function fetchCollection(reference: string): Promise<LencoCollection | null> {
  const key = Deno.env.get("LENCO_SECRET_KEY");
  if (!key) throw new Error("LENCO_SECRET_KEY not configured");
  const res = await fetch(`${lencoApiBase()}/collections/status/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body?.status ? (body.data as LencoCollection) : null;
}

/** Idempotently apply a Lenco collection result to our payment + company records. */
export async function applyCollection(c: LencoCollection) {
  if (!c.reference) return { ok: false, reason: "no reference" };
  const db = serviceClient();
  const { data: pay } = await db.from("subscription_payments").select("*").eq("reference", c.reference).maybeSingle();
  if (!pay) return { ok: false, reason: "unknown reference" };
  if (pay.status === "successful") return { ok: true, status: "successful", already: true };

  if (c.status === "failed") {
    await db.from("subscription_payments").update({ status: "failed", failure_reason: c.reasonForFailure, lenco_reference: c.lencoReference, updated_at: new Date().toISOString() }).eq("id", pay.id);
    return { ok: true, status: "failed" };
  }
  if (c.status !== "successful") return { ok: true, status: c.status };

  // Guard against amount/currency tampering.
  if (Number(c.amount) + 0.001 < Number(pay.amount) || c.currency.toUpperCase() !== String(pay.currency).toUpperCase()) {
    await db.from("subscription_payments").update({ status: "mismatch", failure_reason: `Paid ${c.amount} ${c.currency}`, updated_at: new Date().toISOString() }).eq("id", pay.id);
    return { ok: false, reason: "amount mismatch" };
  }

  const { data: company } = await db.from("companies").select("current_period_end").eq("id", pay.company_id).single();
  const now = new Date();
  const existing = company?.current_period_end ? new Date(company.current_period_end) : null;
  const start = existing && existing > now ? existing : now;
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  // Conditional update keeps this idempotent if webhook and verify race.
  const { data: updated } = await db.from("subscription_payments").update({
    status: "successful", lenco_reference: c.lencoReference, payment_type: c.type,
    paid_at: c.completedAt ?? now.toISOString(), period_start: start.toISOString(), period_end: end.toISOString(),
    updated_at: now.toISOString(),
  }).eq("id", pay.id).neq("status", "successful").select("id");
  if (!updated?.length) return { ok: true, status: "successful", already: true };

  await db.from("companies").update({
    subscription_type: "full", subscription_status: "active", current_period_end: end.toISOString(), is_active: true,
  }).eq("id", pay.company_id);
  return { ok: true, status: "successful", period_end: end.toISOString() };
}
