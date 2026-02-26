"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClientBrowser } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./use-auth";
import type { Subscription, SubscriptionFormData } from "@/lib/db/schema";

type SubscriptionsContext = {
  previousSubscriptions: Subscription[];
};

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
        price: Math.round(data.price),
        billingCycle: data.billingCycle,
        category: data.category,
        renewalDate: data.renewalDate.toISOString(),
      });

      if (error) throw error;
    },
    onMutate: async (data): Promise<SubscriptionsContext> => {
      await queryClient.cancelQueries({ queryKey: ["subscriptions"] });
      const previousSubscriptions =
        queryClient.getQueryData<Subscription[]>(["subscriptions"]) || [];

      if (!user) {
        return { previousSubscriptions };
      }

      const now = new Date();
      const optimisticSubscription = {
        id: `temp-${Date.now()}`,
        userId: user.id,
        name: data.name,
        description: data.description ?? null,
        price: Math.round(data.price),
        billingCycle: data.billingCycle,
        category: data.category,
        renewalDate: data.renewalDate,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      } as unknown as Subscription;

      queryClient.setQueryData<Subscription[]>(["subscriptions"], (old = []) => [
        optimisticSubscription,
        ...old,
      ]);

      return { previousSubscriptions };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription added successfully.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousSubscriptions) {
        queryClient.setQueryData(["subscriptions"], context.previousSubscriptions);
      }
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
        price: Math.round(data.price || 0),
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
    onMutate: async ({ id, ...data }): Promise<SubscriptionsContext> => {
      await queryClient.cancelQueries({ queryKey: ["subscriptions"] });
      const previousSubscriptions =
        queryClient.getQueryData<Subscription[]>(["subscriptions"]) || [];

      queryClient.setQueryData<Subscription[]>(["subscriptions"], (old = []) =>
        old.map((sub) =>
          sub.id === id
            ? ({
                ...sub,
                name: data.name,
                description: data.description ?? null,
                price: Math.round(data.price || 0),
                billingCycle: data.billingCycle,
                category: data.category,
                renewalDate: data.renewalDate || sub.renewalDate,
                updatedAt: new Date(),
              } as Subscription)
            : sub
        )
      );

      return { previousSubscriptions };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription updated successfully.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousSubscriptions) {
        queryClient.setQueryData(["subscriptions"], context.previousSubscriptions);
      }
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
    onMutate: async (id: string): Promise<SubscriptionsContext> => {
      await queryClient.cancelQueries({ queryKey: ["subscriptions"] });
      const previousSubscriptions =
        queryClient.getQueryData<Subscription[]>(["subscriptions"]) || [];

      queryClient.setQueryData<Subscription[]>(
        ["subscriptions"],
        (old = []) => old.filter((sub) => sub.id !== id)
      );

      return { previousSubscriptions };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription removed.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousSubscriptions) {
        queryClient.setQueryData(["subscriptions"], context.previousSubscriptions);
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
