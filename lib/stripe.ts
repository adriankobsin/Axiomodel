import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

export function stripeEnabled() {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!client) client = new Stripe(key, { appInfo: { name: "axiom-model-finder" } });
  return client;
}

export function isTestMode() {
  return (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_");
}

/** Absolute base URL of the current deployment, for Stripe redirect URLs. */
export function baseUrl(req: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && !fromEnv.includes("localhost")) return fromEnv.replace(/\/$/, "");
  const u = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? u.host;
  return `${proto}://${host}`;
}

export const CUSTOMER_COOKIE = "axiom_customer";
