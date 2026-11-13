import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Loader2 } from "lucide-react";

declare global { interface Window { LencoPay?: { getPaid: (o: Record<string, unknown>) => void } } }

function loadLenco(env: string) {
  const src = env === "live" ? "https://pay.lenco.co/js/v1/inline.js" : "https://pay.sandbox.lenco.co/js/v1/inline.js";
  return new Promise<void>((resolve, reject) => {
    if (window.LencoPay && document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.onload = () => resolve(); s.onerror = () => reject(new Error("Could not load Lenco checkout"));
    document.body.appendChild(s);
  });
}

export default function Billing() {
  const { profile } = useAuth();
  const currentProfile = profile.get();
  const companyId = currentProfile?.company_id;
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = "Billing | Fleet Management"; }, []);

  const { data: config } = useQuery({
    queryKey: ["lenco-config"],
    queryFn: async () => (await supabase.functions.invoke("lenco-payments", { body: { action: "config" } })).data as
      { configured: boolean; amount: number | null; currency: string; env: string } | null,
  });

  const { data: company } = useQuery({
    queryKey: ["billing-company", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("name, subscription_type, subscription_status, current_period_end, trial_end_date").eq("id", companyId!).single();
      return data as any;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["billing-payments", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase as any).from("subscription_payments").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(24);
      return (data ?? []) as any[];
    },
  });

  const refresh = () => { qc.invalidateQueries({ queryKey: ["billing-company"] }); qc.invalidateQueries({ queryKey: ["billing-payments"] }); };

  const verify = async (reference: string) => {
    const { data } = await supabase.functions.invoke("lenco-payments", { body: { action: "verify", reference } });
    if (data?.status === "successful") toast({ title: "Payment received", description: "Your subscription is active for another month." });
    else if (data?.status === "failed") toast({ title: "Payment failed", description: "No money was taken. Please try again.", variant: "destructive" });
    else toast({ title: "Payment processing", description: "We'll activate your subscription as soon as Lenco confirms it." });
    refresh();
  };

  const pay = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("lenco-payments", { body: { action: "init" } });
      if (error || !data?.reference) throw new Error(data?.error || "Payments are not available yet.");
      await loadLenco(data.env);
      const [firstName, ...rest] = String(data.name || "").split(" ");
      window.LencoPay!.getPaid({
        key: data.publicKey, reference: data.reference, email: data.email, amount: data.amount, currency: data.currency,
        label: "ZFleet monthly subscription", channels: ["card", "mobile-money"],
        customer: { firstName: firstName || undefined, lastName: rest.join(" ") || undefined },
        onSuccess: (r: { reference: string }) => verify(r.reference ?? data.reference),
        onConfirmationPending: () => verify(data.reference),
        onClose: () => { toast({ title: "Payment not completed" }); refresh(); },
      });
    } catch (e) {
      toast({ title: "Couldn't start payment", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const periodEnd = company?.current_period_end ? new Date(company.current_period_end) : null;
  const active = !!periodEnd && periodEnd > new Date();

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Pay your monthly subscription with card or mobile money via Lenco.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Subscription</CardTitle>
          <CardDescription>{company?.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={active ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
              {active ? "Active" : company?.subscription_type === "trial" ? "Trial" : "Payment due"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {active ? `Paid until ${periodEnd!.toLocaleDateString()}` :
                company?.trial_end_date ? `Trial ends ${new Date(company.trial_end_date).toLocaleDateString()}` : "No active paid period"}
            </span>
          </div>
          {config?.configured ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-2xl font-semibold">{config.currency} {config.amount?.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">/ month</span></div>
              <Button onClick={pay} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{active ? "Pay next month" : "Pay now"}</Button>
              {config.env !== "live" && <Badge variant="outline">Test mode</Badge>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Online payments are being set up and will be available soon.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment history</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments yet.</p> : (
            <div className="divide-y">
              {payments.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <div className="font-medium">{p.currency} {Number(p.amount).toFixed(2)}</div>
                    <div className="text-muted-foreground">{new Date(p.created_at).toLocaleString()} · {p.reference}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "successful" ? "default" : p.status === "pending" ? "secondary" : "destructive"}>{p.status}</Badge>
                    {p.status === "pending" && <Button size="sm" variant="outline" onClick={() => verify(p.reference)}>Check status</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
