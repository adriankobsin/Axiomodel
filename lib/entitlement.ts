import "server-only";
import { cookies } from "next/headers";
import { CUSTOMER_COOKIE, getStripe, stripeEnabled } from "./stripe";

const cache = new Map<string, { at: number; pro: boolean }>();
const TTL = 10 * 60 * 1000;

/** True if this visitor's Stripe customer has an active or trialing subscription. */
export async function isPro(): Promise<boolean> {
  if (!stripeEnabled()) return false;
  const customer = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!customer) return false;
  const hit = cache.get(customer);
  if (hit && Date.now() - hit.at < TTL) return hit.pro;
  try {
    const subs = await getStripe().subscriptions.list({ customer, status: "all", limit: 5 });
    const pro = subs.data.some((s) => s.status === "active" || s.status === "trialing");
    cache.set(customer, { at: Date.now(), pro });
    return pro;
  } catch {
    return false;
  }
}
