import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import { consumeRateLimit, getRequestClientIp } from "@/lib/rate-limit";
import { apiError, apiServerError } from "@/lib/api-error";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-02-24.acacia",
    })
  : null;

function isPlanActive(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}

export async function POST(request: Request) {
  try {
    const clientIp = getRequestClientIp(request);
    const rateLimit = consumeRateLimit({
      key: `stripe-webhook:${clientIp}`,
      maxRequests: 180,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiError(
        "Too many webhook requests. Please retry later.",
        429,
        rateLimit.headers
      );
    }

    if (!stripe || !webhookSecret) {
      return apiError(
        "Stripe webhook is not configured. Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET.",
        500
      );
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return apiError("Missing stripe signature", 400);
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return apiError("Invalid signature", 400);
    }

    const supabase = await createAdminClient();

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const user_id = session.metadata?.user_id || session.client_reference_id;

        if (user_id) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;

          let stripePriceId: string | undefined = undefined;
          let stripeCurrentPeriodEnd: string | undefined = undefined;
          let activeStatus = true;

          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            stripePriceId = subscription.items.data[0]?.price.id;
            stripeCurrentPeriodEnd = new Date(
              subscription.current_period_end * 1000
            ).toISOString();
            activeStatus = isPlanActive(subscription.status);
          }

          await supabase.from("user_plans").upsert({
            user_id,
            plan: "pro",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: stripePriceId,
            stripe_current_period_end: stripeCurrentPeriodEnd,
            is_active: activeStatus,
          });
        } else {
          console.warn("checkout.session.completed received without user_id metadata");
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: userPlan } = await supabase
          .from("user_plans")
          .select("user_id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (userPlan) {
          await supabase.from("user_plans").update({
            stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            stripe_price_id: subscription.items.data[0]?.price.id,
            stripe_subscription_id: subscription.id,
            is_active: isPlanActive(subscription.status),
            plan: isPlanActive(subscription.status) ? "pro" : "free",
          }).eq("user_id", userPlan.user_id);
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: userPlan } = await supabase
          .from("user_plans")
          .select("user_id")
          .eq("stripe_customer_id", subscription.customer)
          .maybeSingle();

        if (userPlan) {
          await supabase
            .from("user_plans")
            .update({
              plan: "pro",
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0]?.price.id,
              stripe_current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              is_active: isPlanActive(subscription.status),
            })
            .eq("user_id", userPlan.user_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: userPlan } = await supabase
          .from("user_plans")
          .select("user_id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (userPlan) {
          await supabase.from("user_plans").update({
            is_active: false,
            plan: "free",
            stripe_subscription_id: null,
            stripe_price_id: null,
          }).eq("user_id", userPlan.user_id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return apiServerError(error, "Webhook error", "Webhook handler failed");
  }
}
