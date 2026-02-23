"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateSubscription, useUpdateSubscription } from "@/hooks/use-subscriptions";
import { parseCurrencyToCents } from "@/lib/utils";
import type { Subscription } from "@/lib/db/schema";

const CATEGORIES = [
  "Software",
  "Entertainment",
  "Utilities",
  "Cloud Services",
  "Productivity",
  "Gaming",
  "Other",
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  priceStr: z.string().min(1, "Price is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  billingCycle: z.enum(["monthly", "yearly"]),
  category: z.string().min(1, "Category is required"),
  renewalDate: z.date({ required_error: "Renewal date is required" }),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription | null;
}

export function SubscriptionModal({ open, onOpenChange, subscription }: Props) {
  const createSub = useCreateSubscription();
  const updateSub = useUpdateSubscription();
  const isEditing = !!subscription;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      priceStr: "",
      billingCycle: "monthly",
      category: "Software",
    },
  });

  useEffect(() => {
    if (subscription && open) {
      form.reset({
        name: subscription.name,
        description: subscription.description || "",
        priceStr: (subscription.price / 100).toString(),
        billingCycle: subscription.billingCycle as "monthly" | "yearly",
        category: subscription.category,
        renewalDate: new Date(subscription.renewalDate),
      });
    } else if (!open) {
      form.reset({
        name: "",
        description: "",
        priceStr: "",
        billingCycle: "monthly",
        category: "Software",
      });
    }
  }, [subscription, open, form]);

  const onSubmit = async (data: FormValues) => {
    const priceInCents = parseCurrencyToCents(data.priceStr);

    if (isEditing && subscription) {
      await updateSub.mutateAsync({
        id: subscription.id,
        name: data.name,
        description: data.description,
        price: priceInCents,
        billingCycle: data.billingCycle,
        category: data.category,
        renewalDate: data.renewalDate,
      });
    } else {
      await createSub.mutateAsync({
        name: data.name,
        description: data.description,
        price: priceInCents,
        billingCycle: data.billingCycle,
        category: data.category,
        renewalDate: data.renewalDate,
      });
    }
    onOpenChange(false);
  };

  const isPending = createSub.isPending || updateSub.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Subscription" : "Add Subscription"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your subscription details." : "Add a new subscription to track."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Netflix, Spotify"
              {...form.register("name")}
              disabled={isPending}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Brief description"
              {...form.register("description")}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceStr">Price</Label>
              <Input
                id="priceStr"
                type="text"
                placeholder="9.99"
                {...form.register("priceStr")}
                disabled={isPending}
              />
              {form.formState.errors.priceStr && (
                <p className="text-xs text-destructive">{form.formState.errors.priceStr.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <Select
                onValueChange={(val) => form.setValue("billingCycle", val as "monthly" | "yearly")}
                defaultValue={form.getValues("billingCycle")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              onValueChange={(val) => form.setValue("category", val)}
              defaultValue={form.getValues("category")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Next Renewal Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${!form.watch("renewalDate") && "text-muted-foreground"}`}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("renewalDate") ? format(form.watch("renewalDate"), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("renewalDate")}
                  onSelect={(date) => date && form.setValue("renewalDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.renewalDate && (
              <p className="text-xs text-destructive">{form.formState.errors.renewalDate.message}</p>
            )}
          </div>

          <div className="flex justify-end pt-4 gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Subscription"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
