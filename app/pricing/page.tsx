import Link from "next/link";
import type { Metadata } from "next";
import { PLANS, fmtMoney, type Interval } from "@/lib/plans";
import { isTestMode, stripeEnabled } from "@/lib/stripe";
import { PageHead } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pricing" };

const ERRORS: Record<string, string> = {
  not_configured: "Payments aren't switched on yet. Add STRIPE_SECRET_KEY to the server's environment variables.",
  invalid_plan: "That plan isn't available.",
  stripe: "Stripe couldn't start the checkout. Please try again.",
  incomplete: "The payment wasn't completed.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ interval?: string; error?: string; canceled?: string }> }) {
  const sp = await searchParams;
  const interval: Interval = sp.interval === "year" ? "year" : "month";
  const enabled = stripeEnabled();
  return (
    <div>
      <PageHead kicker="Plans · cancel anytime" title={<>Simple <span className="grad-text">pricing</span></>}>
        <p className="text-dim max-w-2xl">Start free. Upgrade when you need alerts, exports and more API headroom.</p>
      </PageHead>

      <div className="space-y-6">
        {sp.error && <div className="border border-magenta/40 bg-magenta/10 text-magenta rounded-lg px-4 py-2.5 text-sm font-mono">✕ {ERRORS[sp.error] ?? "Something went wrong."}</div>}
        {sp.canceled && <div className="border border-line-2 bg-panel rounded-lg px-4 py-2.5 text-sm text-dim font-mono">Checkout cancelled. You haven&apos;t been charged.</div>}
        {enabled && isTestMode() && (
          <div className="border border-amber/40 bg-amber/10 text-amber rounded-lg px-4 py-2.5 text-sm font-mono">
            ◇ TEST MODE: no real money moves. Pay with card 4242 4242 4242 4242, any future date, any CVC.
          </div>
        )}

        <div className="inline-flex glass rounded-lg p-1 font-mono text-sm">
          {(["month", "year"] as const).map((i) => (
            <Link key={i} href={`/pricing?interval=${i}`} className={`px-4 py-1.5 rounded-md transition-colors ${interval === i ? "bg-cyan/15 text-cyan" : "text-dim hover:text-ink"}`}>
              {i === "month" ? "Monthly" : "Yearly · 2 months free"}
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((p) => {
            const price = p.prices[interval];
            return (
              <div key={p.id} className={`glass rounded-2xl p-7 flex flex-col gap-5 ${p.highlight ? "glow-border shadow-[0_0_60px_-20px_rgba(62,240,255,0.5)]" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xl">{p.name}</div>
                  {p.highlight && <span className="chip !text-cyan !border-cyan/50">Most popular</span>}
                </div>
                <p className="text-sm text-dim -mt-3">{p.tagline}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-4xl">{price === 0 ? "Free" : fmtMoney(price)}</span>
                  {price > 0 && <span className="text-mute text-sm">/ {interval}</span>}
                </div>
                <ul className="space-y-2 text-sm flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5"><span className="text-cyan font-mono">+</span><span className="text-dim">{f}</span></li>
                  ))}
                </ul>
                {price === 0 ? (
                  <Link href="/best-models-for" className="text-center rounded-lg border border-line-2 px-4 py-3 text-dim hover:text-ink hover:border-cyan/40">Start exploring</Link>
                ) : (
                  <form action="/api/checkout" method="POST">
                    <input type="hidden" name="plan" value={p.id} />
                    <input type="hidden" name="interval" value={interval} />
                    <button
                      type="submit"
                      disabled={!enabled}
                      className={`w-full rounded-lg px-4 py-3 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${p.highlight ? "bg-gradient-to-r from-cyan to-violet text-void hover:brightness-110" : "border border-cyan/40 text-cyan bg-cyan/10 hover:bg-cyan/20"}`}
                    >
                      {enabled ? `Get ${p.name}` : "Payments not configured"}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-mute font-mono">Secure payments by Stripe. Prices shown in {process.env.NEXT_PUBLIC_CURRENCY?.toUpperCase() || "GBP"}. Manage or cancel any time from <Link href="/account" className="text-cyan hover:underline">your account</Link>.</p>
      </div>
    </div>
  );
}
