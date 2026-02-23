import { useMemo } from "react";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, TrendingUp, Activity, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import { isAfter, isBefore, addDays } from "date-fns";

export default function Dashboard() {
  const { data: subscriptions, isLoading } = useSubscriptions();

  const metrics = useMemo(() => {
    if (!subscriptions) return { mrr: 0, arr: 0, active: 0, upcoming: 0 };

    let monthlyCents = 0;
    let upcomingCount = 0;
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    subscriptions.forEach(sub => {
      // Calculate MRR
      if (sub.billingCycle === 'monthly') {
        monthlyCents += sub.price;
      } else if (sub.billingCycle === 'yearly') {
        monthlyCents += Math.round(sub.price / 12);
      }

      // Check upcoming renewals (next 30 days)
      const renewal = new Date(sub.renewalDate);
      if (isAfter(renewal, now) && isBefore(renewal, thirtyDaysFromNow)) {
        upcomingCount++;
      }
    });

    return {
      mrr: monthlyCents,
      arr: monthlyCents * 12,
      active: subscriptions.length,
      upcoming: upcomingCount
    };
  }, [subscriptions]);

  const chartData = useMemo(() => {
    if (!subscriptions) return [];
    
    // Group by category for monthly spend
    const categories: Record<string, number> = {};
    subscriptions.forEach(sub => {
      const monthlyPrice = sub.billingCycle === 'monthly' ? sub.price : sub.price / 12;
      categories[sub.category] = (categories[sub.category] || 0) + (monthlyPrice / 100); // Store in dollars for chart
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [subscriptions]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    { title: "Monthly Recurring Revenue", value: formatCurrency(metrics.mrr), icon: DollarSign, trend: "+2.5%" },
    { title: "Annual Projected Run Rate", value: formatCurrency(metrics.arr), icon: TrendingUp, trend: "+2.5%" },
    { title: "Active Subscriptions", value: metrics.active.toString(), icon: Activity, trend: "Total" },
    { title: "Upcoming Renewals (30d)", value: metrics.upcoming.toString(), icon: Calendar, trend: "Requires attention" },
  ];

  const colors = ['#8b5cf6', '#0ea5e9', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Here's an overview of your recurring expenses.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card border-border/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <kpi.icon className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {kpi.trend}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 glass-card border-border/40">
          <CardHeader>
            <CardTitle className="font-display">Monthly Spend by Category</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            {chartData.length > 0 ? (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--secondary))' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
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
              <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl mx-6 mb-6">
                <Activity className="h-10 w-10 mb-2 opacity-50" />
                <p>No data to display. Add some subscriptions!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 glass-card border-border/40">
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
    </div>
  );
}
