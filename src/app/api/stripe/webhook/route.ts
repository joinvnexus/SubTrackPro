import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

// Initialize Stripe (will use env variables in production)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(request: Request) {
  try {
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
        process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder"
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
        
        // Get the user ID from metadata
        const userId = session.metadata?.userId;
        
        if (userId) {
          // Get price_id from line_items or subscription
          let stripePriceId: string | undefined;
          if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            stripePriceId = subscription.items.data[0]?.price.id;
          }
          
          // Update user plan to pro
          await supabase.from("user_plans").upsert({
            userId: userId,
            plan: "pro",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            stripePriceId: stripePriceId,
            isActive: true,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by stripe customer ID
        const { data: userPlan } = await supabase
          .from("user_plans")
          .select("userId")
          .eq("stripeCustomerId", subscription.customer)
          .single();

        if (userPlan) {
          await supabase.from("user_plans").update({
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            isActive: subscription.status === "active",
          }).eq("userId", userPlan.userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by stripe customer ID and deactivate
        const { data: userPlan } = await supabase
          .from("user_plans")
          .select("userId")
          .eq("stripeCustomerId", subscription.customer)
          .single();

        if (userPlan) {
          await supabase.from("user_plans").update({
            isActive: false,
            plan: "free",
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
