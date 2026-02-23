import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type SubscriptionResponse, type SubscriptionInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useSubscriptions() {
  return useQuery({
    queryKey: [api.subscriptions.list.path],
    queryFn: async () => {
      const res = await fetch(api.subscriptions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      return await res.json() as SubscriptionResponse[];
    },
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SubscriptionInput) => {
      const res = await fetch(api.subscriptions.create.path, {
        method: api.subscriptions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        // Specifically handle 403 (Free tier limit reached)
        if (res.status === 403) {
          throw new Error("PLAN_LIMIT_REACHED");
        }
        throw new Error(errorData.message || "Failed to create subscription");
      }
      return await res.json() as SubscriptionResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.subscriptions.list.path] });
      toast({ title: "Success", description: "Subscription added." });
    },
    onError: (error: Error) => {
      if (error.message === "PLAN_LIMIT_REACHED") {
        toast({ 
          title: "Limit Reached", 
          description: "You've reached the 5 subscription limit on the Free plan. Upgrade to Pro to add more.",
          variant: "destructive"
        });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SubscriptionInput> & { id: string }) => {
      const url = buildUrl(api.subscriptions.update.path, { id });
      const res = await fetch(url, {
        method: api.subscriptions.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update subscription");
      return await res.json() as SubscriptionResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.subscriptions.list.path] });
      toast({ title: "Success", description: "Subscription updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.subscriptions.delete.path, { id });
      const res = await fetch(url, {
        method: api.subscriptions.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete subscription");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.subscriptions.list.path] });
      toast({ title: "Success", description: "Subscription removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}
