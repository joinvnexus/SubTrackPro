import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit, getRequestClientIp } from "@/lib/rate-limit";

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
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: rateLimit.headers }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Missing STRIPE_SECRET_KEY." },
        { status: 500 }
      );
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userPlan, error: planError } = await supabase
      .from("user_plans")
      .select("stripeCustomerId, plan, isActive")
      .eq("userId", user.id)
      .maybeSingle();

    if (planError) {
      return NextResponse.json({ error: planError.message }, { status: 500 });
    }

    if (!userPlan?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found for this account" },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userPlan.stripeCustomerId,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
