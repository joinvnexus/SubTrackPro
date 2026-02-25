import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginRequest } from "@shared/schema";
import { Hexagon, Loader2, BarChart3, CreditCard, BellRing } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthPage() {
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginRequest) => {
    if (isLoginView) {
      login(data);
    } else {
      register(data);
    }
  };

  const isPending = isLoggingIn || isRegistering;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand / Hero Section */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-card border-r border-border relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />

        <div className="relative z-10 flex items-center gap-3 text-primary font-display font-bold text-3xl">
          <Hexagon className="h-8 w-8 fill-primary/20 text-primary" />
          <span>SubTrack<span className="text-foreground">Pro</span></span>
        </div>

        <div className="relative z-10 space-y-8 max-w-md">
          <h1 className="text-4xl lg:text-5xl font-display font-bold leading-tight">
            Take control of your <br/>
            <span className="text-gradient">recurring expenses.</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Track, manage, and optimize all your software subscriptions in one beautiful dashboard. Never pay for an unused service again.
          </p>

          <div className="space-y-6 pt-8">
            {[
              { icon: BarChart3, title: "Deep Analytics", desc: "Understand your MRR and ARR at a glance." },
              { icon: BellRing, title: "Renewal Alerts", desc: "Get notified before you get charged." },
              { icon: CreditCard, title: "Spend Optimization", desc: "Identify unused services and cut costs." }
            ].map((feature, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                key={i} 
                className="flex items-center gap-4"
              >
                <div className="h-12 w-12 rounded-xl bg-secondary/50 border border-border flex items-center justify-center text-primary shadow-inner">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground">
          © {new Date().getFullYear()} SubTrack Pro. All rights reserved.
        </div>
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
           
        >
          {/* Mobile Header */}
          <div className="flex lg:hidden items-center justify-center gap-2 text-primary font-display font-bold text-2xl mb-8">
            <Hexagon className="h-8 w-8 fill-primary/20 text-primary" />
            <span>SubTrack<span className="text-foreground">Pro</span></span>
          </div>

          <Card className="glass-card border-border/50">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-display">
                {isLoginView ? "Welcome back" : "Create an account"}
              </CardTitle>
              <CardDescription>
                {isLoginView 
                  ? "Enter your credentials to access your dashboard" 
                  : "Sign up to start tracking your subscriptions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className="bg-background/50 h-11"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    className="bg-background/50 h-11"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5" 
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isLoginView ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">
                  {isLoginView ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLoginView(!isLoginView)}
                  className="font-medium text-primary hover:underline transition-all"
                >
                  {isLoginView ? "Sign up" : "Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
