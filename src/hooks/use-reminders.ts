"use client";

import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./use-auth";

type ReminderResponse = {
  success: boolean;
  sent: boolean;
  count?: number;
  message?: string;
  error?: string;
};

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ReminderResponse;
    if (data?.error) return data.error;
  } catch {
    // Ignore JSON parse errors and return fallback.
  }
  return "Request failed";
}

export function useSendRenewalReminder() {
  const { toast } = useToast();
  const { user, isPro } = useAuth();

  return useMutation<ReminderResponse, Error, number>({
    mutationFn: async (days = 7) => {
      if (!user) throw new Error("Must be logged in");
      if (!isPro) throw new Error("Renewal reminders are available on Pro plan");

      const response = await fetch("/api/reminders/renewals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ days }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      return (await response.json()) as ReminderResponse;
    },
    onSuccess: (data) => {
      if (!data.sent) {
        toast({
          title: "No upcoming renewals",
          description: data.message || "No reminder email was sent.",
        });
        return;
      }

      toast({
        title: "Reminder sent",
        description: `Sent reminder email for ${data.count ?? 0} upcoming renewal(s).`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reminder failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
