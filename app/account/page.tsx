import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { CUSTOMER_COOKIE, getStripe, stripeEnabled } from "@/lib/stripe";
import { fmtMoney, getPlan } from "@/lib/plans";
import { PageHead } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account & billing" };

export default async function Page() {
  const customer = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  let subs: { plan: string; status: string; amount: number; currency: string; interval: string }[] = [];
  let email: string | null = null;
  if (stripeEnabled() && customer) {
    try {
      const stripe = getStripe();
      const [c, list] = await Promise.all([stripe.customers.retrieve(customer), stripe.subscriptions.list({ customer, status: "all", limit: 5 })]);
      if (!("deleted" in c && c.deleted)) email = (c as { email?: string | null }).email ?? null;
      subs = list.data.map((s) => {
        const item = s.items.data[0];
        return {
          plan: getPlan(s.metadata?.plan ?? "")?.name ?? "Subscription",
          status: s.status,
          amount: item?.price.unit_amount ?? 0,
          currency: item?.price.currency ?? "gbp",
          interval: item?.price.recurring?.interval ?? "month",
        };
      });
    } catch (e) {
      console.error("[account]", e);
    }
  }
  return (
    <div className="max-w-2xl">
      <PageHead kicker="Billing" title={<>Your <span className="grad-text">account</span></>} />
      {!customer ? (
        <div className="glass rounded-xl p-8 space-y-4">
          <p className="text-dim">No subscription found on this device. Once you subscribe, you can manage billing here.</p>
          <Link href="/pricing" className="inline-block rounded-lg bg-gradient-to-r from-cyan to-violet text-void px-5 py-2.5 font-medium">See plans</Link>
        </div>
      ) : (
        <div className="glass rounded-xl p-6 space-y-5">
          {email && <div className="text-sm text-dim">Signed in as <span className="text-ink">{email}</span></div>}
          {subs.map((s, i) => (
            <div key={i} className="flex items-center justify-between border border-line rounded-lg px-4 py-3">
              <div>
                <div className="font-medium">{s.plan}</div>
                <div className="font-mono text-xs text-mute">{fmtMoney(s.amount, s.currency)} / {s.interval}</div>
              </div>
              <span className={`chip ${s.status === "active" || s.status === "trialing" ? "!text-lime !border-lime/40" : "!text-amber !border-amber/40"}`}>{s.status}</span>
            </div>
          ))}
          <form action="/api/billing-portal" method="POST">
            <button className="rounded-lg border border-cyan/40 bg-cyan/10 text-cyan px-5 py-2.5 hover:bg-cyan/20">Manage billing, invoices &amp; cancellation →</button>
          </form>
        </div>
      )}
    </div>
  );
}
