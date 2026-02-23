import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // In production, you would create a Stripe checkout session here
    // For demo purposes, we'll simulate upgrading the user
    
    // Check if user already has a pro plan
    const { data: existingPlan } = await supabase
      .from("user_plans")
      .select("*")
      .eq("userId", user.id)
      .eq("plan", "pro")
      .eq("isActive", true)
      .single();

    if (existingPlan) {
      return NextResponse.json(
        { error: "Already on Pro plan" },
        { status: 400 }
      );
    }

    // Update user to pro plan (simulating successful payment)
    const { error: updateError } = await supabase
      .from("user_plans")
      .upsert({
        userId: user.id,
        plan: "pro",
        isActive: true,
        stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Successfully upgraded to Pro plan"
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
