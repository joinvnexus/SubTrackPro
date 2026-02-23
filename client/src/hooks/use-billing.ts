import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type UserResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useUpgradePlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.billing.upgrade.path, {
        method: api.billing.upgrade.method,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to upgrade plan");
      }
      return await res.json() as UserResponse;
    },
    onSuccess: (data) => {
      // Update the user context with new plan
      queryClient.setQueryData([api.auth.me.path], data);
      toast({ 
        title: "Upgraded to Pro! 🎉", 
        description: "Thank you for subscribing. You now have unlimited access." 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Upgrade failed", description: error.message, variant: "destructive" });
    }
  });
}
