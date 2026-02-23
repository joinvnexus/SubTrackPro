import { useAuth } from "@/hooks/use-auth";
import { useUpgradePlan } from "@/hooks/use-billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap, Shield, Infinity, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const { user } = useAuth();
  const upgradePlan = useUpgradePlan();

  const isPro = user?.plan === 'pro';

  return (
    <div className="max-w-4xl space-y-8 animate-slide-up">
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and billing preferences.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile Card */}
        <Card className="glass-card border-border/40 h-fit">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Your personal account information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <div className="mt-1 font-medium bg-secondary/50 p-3 rounded-lg border border-border">
                {user?.email}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Plan</label>
              <div className="mt-1 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                  isPro ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {user?.plan}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing / Upgrade Card */}
        <motion.div
          whileHover={{ scale: isPro ? 1 : 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className={`relative overflow-hidden border-2 ${
            isPro ? 'border-border/40 bg-card/50' : 'border-primary/50 bg-card/80 shadow-[0_0_30px_rgba(139,92,246,0.1)]'
          }`}>
            {!isPro && (
              <div className="absolute top-0 right-0 p-4">
                <div className="absolute top-[-20%] right-[-20%] w-[150px] h-[150px] bg-primary/20 blur-[50px] rounded-full" />
              </div>
            )}
            
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-2xl font-display">
                {isPro ? 'Pro Plan Active' : 'Upgrade to Pro'}
                <Zap className={`h-5 w-5 ${isPro ? 'text-yellow-500' : 'text-primary'}`} />
              </CardTitle>
              <CardDescription>
                {isPro 
                  ? "You have full access to all premium features." 
                  : "Unlock unlimited subscriptions and advanced analytics."}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-4">
              {!isPro && (
                <div className="text-4xl font-bold font-display mb-6">
                  $9<span className="text-lg text-muted-foreground font-normal">/mo</span>
                </div>
              )}
              
              <ul className="space-y-3">
                {[
                  { icon: Infinity, text: "Unlimited subscriptions (Free limit: 5)" },
                  { icon: Shield, text: "Advanced spend analytics & forecasting" },
                  { icon: CheckCircle2, text: "Priority email support" },
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <feature.icon className="h-5 w-5 text-primary shrink-0" />
                    <span className={isPro ? "text-foreground" : "text-muted-foreground"}>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter className="relative z-10 pt-4">
              {isPro ? (
                <Button variant="outline" className="w-full pointer-events-none opacity-50">
                  Current Plan
                </Button>
              ) : (
                <Button 
                  onClick={() => upgradePlan.mutate()} 
                  disabled={upgradePlan.isPending}
                  className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg shadow-primary/25 text-base h-12"
                >
                  {upgradePlan.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Upgrade Now
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
