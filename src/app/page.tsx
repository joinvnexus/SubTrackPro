import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  CreditCard, 
  TrendingUp, 
  Bell, 
  Shield,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">SubTrack Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
            Track Your Subscriptions
            <span className="text-gradient block">Without The Headache</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            SubTrack Pro helps you manage all your digital subscriptions in one place. 
            Get renewal reminders, analytics, and control over your spending.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Everything You Need to Manage Subscriptions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                description: "View monthly and yearly cost analytics with beautiful charts."
              },
              {
                icon: Bell,
                title: "Renewal Reminders",
                description: "Get notified before your subscriptions renew so you're never surprised."
              },
              {
                icon: TrendingUp,
                title: "Spending Trends",
                description: "Track your spending over time and identify opportunities to save."
              },
              {
                icon: CreditCard,
                title: "Easy Management",
                description: "Add, edit, and delete subscriptions with a few clicks."
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your data is encrypted and protected with Row Level Security."
              },
              {
                icon: CheckCircle2,
                title: "Export Reports",
                description: "Export your subscription data to CSV for your records."
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className="p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors"
              >
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Start free, upgrade when you need more features
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-xl border border-border/50 bg-card/50">
              <h3 className="text-2xl font-display font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-6">
                $0<span className="text-lg text-muted-foreground font-normal">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Up to 5 subscriptions",
                  "Basic analytics",
                  "Renewal reminders",
                  "Category tracking"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block">
                <Button className="w-full" variant="outline">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-xl border-2 border-primary bg-card/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
              <h3 className="text-2xl font-display font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-6">
                $9<span className="text-lg text-muted-foreground font-normal">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited subscriptions",
                  "Advanced analytics",
                  "CSV export",
                  "Priority support",
                  "Custom categories"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=pro" className="block">
                <Button className="w-full">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            Ready to Take Control?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of users who have already streamlined their subscription management.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SubTrack Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
