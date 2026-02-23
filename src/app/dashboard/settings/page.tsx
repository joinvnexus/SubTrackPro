"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpgradePlan } from "@/hooks/use-billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Loader2, Download } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Up to 5 subscriptions",
      "Basic analytics",
      "Monthly cost tracking",
      "Community support",
    ],
    cta: "Current Plan",
    popular: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "month",
    description: "For serious subscribers",
    features: [
      "Unlimited subscriptions",
      "Advanced analytics",
      "CSV export",
      "Renewal reminders",
      "Priority support",
      "Category-based reports",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
];

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const upgradePlan = useUpgradePlan();
  const isPro = user?.plan === "pro";

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and billing.</p>
      </div>

      {/* Profile Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Plan</p>
              <p className="text-sm text-muted-foreground">
                {isPro ? "Pro Plan - $9/month" : "Free Plan"}
              </p>
            </div>
            {!isPro && (
              <Button variant="outline" onClick={() => upgradePlan.mutate()}>
                {upgradePlan.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Crown className="mr-2 h-4 w-4" />
                )}
                Upgrade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          {isPro ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Pro Plan Active</p>
                    <p className="text-sm text-muted-foreground">You have unlimited access to all features</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Manage Billing
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Download className="h-4 w-4" />
                <span>Export your data anytime from the subscriptions page</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upgrade to Pro to unlock unlimited subscriptions and export features.
              </p>
              <Button onClick={() => upgradePlan.mutate()} className="w-full sm:w-auto">
                {upgradePlan.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Crown className="mr-2 h-4 w-4" />
                )}
                Upgrade to Pro - $9/month
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      {!isPro && (
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative border-border/50 ${plan.popular ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.name}
                  {plan.name === "Pro" && <Crown className="h-4 w-4 text-primary" />}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => !isPro && upgradePlan.mutate()}
                  disabled={plan.name === "Free" || isPro}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" disabled>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
