"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Search, Edit2, Trash2, Loader2, Download } from "lucide-react";
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Billing</TableHead>
            <TableHead>Next Renewal</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, index) => (
            <TableRow key={`sub-skeleton-${index}`} className="border-border">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-14" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function SubscriptionsPage() {
  const { data: subscriptions, isLoading } = useSubscriptions();
  const deleteSub = useDeleteSubscription();
  const { isPro } = useAuth();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredSubs = subscriptions?.filter(sub => 
    sub.name.toLowerCase().includes(search.toLowerCase()) || 
    sub.category.toLowerCase().includes(search.toLowerCase())
  ) || [];

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
        escapeCsvValue(sub.billingCycle),
        escapeCsvValue((sub.price / 100).toFixed(2)),
        escapeCsvValue(format(new Date(sub.renewalDate), "yyyy-MM-dd")),
        escapeCsvValue(format(new Date(sub.createdAt), "yyyy-MM-dd")),
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Manage and track your active services.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button 
            onClick={handleAddNew}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {/* Search */}
          <div className="p-4 border-b border-border">
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
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Next Renewal</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        {search ? "No subscriptions found matching your search." : "No subscriptions yet. Click 'Add New' to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubs.map((sub) => (
                      <TableRow key={sub.id} className="group border-border">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                              {sub.name.charAt(0).toUpperCase()}
                            </div>
                            {sub.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm capitalize">{sub.category}</TableCell>
                        <TableCell className="text-sm">
                          {formatCurrency(sub.price)}
                          <span className="text-xs text-muted-foreground ml-1">
                            /{sub.billingCycle === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm capitalize">{sub.billingCycle}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(sub.renewalDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
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
                    ))
                  )}
                </TableBody>
              </Table>
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
