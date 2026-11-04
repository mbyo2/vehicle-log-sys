// Lenco webhook: verifies X-Lenco-Signature = HMAC-SHA512(body, SHA256(api secret key))
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { applyCollection, fetchCollection } from "../_shared/lenco.ts";

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");

async function expectedSignature(raw: string, apiKey: string) {
  const hashKey = hex(await crypto.subtle.digest("SHA-256", enc.encode(apiKey)));
  const key = await crypto.subtle.importKey("raw", enc.encode(hashKey), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(raw)));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const apiKey = Deno.env.get("LENCO_SECRET_KEY");
  if (!apiKey) return new Response("Not configured", { status: 503 });

  const raw = await req.text();
  const sig = (req.headers.get("x-lenco-signature") ?? "").toLowerCase();
  if (!sig || !safeEqual(sig, await expectedSignature(raw, apiKey))) return new Response("Invalid signature", { status: 401 });

  try {
    const event = JSON.parse(raw);
    if (typeof event?.event === "string" && event.event.startsWith("collection.") && event.data?.reference) {
      // Re-query Lenco as the source of truth before granting access.
      const fresh = (await fetchCollection(event.data.reference)) ?? event.data;
      await applyCollection(fresh);
    }
  } catch (e) {
    console.error("lenco-webhook error", e);
  }
  return new Response("ok", { status: 200 });
});
