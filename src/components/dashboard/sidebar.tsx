"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Bell,
  BarChart3, 
  ChevronLeft,
  ChevronRight,
  CreditCard, 
  LineChart,
  Settings, 
  LogOut,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
  { name: "Analytics", href: "/dashboard/analytics", icon: LineChart },
  { name: "Reminders", href: "/dashboard/reminders", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export function Sidebar({
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut, isLoading } = useAuth();

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
          aria-label="Close sidebar backdrop"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-[17.5rem] flex-col border-r border-border/60 bg-card/90 shadow-2xl backdrop-blur-xl transition-all duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:static md:z-20 md:translate-x-0 md:shadow-none",
          isCollapsed ? "md:w-[5.25rem]" : "md:w-64"
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-border/60", isCollapsed ? "px-3" : "px-5")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className={cn("truncate text-lg font-display font-bold", isCollapsed && "md:hidden")}>
              SubTrack Pro
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 md:inline-flex"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors",
                  isCollapsed ? "gap-0 px-2.5 py-2.5 md:justify-center" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className={cn("truncate", isCollapsed && "md:hidden")}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={cn("border-t border-border/60", isCollapsed ? "p-3" : "p-4")}>
          <div className={cn("mb-3", isCollapsed && "md:hidden")}>
            <p className="truncate text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Free Plan</p>
          </div>
          <div className={cn("hidden items-center justify-center rounded-lg border border-border/60 bg-background/40 p-2 md:flex", !isCollapsed && "md:hidden")}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Free</p>
          </div>

          <Button
            variant="ghost"
            className={cn(
              "mt-2 w-full text-muted-foreground hover:text-foreground",
              isCollapsed ? "justify-center px-0 md:h-9" : "justify-start"
            )}
            onClick={() => signOut()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className={cn("h-4 w-4 animate-spin", !isCollapsed && "mr-2")} />
            ) : (
              <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            )}
            <span className={cn(isCollapsed && "md:hidden")}>Sign Out</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
