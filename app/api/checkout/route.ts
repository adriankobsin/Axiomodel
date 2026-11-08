import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { baseUrl, getStripe, stripeEnabled } from "@/lib/stripe";
import { CURRENCY, getPlan, type Interval } from "@/lib/plans";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

// POST /api/checkout  (form fields: plan=pro|team, interval=month|year, email?)
export async function POST(req: Request) {
  const base = baseUrl(req);
  if (!stripeEnabled()) return NextResponse.redirect(`${base}/pricing?error=not_configured`, 303);

  const form = await req.formData();
  const plan = getPlan(String(form.get("plan") ?? ""));
  const interval = (String(form.get("interval") ?? "month") === "year" ? "year" : "month") as Interval;
  if (!plan || plan.prices[interval] <= 0) return NextResponse.redirect(`${base}/pricing?error=invalid_plan`, 303);

  // Prefer a price created in the Stripe dashboard if one is configured
  const envPrice = process.env[`STRIPE_PRICE_${plan.id.toUpperCase()}_${interval.toUpperCase()}`];
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = envPrice
    ? { price: envPrice, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: plan.prices[interval],
          recurring: { interval },
          product_data: { name: `${site.name} ${plan.name}`, description: plan.tagline },
        },
      };

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [lineItem],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "1" },
      metadata: { plan: plan.id, interval },
      subscription_data: { metadata: { plan: plan.id, interval } },
      success_url: `${base}/api/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/pricing?canceled=1`,
    });
    return NextResponse.redirect(session.url!, 303);
  } catch (err) {
    console.error("[checkout] Stripe error", err);
    return NextResponse.redirect(`${base}/pricing?error=stripe`, 303);
  }
}
