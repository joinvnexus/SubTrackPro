import { useState } from "react";
import { format } from "date-fns";
import { Plus, Search, Edit2, Trash2, Loader2 } from "lucide-react";
import { useSubscriptions, useDeleteSubscription } from "@/hooks/use-subscriptions";
import { formatCurrency } from "@/lib/format";
import { SubscriptionModal } from "@/components/subscription-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { SubscriptionResponse } from "@shared/routes";

export default function Subscriptions() {
  const { data: subscriptions, isLoading } = useSubscriptions();
  const deleteSub = useDeleteSubscription();
  
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredSubs = subscriptions?.filter(sub => 
    sub.name.toLowerCase().includes(search.toLowerCase()) || 
    sub.category.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleEdit = (sub: SubscriptionResponse) => {
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

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Manage and track your active services.</p>
        </div>
        <Button 
          onClick={handleAddNew}
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>

      <Card className="glass-card border-border/40">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-2"
            />
          </div>

          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No subscriptions found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your search or add a new one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="w-[250px]">Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Next Renewal</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubs.map((sub) => (
                    <TableRow key={sub.id} className="border-border/50 hover:bg-secondary/40 transition-colors group">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {sub.name.substring(0, 2).toUpperCase()}
                          </div>
                          {sub.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2.5 py-1 rounded-full bg-secondary text-xs font-medium">
                          {sub.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {formatCurrency(sub.price)}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground text-sm">
                        {sub.billingCycle}
                      </TableCell>
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
                  ))}
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
