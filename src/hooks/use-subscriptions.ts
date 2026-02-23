"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClientBrowser } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./use-auth";
import type { Subscription, SubscriptionFormData } from "@/lib/db/schema";

export function useSubscriptions() {
  const supabase = createClientBrowser();

  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("isActive", true)
        .order("createdAt", { ascending: false });

      if (error) throw error;
      return data as Subscription[];
    },
  });
}

export function useSubscription(id: string) {
  const supabase = createClientBrowser();

  return useQuery({
    queryKey: ["subscription", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Subscription;
    },
    enabled: !!id,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const supabase = createClientBrowser();
  const { user, isPro } = useAuth();

  return useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      if (!user) throw new Error("Must be logged in");

      // Check subscription limit for free plan
      const { data: existingSubs } = await supabase
        .from("subscriptions")
        .select("id", { count: "exact" })
        .eq("userId", user.id)
        .eq("isActive", true);

      const subCount = existingSubs?.length ?? 0;

      if (!isPro && subCount >= 5) {
        throw new Error("PLAN_LIMIT_REACHED");
      }

      const { error } = await supabase.from("subscriptions").insert({
        userId: user.id,
        name: data.name,
        description: data.description,
        price: Math.round(data.price * 100), // Convert to cents
        billingCycle: data.billingCycle,
        category: data.category,
        renewalDate: data.renewalDate.toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast({
        title: "Success",
        description: "Subscription added successfully.",
      });
    },
    onError: (error: Error) => {
      if (error.message === "PLAN_LIMIT_REACHED") {
        toast({
          title: "Limit Reached",
          description: "You've reached the 5 subscription limit on the Free plan. Upgrade to Pro to add more.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const supabase = createClientBrowser();

  return useMutation({
    mutationFn: async ({ id, ...data }: SubscriptionFormData & { id: string }) => {
      const updates: Record<string, unknown> = {
        name: data.name,
        description: data.description,
        price: Math.round((data.price || 0) * 100),
        billingCycle: data.billingCycle,
        category: data.category,
        renewalDate: data.renewalDate?.toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(updates).forEach((key) => {
        if (updates[key] === undefined) delete updates[key];
      });

      const { error } = await supabase
        .from("subscriptions")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast({
        title: "Success",
        description: "Subscription updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const supabase = createClientBrowser();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - just mark as inactive
      const { error } = await supabase
        .from("subscriptions")
        .update({ isActive: false, updatedAt: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast({
        title: "Success",
        description: "Subscription removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
