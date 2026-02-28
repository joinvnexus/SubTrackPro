"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import {
  Bell,
  BellRing,
  CalendarClock,
  Loader2,
  Mail,
  Save,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSendRenewalReminder } from "@/hooks/use-reminders";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

type ReminderSettings = {
  emailReminders: boolean;
  pushOnRenewalDay: boolean;
  priceIncreaseAlerts: boolean;
  weeklyDigest: boolean;
};

const DEFAULT_SETTINGS: ReminderSettings = {
  emailReminders: true,
  pushOnRenewalDay: true,
  priceIncreaseAlerts: true,
  weeklyDigest: false,
};

function ReminderSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card className="premium-surface">
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`setting-skeleton-${idx}`} className="rounded-xl border border-border/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-52" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RemindersPage() {
  const { user, isPro } = useAuth();
  const { toast } = useToast();
  const sendRenewalReminder = useSendRenewalReminder();
  const { data: subscriptions, isLoading, isError, error, refetch } = useSubscriptions();
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    try {
      const raw = window.localStorage.getItem(`subtrack-reminder-settings:${user.id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as ReminderSettings;
        setSettings({
          emailReminders: parsed.emailReminders ?? DEFAULT_SETTINGS.emailReminders,
          pushOnRenewalDay: parsed.pushOnRenewalDay ?? DEFAULT_SETTINGS.pushOnRenewalDay,
          priceIncreaseAlerts: parsed.priceIncreaseAlerts ?? DEFAULT_SETTINGS.priceIncreaseAlerts,
          weeklyDigest: parsed.weeklyDigest ?? DEFAULT_SETTINGS.weeklyDigest,
        });
      }
    } catch {
      // Ignore malformed local storage state and fall back to defaults.
    } finally {
      setIsLoaded(true);
    }
  }, [user?.id]);

  const saveSettings = () => {
    if (!user?.id) return;

    window.localStorage.setItem(
      `subtrack-reminder-settings:${user.id}`,
      JSON.stringify(settings)
    );

    toast({
      title: "Reminder settings saved",
      description: "Your notification preferences have been updated.",
    });
  };

  const upcomingRenewals = useMemo(() => {
    if (!subscriptions) return [];

    const now = new Date();
    const next14Days = addDays(now, 14);

    return subscriptions
      .filter((sub) => {
        const renewalDate = new Date(sub.renewal_date);
        return renewalDate >= now && renewalDate <= next14Days;
      })
      .sort(
        (a, b) =>
          new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()
      )
      .slice(0, 6);
  }, [subscriptions]);

  if (!isLoaded || isLoading) {
    return <ReminderSettingsSkeleton />;
  }

  if (isError) {
    return (
      <Card className="premium-surface border-destructive/40">
        <CardHeader>
          <CardTitle>Could not load reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {(error as Error)?.message || "Something went wrong while loading reminders data."}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <section className="premium-surface relative overflow-hidden p-5 sm:p-6">
        <div className="absolute inset-0 subtle-grid-bg opacity-20" />
        <div className="relative">
          <h1 className="text-3xl font-display font-bold sm:text-4xl">Reminders</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Control how and when you receive renewal notifications and cost change alerts.
          </p>
        </div>
      </section>

      <Card className="premium-surface">
        <CardHeader>
          <CardTitle className="text-lg font-display">Notification Settings</CardTitle>
          <CardDescription>
            Customize the exact reminder flow for your subscription renewals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              id: "emailReminders",
              title: "Email reminders",
              description: "3 days before renewal",
              icon: Mail,
            },
            {
              id: "pushOnRenewalDay",
              title: "Push notifications",
              description: "On renewal day",
              icon: BellRing,
            },
            {
              id: "priceIncreaseAlerts",
              title: "Price increase alerts",
              description: "When price changes",
              icon: TrendingUp,
            },
            {
              id: "weeklyDigest",
              title: "Weekly digest",
              description: "Summary every Monday",
              icon: CalendarClock,
            },
          ].map((item) => {
            const isChecked = settings[item.id as keyof ReminderSettings];

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border/60 bg-background/45 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 font-medium">
                      <item.icon className="h-4 w-4 text-primary" />
                      {item.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        [item.id]: checked,
                      }))
                    }
                    aria-label={item.title}
                  />
                </div>
              </div>
            );
          })}

          <div className="flex flex-col gap-2 pt-3 sm:flex-row">
            <Button onClick={saveSettings} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Save Notification Settings
            </Button>
            <Button
              variant="outline"
              onClick={() => sendRenewalReminder.mutate(3)}
              disabled={!isPro || sendRenewalReminder.isPending}
              className="w-full sm:w-auto"
            >
              {sendRenewalReminder.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bell className="mr-2 h-4 w-4" />
              )}
              Send Test Email Reminder
            </Button>
          </div>

          {!isPro && (
            <p className="text-xs text-muted-foreground">
              Email reminder sending is available on Pro plan.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="premium-surface">
        <CardHeader>
          <CardTitle className="text-lg font-display">Upcoming Renewals (14 Days)</CardTitle>
          <CardDescription>
            Subscriptions that will be included in your reminder queue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingRenewals.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {upcomingRenewals.map((sub) => (
                <article
                  key={sub.id}
                  className="rounded-xl border border-border/60 bg-background/45 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{sub.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">{sub.billing_cycle}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{sub.category}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-medium">{formatCurrency(sub.price)}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(sub.renewal_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 text-center">
              <CalendarClock className="h-7 w-7 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No renewals scheduled in the next 14 days.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
