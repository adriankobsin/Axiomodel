// ─── Pricing plans ───────────────────────────────────────────────
// Edit names, prices and feature lists here. Prices are in the
// smallest currency unit (pence for GBP). Checkout builds Stripe prices
// from these values, so you don't need to create products in the
// Stripe dashboard to start testing. To use dashboard prices instead,
// set STRIPE_PRICE_<PLAN>_<INTERVAL> (e.g. STRIPE_PRICE_PRO_MONTH=price_123).
//
// NOTE: the feature bullets below are placeholder copy. Only list
// features you have actually built before you take live payments.

export type Interval = "month" | "year";

export type Plan = {
  id: "free" | "pro" | "team";
  name: string;
  tagline: string;
  prices: Record<Interval, number>; // minor units
  features: string[];
  highlight?: boolean;
};

export const CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY || "gbp").toLowerCase();

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Explorer",
    tagline: "Everything public, free forever.",
    prices: { month: 0, year: 0 },
    features: ["Chat with every free model", "All rankings & leaderboard", "Model profiles & compare", "Public JSON API"],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For builders choosing models every week.",
    prices: { month: 900, year: 9000 },
    features: ["Everything in Explorer", "Chat with paid models (GPT, Claude, Gemini…)", "Far higher daily message limit", "Price & ranking change alerts", "Email support"],
    highlight: true,
  },
  {
    id: "team",
    name: "Team",
    tagline: "Shared workspace for your whole team.",
    prices: { month: 2900, year: 29000 },
    features: ["Everything in Pro", "Up to 10 seats", "Saved comparisons & shortlists", "Priority support"],
  },
];

export function getPlan(id: string) {
  return PLANS.find((p) => p.id === id);
}

export function fmtMoney(minor: number, currency = CURRENCY) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: minor % 100 ? 2 : 0 }).format(minor / 100);
}
