import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getAuthedCaller, unauthorized, forbidden } from "../_shared/auth.ts";
import { LENCO_ENV, planConfig, serviceClient, fetchCollection, applyCollection } from "../_shared/lenco.ts";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const caller = await getAuthedCaller(req);
  if (!caller) return unauthorized();
  if (caller.role !== "company_admin" && caller.role !== "super_admin") return forbidden("Only company admins can manage billing");

  let body: { action?: string; reference?: string; companyId?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const db = serviceClient();

  const companyId = caller.role === "super_admin" && body.companyId ? body.companyId : caller.companyId;
  if (!companyId) return json({ error: "No company linked to your account" }, 400);

  if (body.action === "config") {
    const { amount, currency } = planConfig();
    return json({ configured: !!amount && !!Deno.env.get("LENCO_PUBLIC_KEY") && !!Deno.env.get("LENCO_SECRET_KEY"), amount, currency, env: LENCO_ENV });
  }

  if (body.action === "init") {
    const { amount, currency } = planConfig();
    const publicKey = Deno.env.get("LENCO_PUBLIC_KEY");
    if (!amount || !publicKey || !Deno.env.get("LENCO_SECRET_KEY")) return json({ error: "Payments are not set up yet. Please try again later." }, 503);
    const reference = `zf-${companyId.slice(0, 8)}-${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;
    const { error } = await db.from("subscription_payments").insert({ company_id: companyId, reference, amount, currency, status: "pending", created_by: caller.userId });
    if (error) return json({ error: "Could not start payment" }, 500);
    const { data: profile } = await db.from("profiles").select("email, full_name").eq("id", caller.userId).maybeSingle();
    return json({ reference, amount, currency, publicKey, env: LENCO_ENV, email: profile?.email ?? "", name: profile?.full_name ?? "" });
  }

  if (body.action === "verify") {
    const ref = String(body.reference ?? "");
    if (!/^[A-Za-z0-9._-]{1,100}$/.test(ref)) return json({ error: "Invalid reference" }, 400);
    const { data: pay } = await db.from("subscription_payments").select("company_id").eq("reference", ref).maybeSingle();
    if (!pay || (caller.role !== "super_admin" && pay.company_id !== caller.companyId)) return forbidden("Not your payment");
    const c = await fetchCollection(ref);
    if (!c) return json({ status: "pending" });
    return json(await applyCollection(c));
  }

  return json({ error: "Unknown action" }, 400);
});
