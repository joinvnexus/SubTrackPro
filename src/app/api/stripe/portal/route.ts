import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit, getRequestClientIp } from "@/lib/rate-limit";
import { apiError, apiServerError } from "@/lib/api-error";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-02-24.acacia",
    })
  : null;

export async function POST(request: Request) {
  try {
    const clientIp = getRequestClientIp(request);
    const rateLimit = consumeRateLimit({
      key: `stripe-portal:${clientIp}`,
      maxRequests: 15,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiError(
        "Too many requests. Please try again shortly.",
        429,
        rateLimit.headers
      );
    }

    if (!stripe) {
      return apiError("Stripe is not configured. Missing STRIPE_SECRET_KEY.", 500);
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
      .select("stripe_customer_id, plan, is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (planError) {
      return apiError(planError.message, 500);
    }

    if (!userPlan?.stripe_customer_id) {
      return apiError("No Stripe customer found for this account", 400);
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userPlan.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    return apiServerError(
      error,
      "Portal error",
      "Failed to create billing portal session"
    );
  }
}
