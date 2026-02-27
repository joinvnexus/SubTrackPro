"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClientBrowser } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./use-auth";

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (data?.error) return data.error;
  } catch {
    // Ignore JSON parse errors and fall back below.
  }
  return "Request failed";
}

export function useUpgradePlan() {
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = (await response.json()) as { url?: string };

      if (!data.url) {
        throw new Error("Checkout URL was not returned");
      }

      window.location.assign(data.url);
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

export function useOpenBillingPortal() {
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = (await response.json()) as { url?: string };

      if (!data.url) {
        throw new Error("Billing portal URL was not returned");
      }

      window.location.assign(data.url);
    },
    onError: (error: Error) => {
      toast({
        title: "Billing portal unavailable",
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
        .update({ is_active: false })
        .eq("user_id", user.id);

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
