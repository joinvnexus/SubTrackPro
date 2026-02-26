"use client";

import { useMemo } from "react";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, calculateMRR, calculateARR, getDaysUntilRenewal } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Calendar, TrendingUp, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { isAfter, isBefore, addDays } from "date-fns";

export default function DashboardPage() {
  const { data: subscriptions, isLoading } = useSubscriptions();
  const { isPro } = useAuth();

  const metrics = useMemo(() => {
    if (!subscriptions) return { mrr: 0, arr: 0, active: 0, upcoming: 0 };

    const monthlyCents = calculateMRR(subscriptions);
    let upcomingCount = 0;
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    subscriptions.forEach(sub => {
      const renewal = new Date(sub.renewalDate);
      if (isAfter(renewal, now) && isBefore(renewal, thirtyDaysFromNow)) {
        upcomingCount++;
      }
    });

    return {
      mrr: monthlyCents,
      arr: calculateARR(monthlyCents),
      active: subscriptions.length,
      upcoming: upcomingCount
    };
  }, [subscriptions]);

  const chartData = useMemo(() => {
    if (!subscriptions) return [];
    
    const categories: Record<string, number> = {};
    subscriptions.forEach(sub => {
      const monthlyPrice = sub.billingCycle === 'monthly' ? sub.price : sub.price / 12;
      categories[sub.category] = (categories[sub.category] || 0) + (monthlyPrice / 100);
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [subscriptions]);

  const colors = [
    "hsl(262.1, 83.3%, 57.8%)",
    "hsl(199, 89%, 48%)",
    "hsl(316, 73%, 52%)",
    "hsl(43, 96%, 56%)",
    "hsl(142.1, 76.2%, 36.3%)",
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={`kpi-skeleton-${i}`} className="border-border/50">
              <CardHeader className="space-y-2 pb-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 border-border/50">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3 border-border/50">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`recent-skeleton-${i}`} className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-4 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const kpis = [
    { title: "Monthly Recurring Revenue", value: formatCurrency(metrics.mrr), icon: DollarSign },
    { title: "Annual Projected Run Rate", value: formatCurrency(metrics.arr), icon: TrendingUp },
    { title: "Active Subscriptions", value: metrics.active.toString(), icon: Activity },
    { title: "Upcoming Renewals", value: metrics.upcoming.toString(), icon: Calendar },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Track and analyze your subscriptions.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 3.7%, 15.9%)" />
                    <XAxis dataKey="name" stroke="hsl(240, 5%, 64.9%)" fontSize={12} />
                    <YAxis stroke="hsl(240, 5%, 64.9%)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(240, 10%, 3.9%)', 
                        border: '1px solid hsl(240, 3.7%, 15.9%)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                <Activity className="h-10 w-10 mb-2 opacity-50" />
                <p>No data to display. Add some subscriptions!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Recent Additions</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions && subscriptions.length > 0 ? (
              <div className="space-y-6">
                {subscriptions.slice(-5).reverse().map(sub => (
                  <div key={sub.id} className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border font-bold text-primary">
                      {sub.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{sub.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{sub.category}</p>
                    </div>
                    <div className="ml-auto font-medium text-sm">
                      {formatCurrency(sub.price)}
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        /{sub.billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                No subscriptions found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Free plan banner */}
      {!isPro && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-semibold">Upgrade to Pro</h3>
              <p className="text-sm text-muted-foreground">Unlock unlimited subscriptions and export features.</p>
            </div>
            <a href="/dashboard/settings">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                Upgrade Now - $9/mo
              </button>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
