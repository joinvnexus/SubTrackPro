import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit, getRequestClientIp } from "@/lib/rate-limit";
import { apiError, apiServerError } from "@/lib/api-error";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePriceId = process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_PRICE_ID;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-02-24.acacia",
    })
  : null;

export async function POST(request: Request) {
  try {
    const clientIp = getRequestClientIp(request);
    const rateLimit = consumeRateLimit({
      key: `stripe-checkout:${clientIp}`,
      maxRequests: 10,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiError(
        "Too many requests. Please try again shortly.",
        429,
        rateLimit.headers
      );
    }

    if (!stripe || !stripePriceId) {
      return apiError(
        "Stripe is not configured. Missing STRIPE_SECRET_KEY or STRIPE_PRO_PRICE_ID.",
        500
      );
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { data: userPlan, error: planError } = await supabase
      .from("user_plans")
      .select("plan, isActive, stripeCustomerId")
      .eq("userId", user.id)
      .maybeSingle();

    if (planError) {
      return apiError(planError.message, 500);
    }

    if (userPlan?.plan === "pro" && userPlan?.isActive) {
      return apiError("Already on Pro plan", 400);
    }

    let stripeCustomerId = userPlan?.stripeCustomerId ?? null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId: user.id },
      });

      stripeCustomerId = customer.id;

      const { error: upsertError } = await supabase.from("user_plans").upsert({
        userId: user.id,
        plan: userPlan?.plan ?? "free",
        isActive: userPlan?.isActive ?? true,
        stripeCustomerId,
      });

      if (upsertError) {
        return apiError(upsertError.message, 500);
      }
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: user.id,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/settings?checkout=success`,
      cancel_url: `${appUrl}/dashboard/settings?checkout=cancelled`,
      metadata: { userId: user.id },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new Error("Stripe checkout session did not include a URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return apiServerError(error, "Checkout error", "Failed to create checkout session");
  }
}
