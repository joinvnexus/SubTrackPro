import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import { consumeRateLimit, getRequestClientIp } from "@/lib/rate-limit";

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
      return NextResponse.json(
        { error: "Too many webhook requests. Please retry later." },
        { status: 429, headers: rateLimit.headers }
      );
    }

    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        {
          error:
            "Stripe webhook is not configured. Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET.",
        },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe signature" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId || session.client_reference_id;

        if (userId) {
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
            userId,
            plan: "pro",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            stripePriceId,
            stripeCurrentPeriodEnd,
            isActive: activeStatus,
          });
        } else {
          console.warn("checkout.session.completed received without userId metadata");
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: userPlan } = await supabase
          .from("user_plans")
          .select("userId")
          .eq("stripeCustomerId", subscription.customer)
          .single();

        if (userPlan) {
          await supabase.from("user_plans").update({
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeSubscriptionId: subscription.id,
            isActive: isPlanActive(subscription.status),
            plan: isPlanActive(subscription.status) ? "pro" : "free",
          }).eq("userId", userPlan.userId);
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: userPlan } = await supabase
          .from("user_plans")
          .select("userId")
          .eq("stripeCustomerId", subscription.customer)
          .maybeSingle();

        if (userPlan) {
          await supabase
            .from("user_plans")
            .update({
              plan: "pro",
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0]?.price.id,
              stripeCurrentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              isActive: isPlanActive(subscription.status),
            })
            .eq("userId", userPlan.userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: userPlan } = await supabase
          .from("user_plans")
          .select("userId")
          .eq("stripeCustomerId", subscription.customer)
          .single();

        if (userPlan) {
          await supabase.from("user_plans").update({
            isActive: false,
            plan: "free",
            stripeSubscriptionId: null,
            stripePriceId: null,
          }).eq("userId", userPlan.userId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
