"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  CalendarDays,
  CalendarIcon,
  FileText,
  Loader2,
  Repeat,
  Sparkles,
  Tag,
  Wallet,
} from "lucide-react";
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
  billing_cycle: z.enum(["monthly", "yearly"]),
  category: z.string().min(1, "Category is required"),
  renewal_date: z.date({ required_error: "Renewal date is required" }),
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      priceStr: "",
      billing_cycle: "monthly",
      category: "Software",
      renewal_date: undefined,
    },
  });

  useEffect(() => {
    if (subscription && open) {
      form.reset({
        name: subscription.name,
        description: subscription.description || "",
        priceStr: (subscription.price / 100).toString(),
        billing_cycle: subscription.billing_cycle as "monthly" | "yearly",
        category: subscription.category,
        renewal_date: new Date(subscription.renewal_date),
      });
    } else if (!open) {
      setIsCalendarOpen(false);
      form.reset({
        name: "",
        description: "",
        priceStr: "",
        billing_cycle: "monthly",
        category: "Software",
        renewal_date: undefined,
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
        billing_cycle: data.billing_cycle,
        category: data.category,
        renewal_date: data.renewal_date,
      });
    } else {
      await createSub.mutateAsync({
        name: data.name,
        description: data.description,
        price: priceInCents,
        billing_cycle: data.billing_cycle,
        category: data.category,
        renewal_date: data.renewal_date,
      });
    }
    onOpenChange(false);
  };

  const isPending = createSub.isPending || updateSub.isPending;
  const selectedRenewalDate = form.watch("renewal_date");
  const selectedBillingCycle = form.watch("billing_cycle");
  const selectedCategory = form.watch("category");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border/60 bg-background/95 p-0 shadow-[0_32px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:max-w-[640px]">
        <DialogHeader className="relative overflow-hidden border-b border-border/60 bg-gradient-to-r from-primary/15 via-background to-emerald-400/10 px-6 pb-5 pt-6 sm:px-7">
          <div className="absolute inset-0 subtle-grid-bg opacity-20" />
          <div className="relative space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Subscription Details
            </div>
            <DialogTitle className="font-display text-2xl">
              {isEditing ? "Edit Subscription" : "Add Subscription"}
            </DialogTitle>
            <DialogDescription className="max-w-xl text-sm leading-relaxed">
              {isEditing
                ? "Refine pricing, billing cadence, and renewal date so your dashboard stays accurate."
                : "Capture your new recurring expense with category, billing cycle, and renewal tracking in one flow."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-6 py-6 sm:px-7 sm:py-7">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Service Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Netflix, GitHub, Figma"
              {...form.register("name")}
              disabled={isPending}
              className="border-input/80 bg-background/60"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="inline-flex items-center gap-2 text-sm font-medium">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Description (Optional)
            </Label>
            <Input
              id="description"
              placeholder="Team seat, personal plan, yearly workspace, etc."
              {...form.register("description")}
              disabled={isPending}
              className="border-input/80 bg-background/60"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priceStr" className="inline-flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                Price (USD)
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  $
                </span>
                <Input
                  id="priceStr"
                  type="text"
                  placeholder="12.99"
                  {...form.register("priceStr")}
                  disabled={isPending}
                  className="border-input/80 bg-background/60 pl-7"
                />
              </div>
              {form.formState.errors.priceStr && (
                <p className="text-xs text-destructive">{form.formState.errors.priceStr.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="inline-flex items-center gap-2 text-sm font-medium">
                <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                Billing Cycle
              </Label>
              <Select
                value={selectedBillingCycle}
                onValueChange={(val) =>
                  form.setValue("billing_cycle", val as "monthly" | "yearly", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                disabled={isPending}
              >
                <SelectTrigger className="border-input/80 bg-background/60">
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent className="border-border/60 bg-popover/95 backdrop-blur-md">
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="inline-flex items-center gap-2 text-sm font-medium">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              Category
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={(val) =>
                form.setValue("category", val, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={isPending}
            >
              <SelectTrigger className="border-input/80 bg-background/60">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="border-border/60 bg-popover/95 backdrop-blur-md">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="inline-flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              Next Renewal Date
            </Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start border-input/80 bg-background/60 text-left font-normal ${
                    !selectedRenewalDate ? "text-muted-foreground" : ""
                  }`}
                  type="button"
                  disabled={isPending}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedRenewalDate ? format(selectedRenewalDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="z-[80] w-auto border-border/60 bg-popover/95 p-0 shadow-xl backdrop-blur-md" align="start">
                <Calendar
                  mode="single"
                  selected={selectedRenewalDate}
                  onSelect={(date) =>
                    date &&
                    (() => {
                      form.setValue("renewal_date", date, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setIsCalendarOpen(false);
                    })()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.renewal_date && (
              <p className="text-xs text-destructive">{form.formState.errors.renewal_date.message}</p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Subscription"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
