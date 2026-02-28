"use client";

import { useMemo } from "react";
import { addMonths, endOfMonth, format, isWithinInterval, startOfMonth, subMonths } from "date-fns";
import {
  Activity,
  BarChart3,
  CalendarClock,
  Loader2,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { calculateARR, calculateMRR, formatCurrency, getDaysUntilRenewal } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const CHART_COLORS = [
  "hsl(190 95% 48%)",
  "hsl(162 83% 45%)",
  "hsl(215 91% 58%)",
  "hsl(42 96% 56%)",
  "hsl(334 82% 58%)",
  "hsl(262 83% 62%)",
];

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={`analytics-kpi-${idx}`} className="premium-surface">
            <CardHeader className="space-y-2 pb-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-7">
        <Card className="premium-surface xl:col-span-4">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="premium-surface xl:col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: subscriptions, isLoading, isError, error, refetch } = useSubscriptions();

  const metrics = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) {
      return {
        mrr: 0,
        arr: 0,
        averageCost: 0,
        categoryCount: 0,
      };
    }

    const mrr = calculateMRR(subscriptions);
    const categories = new Set(subscriptions.map((sub) => sub.category));

    return {
      mrr,
      arr: calculateARR(mrr),
      averageCost: Math.round(mrr / subscriptions.length),
      categoryCount: categories.size,
    };
  }, [subscriptions]);

  const monthlyTrend = useMemo(() => {
    if (!subscriptions) return [];

    return Array.from({ length: 6 }).map((_, index) => {
      const monthDate = subMonths(new Date(), 5 - index);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const totalCents = subscriptions.reduce((sum, sub) => {
        const renewalDate = new Date(sub.renewal_date);
        if (isWithinInterval(renewalDate, { start, end })) {
          return sum + sub.price;
        }
        return sum;
      }, 0);

      return {
        month: format(monthDate, "MMM"),
        amount: Number((totalCents / 100).toFixed(2)),
      };
    });
  }, [subscriptions]);

  const categoryBreakdown = useMemo(() => {
    if (!subscriptions) return [];

    const categoryTotals = subscriptions.reduce<Record<string, number>>((acc, sub) => {
      const monthlyCost = sub.billing_cycle === "monthly" ? sub.price : Math.round(sub.price / 12);
      acc[sub.category] = (acc[sub.category] || 0) + monthlyCost;
      return acc;
    }, {});

    return Object.entries(categoryTotals)
      .map(([name, cents]) => ({
        name,
        value: Number((cents / 100).toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [subscriptions]);

  const upcomingRenewals = useMemo(() => {
    if (!subscriptions) return [];

    const thirtyDaysFromNow = addMonths(new Date(), 1);

    return subscriptions
      .filter((sub) => {
        const renewalDate = new Date(sub.renewal_date);
        return renewalDate >= new Date() && renewalDate <= thirtyDaysFromNow;
      })
      .sort(
        (a, b) =>
          new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()
      )
      .slice(0, 6);
  }, [subscriptions]);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (isError) {
    return (
      <Card className="premium-surface border-destructive/40">
        <CardHeader>
          <CardTitle>Could not load analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {(error as Error)?.message || "Something went wrong while loading analytics data."}
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
          <h1 className="text-3xl font-display font-bold sm:text-4xl">Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Analyze subscription spend patterns, category distribution, and near-term renewals.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Monthly Recurring Spend",
            value: formatCurrency(metrics.mrr),
            icon: BarChart3,
          },
          {
            label: "Annual Projected Spend",
            value: formatCurrency(metrics.arr),
            icon: TrendingUp,
          },
          {
            label: "Average Monthly Cost",
            value: formatCurrency(metrics.averageCost),
            icon: Activity,
          },
          {
            label: "Tracked Categories",
            value: metrics.categoryCount.toString(),
            icon: PieChartIcon,
          },
        ].map((metric) => (
          <Card key={metric.label} className="premium-surface">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-display font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-7">
        <Card className="premium-surface xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg font-display">Renewal Cost Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrend.some((point) => point.amount > 0) ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(190 95% 48%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(190 95% 48%)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.35 }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Renewal Spend"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(190 95% 48%)"
                      strokeWidth={2.5}
                      fill="url(#trendFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No renewal trend available yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="premium-surface xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-display">Spend By Category (Monthly)</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <div className="space-y-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={88}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {categoryBreakdown.map((item, index) => (
                          <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, "Monthly"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {categoryBreakdown.slice(0, 5).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">${item.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 text-center">
                <PieChartIcon className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Add subscriptions to see category insights.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="premium-surface">
        <CardHeader>
          <CardTitle className="text-lg font-display">Upcoming Renewals (Next 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingRenewals.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {upcomingRenewals.map((sub) => {
                const daysLeft = getDaysUntilRenewal(sub.renewal_date);

                return (
                  <article key={sub.id} className="rounded-xl border border-border/60 bg-background/45 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{sub.name}</h3>
                      <span className="text-xs text-muted-foreground capitalize">{sub.billing_cycle}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{sub.category}</p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-semibold">{formatCurrency(sub.price)}</span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {daysLeft <= 0 ? "Today" : `${daysLeft} day${daysLeft > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 text-center">
              <CalendarClock className="h-7 w-7 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No renewals in the next 30 days.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
