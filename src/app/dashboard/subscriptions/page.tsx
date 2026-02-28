"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarClock,
  Download,
  Edit2,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useSubscriptions, useDeleteSubscription } from "@/hooks/use-subscriptions";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { SubscriptionModal } from "@/components/subscription-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Subscription } from "@/lib/db/schema";

function escapeCsvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function SubscriptionsTableSkeleton() {
  return (
    <>
      <div className="space-y-3 p-4 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`sub-mobile-skeleton-${index}`}
            className="rounded-xl border border-border/60 bg-card/60 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-[220px]">Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Next Renewal</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={`sub-skeleton-${index}`} className="border-border/60">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default function SubscriptionsPage() {
  const {
    data: subscriptions,
    isLoading,
    isError,
    error,
    refetch,
  } = useSubscriptions();
  const deleteSub = useDeleteSubscription();
  const { isPro } = useAuth();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredSubs = subscriptions?.filter((sub) =>
    sub.name.toLowerCase().includes(search.toLowerCase()) ||
    sub.category.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const monthlyTotal = useMemo(() => (
    filteredSubs.reduce((total, sub) => {
      const monthlyEquivalent = sub.billing_cycle === "monthly"
        ? sub.price
        : Math.round(sub.price / 12);
      return total + monthlyEquivalent;
    }, 0)
  ), [filteredSubs]);

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingSub(null);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteSub.mutateAsync(deletingId);
      setDeletingId(null);
    }
  };

  const handleExportCsv = () => {
    if (!isPro) {
      toast({
        title: "Pro feature",
        description: "Upgrade to Pro to export CSV reports.",
        variant: "destructive",
      });
      return;
    }

    if (!filteredSubs.length) {
      toast({
        title: "No data to export",
        description: "Add subscriptions first or clear the current search filter.",
      });
      return;
    }

    const headers = [
      "Name",
      "Description",
      "Category",
      "BillingCycle",
      "PriceUSD",
      "RenewalDate",
      "CreatedAt",
    ];

    const rows = filteredSubs.map((sub) =>
      [
        escapeCsvValue(sub.name),
        escapeCsvValue(sub.description ?? ""),
        escapeCsvValue(sub.category),
        escapeCsvValue(sub.billing_cycle),
        escapeCsvValue((sub.price / 100).toFixed(2)),
        escapeCsvValue(format(new Date(sub.renewal_date), "yyyy-MM-dd")),
        escapeCsvValue(format(new Date(sub.created_at), "yyyy-MM-dd")),
      ].join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filenameDate = format(new Date(), "yyyy-MM-dd");

    link.href = url;
    link.download = `subscriptions-${filenameDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `${filteredSubs.length} subscriptions exported.`,
    });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <section className="premium-surface relative overflow-hidden p-5 sm:p-6">
        <div className="absolute inset-0 subtle-grid-bg opacity-20" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Subscription Manager
            </div>
            <h1 className="text-3xl font-display font-bold sm:text-4xl">Subscriptions</h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Organize recurring services, monitor renewals, and keep total monthly spend under control.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              onClick={handleExportCsv}
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Subscription
            </Button>
          </div>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/45 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Visible Subscriptions</p>
            <p className="mt-1 text-2xl font-display font-semibold">{filteredSubs.length}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/45 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly Equivalent</p>
            <p className="mt-1 text-2xl font-display font-semibold">{formatCurrency(monthlyTotal)}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/45 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan Access</p>
            <p className="mt-1 text-2xl font-display font-semibold">{isPro ? "Pro" : "Free"}</p>
          </div>
        </div>
      </section>

      <Card className="premium-surface overflow-hidden border-border/60">
        <CardContent className="p-0">
          <div className="border-b border-border/60 p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Search by service name or category.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-3 py-1 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                {filteredSubs.length} result{filteredSubs.length === 1 ? "" : "s"}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <SubscriptionsTableSkeleton />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <p className="text-sm text-destructive">
                {(error as Error)?.message || "Failed to load subscriptions."}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-background/60">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No subscriptions found</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                {search
                  ? "Try a different keyword or clear the search filter."
                  : "Add your first subscription to start tracking renewals and spend trends."}
              </p>
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {filteredSubs.map((sub) => (
                  <article key={sub.id} className="rounded-xl border border-border/60 bg-card/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                          {sub.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium leading-tight">{sub.name}</p>
                          <p className="mt-1 inline-flex rounded-full border border-border/60 bg-background/45 px-2.5 py-0.5 text-xs text-muted-foreground">
                            {sub.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(sub)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletingId(sub.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-border/50 bg-background/40 p-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Price</p>
                        <p className="mt-1 text-sm font-semibold">{formatCurrency(sub.price)}</p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-background/40 p-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Billing</p>
                        <p className="mt-1 text-sm font-semibold capitalize">{sub.billing_cycle}</p>
                      </div>
                      <div className="col-span-2 rounded-lg border border-border/50 bg-background/40 p-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Next Renewal</p>
                        <p className="mt-1 text-sm font-semibold">{format(new Date(sub.renewal_date), "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="w-[220px]">Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Billing</TableHead>
                      <TableHead>Next Renewal</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubs.map((sub) => (
                      <TableRow key={sub.id} className="group border-border/60">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                              {sub.name.charAt(0).toUpperCase()}
                            </div>
                            {sub.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          <span className="rounded-full border border-border/60 bg-background/45 px-2.5 py-1 text-xs">
                            {sub.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatCurrency(sub.price)}
                          <span className="ml-1 text-xs text-muted-foreground">
                            /{sub.billing_cycle === "monthly" ? "mo" : "yr"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm capitalize">{sub.billing_cycle}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(sub.renewal_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(sub)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeletingId(sub.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {!isPro && (
            <div className="border-t border-border/60 bg-primary/5 px-4 py-3 text-xs text-muted-foreground sm:px-5">
              CSV export is available on the Pro plan.
            </div>
          )}
        </CardContent>
      </Card>

      <SubscriptionModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        subscription={editingSub} 
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="border-border/50 shadow-2xl bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this subscription from your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleteSub.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
