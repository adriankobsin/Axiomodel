import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { baseUrl, CUSTOMER_COOKIE, getStripe, stripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// POST /api/billing-portal -> Stripe Customer Portal (manage card, cancel, invoices)
export async function POST(req: Request) {
  const base = baseUrl(req);
  const customer = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!stripeEnabled() || !customer) return NextResponse.redirect(`${base}/account`, 303);
  try {
    const portal = await getStripe().billingPortal.sessions.create({ customer, return_url: `${base}/account` });
    return NextResponse.redirect(portal.url, 303);
  } catch (err) {
    console.error("[billing-portal] Stripe error", err);
    return NextResponse.redirect(`${base}/account?error=portal`, 303);
  }
}
