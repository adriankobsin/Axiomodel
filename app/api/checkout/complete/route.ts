import { NextResponse } from "next/server";
import { baseUrl, CUSTOMER_COOKIE, getStripe, stripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Stripe redirects here after payment. We verify the session server-side,
// remember the Stripe customer in a secure cookie (so "Manage billing" works),
// then show the success page.
export async function GET(req: Request) {
  const base = baseUrl(req);
  const id = new URL(req.url).searchParams.get("session_id");
  if (!stripeEnabled() || !id) return NextResponse.redirect(`${base}/pricing`, 303);
  try {
    const s = await getStripe().checkout.sessions.retrieve(id);
    if (s.status !== "complete" || !s.customer) return NextResponse.redirect(`${base}/pricing?error=incomplete`, 303);
    const params = new URLSearchParams({ plan: s.metadata?.plan ?? "", email: s.customer_details?.email ?? "" });
    const res = NextResponse.redirect(`${base}/checkout/success?${params}`, 303);
    res.cookies.set(CUSTOMER_COOKIE, String(s.customer), {
      httpOnly: true,
      secure: base.startsWith("https"),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (err) {
    console.error("[checkout/complete]", err);
    return NextResponse.redirect(`${base}/pricing?error=stripe`, 303);
  }
}
