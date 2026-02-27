import { NextResponse } from "next/server";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { consumeRateLimit, getRequestClientIp } from "@/lib/rate-limit";
import { apiError, apiServerError } from "@/lib/api-error";

export const runtime = "nodejs";

const DEFAULT_REMINDER_DAYS = 7;
const MAX_REMINDER_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type RenewalSubscription = {
  name: string;
  category: string;
  billing_cycle: string;
  price: number;
  renewal_date: string;
};

function toReminderWindow(input: unknown): number {
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return DEFAULT_REMINDER_DAYS;
  const integer = Math.trunc(parsed);
  if (integer < 1) return 1;
  if (integer > MAX_REMINDER_DAYS) return MAX_REMINDER_DAYS;
  return integer;
}

function getUpcomingRenewals(subscriptions: RenewalSubscription[], days: number): RenewalSubscription[] {
  const now = Date.now();
  const end = now + days * DAY_MS;

  return subscriptions
    .filter((sub) => {
      const renewalTs = new Date(sub.renewal_date).getTime();
      return Number.isFinite(renewalTs) && renewalTs >= now && renewalTs <= end;
    })
    .sort(
      (a, b) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()
    );
}

function buildReminderEmail(subscriptions: RenewalSubscription[], days: number, appUrl: string) {
  const subject = `Upcoming renewals: ${subscriptions.length} in the next ${days} day${days > 1 ? "s" : ""}`;
  const listItems = subscriptions
    .map((sub) => {
      const renewalDate = format(new Date(sub.renewal_date), "MMM dd, yyyy");
      return `<li><strong>${sub.name}</strong> (${sub.category}) - ${formatCurrency(sub.price)}/${sub.billing_cycle === "monthly" ? "mo" : "yr"} on ${renewalDate}</li>`;
    })
    .join("");

  const textLines = subscriptions.map((sub) => {
    const renewalDate = format(new Date(sub.renewal_date), "MMM dd, yyyy");
    return `- ${sub.name} (${sub.category}) - ${formatCurrency(sub.price)}/${sub.billing_cycle === "monthly" ? "mo" : "yr"} on ${renewalDate}`;
  });

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2>Upcoming Subscription Renewals</h2>
      <p>You have <strong>${subscriptions.length}</strong> renewal${subscriptions.length > 1 ? "s" : ""} coming in the next ${days} day${days > 1 ? "s" : ""}.</p>
      <ul>${listItems}</ul>
      <p>Open your dashboard: <a href="${appUrl}/dashboard">${appUrl}/dashboard</a></p>
    </div>
  `;

  const text = `Upcoming Subscription Renewals\n\nYou have ${subscriptions.length} renewal${subscriptions.length > 1 ? "s" : ""} in the next ${days} day${days > 1 ? "s" : ""}.\n\n${textLines.join(
    "\n"
  )}\n\nOpen your dashboard: ${appUrl}/dashboard`;

  return { subject, html, text };
}

async function sendReminderEmail(to: string, subject: string, html: string, text: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.REMINDER_FROM_EMAIL || "SubTrack Pro <onboarding@resend.dev>";

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Email provider request failed: ${details}`);
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getRequestClientIp(request);
    const ipRateLimit = consumeRateLimit({
      key: `renewal-reminder-ip:${clientIp}`,
      maxRequests: 20,
      windowMs: 60_000,
    });

    if (!ipRateLimit.allowed) {
      return apiError(
        "Too many requests. Please try again shortly.",
        429,
        ipRateLimit.headers
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    if (!user.email) {
      return apiError("No email is associated with this account", 400);
    }

    const userRateLimit = consumeRateLimit({
      key: `renewal-reminder-user:${user.id}`,
      maxRequests: 3,
      windowMs: 10 * 60_000,
    });

    if (!userRateLimit.allowed) {
      return apiError(
        "Reminder limit reached. Please wait before sending another reminder.",
        429,
        userRateLimit.headers
      );
    }

    const body = (await request.json().catch(() => ({}))) as { days?: number };
    const days = toReminderWindow(body.days);

    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("name, category, billing_cycle, price, renewal_date")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (error) {
      return apiError(error.message, 500);
    }

    const upcoming = getUpcomingRenewals(
      (subscriptions || []) as RenewalSubscription[],
      days
    );

    if (!upcoming.length) {
      return NextResponse.json({
        success: true,
        sent: false,
        message: `No renewals in the next ${days} day${days > 1 ? "s" : ""}.`,
      });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    const email = buildReminderEmail(upcoming, days, appUrl);
    await sendReminderEmail(user.email, email.subject, email.html, email.text);

    return NextResponse.json({
      success: true,
      sent: true,
      count: upcoming.length,
    });
  } catch (error) {
    return apiServerError(
      error,
      "Renewal reminder error",
      "Failed to send renewal reminder email"
    );
  }
}
