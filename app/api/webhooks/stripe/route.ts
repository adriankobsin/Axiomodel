import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Stripe -> your server. Configure in Stripe: Developers -> Webhooks ->
// endpoint https://YOUR-DOMAIN/api/webhooks/stripe
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return NextResponse.json({ error: "webhook_not_configured" }, { status: 400 });

  const body = await req.text(); // raw body is required for signature verification
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[webhook] bad signature", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      // TODO: when you add user accounts, mark the user as subscribed here:
      //   s.customer, s.customer_details?.email, s.subscription, s.metadata?.plan
      console.log("[webhook] new subscription", { customer: s.customer, email: s.customer_details?.email, plan: s.metadata?.plan });
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      // TODO: update the user's plan/status in your database
      console.log(`[webhook] ${event.type}`, { customer: sub.customer, status: sub.status, plan: sub.metadata?.plan });
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      console.warn("[webhook] payment failed", { customer: inv.customer, email: inv.customer_email });
      break;
    }
    default:
      break;
  }
  return NextResponse.json({ received: true });
}
