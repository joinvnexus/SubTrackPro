"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClientBrowser } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./use-auth";

export function useUpgradePlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const supabase = createClientBrowser();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      // In a real app, this would create a Stripe checkout session
      // For now, we'll just update the user plan directly
      const { error } = await supabase.from("user_plans").upsert({
        userId: user.id,
        plan: "pro",
        isActive: true,
        stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-plan"] });
      toast({
        title: "Upgraded to Pro! 🎉",
        description: "Thank you for subscribing. You now have unlimited access.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upgrade failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCancelPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const supabase = createClientBrowser();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("user_plans")
        .update({ isActive: false })
        .eq("userId", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-plan"] });
      toast({
        title: "Plan cancelled",
        description: "Your subscription has been cancelled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
