import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function parseCurrencyToCents(amount: string | number): number {
  if (typeof amount === "number") return amount;
  const parsed = parseFloat(amount.replace(/[^0-9.-]+/g, ""));
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function calculateMRR(subscriptions: { price: number; billing_cycle: string }[]): number {
  return subscriptions.reduce((total, sub) => {
    if (sub.billing_cycle === "monthly") {
      return total + sub.price;
    } else if (sub.billing_cycle === "yearly") {
      return total + Math.round(sub.price / 12);
    }
    return total;
  }, 0);
}

export function calculateARR(mrr: number): number {
  return mrr * 12;
}

export function getDaysUntilRenewal(renewalDate: Date | string): number {
  const renewal = typeof renewalDate === "string" ? new Date(renewalDate) : renewalDate;
  const now = new Date();
  const diffTime = renewal.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
