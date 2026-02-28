import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  CalendarDays,
  CalendarIcon,
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
import { parseCurrencyToCents } from "@/lib/format";
import type { SubscriptionResponse } from "@shared/routes";

// Form schema uses string for price to allow decimal input, converted to cents on submit
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  priceStr: z.string().min(1, "Price is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  billingCycle: z.enum(["monthly", "yearly"]),
  category: z.string().min(1, "Category is required"),
  renewalDate: z.date({ required_error: "Renewal date is required" }),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: SubscriptionResponse | null;
}

const CATEGORIES = ["Software", "Entertainment", "Utilities", "Cloud Services", "Other"];

export function SubscriptionModal({ open, onOpenChange, subscription }: Props) {
  const createSub = useCreateSubscription();
  const updateSub = useUpdateSubscription();

  const isEditing = !!subscription;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      priceStr: "",
      billingCycle: "monthly",
      category: "Software",
      renewalDate: undefined,
    }
  });

  useEffect(() => {
    if (subscription && open) {
      form.reset({
        name: subscription.name,
        priceStr: (subscription.price / 100).toString(),
        billingCycle: subscription.billingCycle as "monthly" | "yearly",
        category: subscription.category,
        renewalDate: new Date(subscription.renewalDate),
      });
    } else if (!open) {
      setIsCalendarOpen(false);
      form.reset({
        name: "",
        priceStr: "",
        billingCycle: "monthly",
        category: "Software",
        renewalDate: undefined,
      });
    }
  }, [subscription, open, form]);

  const onSubmit = async (data: FormValues) => {
    const apiData = {
      name: data.name,
      price: parseCurrencyToCents(data.priceStr),
      billingCycle: data.billingCycle,
      category: data.category,
      renewalDate: new Date(data.renewalDate), // Convert string to Date
    };

    try {
      if (isEditing && subscription) {
        await updateSub.mutateAsync({ id: subscription.id, ...apiData });
      } else {
        await createSub.mutateAsync(apiData);
      }
      onOpenChange(false);
    } catch (e) {
      // Error is handled by hook toasts
    }
  };

  const isPending = createSub.isPending || updateSub.isPending;
  const selectedRenewalDate = form.watch("renewalDate");
  const selectedBillingCycle = form.watch("billingCycle");
  const selectedCategory = form.watch("category");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border/60 bg-background/95 p-0 shadow-[0_32px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:max-w-[620px]">
        <DialogHeader className="relative overflow-hidden border-b border-border/60 bg-gradient-to-r from-primary/15 via-background to-emerald-400/10 px-6 pb-5 pt-6">
          <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.25)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.25)_1px,transparent_1px)] bg-[size:34px_34px] opacity-25" />
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
                ? "Fine-tune your pricing, renewal date, and category to keep insights accurate."
                : "Capture your recurring expense with category, billing cycle, and renewal tracking in one flow."}
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
              placeholder="e.g. Netflix, GitHub Copilot"
              {...form.register("name")}
              disabled={isPending}
              className="border-input/80 bg-background/60"
            />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price" className="inline-flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                Price (USD)
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  $
                </span>
                <Input
                  id="price"
                  placeholder="10.99"
                  {...form.register("priceStr")}
                  disabled={isPending}
                  className="border-input/80 bg-background/60 pl-7"
                />
              </div>
              {form.formState.errors.priceStr && <p className="text-xs text-destructive">{form.formState.errors.priceStr.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cycle" className="inline-flex items-center gap-2 text-sm font-medium">
                <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                Billing Cycle
              </Label>
              <Select 
                value={selectedBillingCycle}
                onValueChange={(val) =>
                  form.setValue("billingCycle", val as "monthly" | "yearly", {
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
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex flex-col">
            <Label className="inline-flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              Next Renewal Date
            </Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start border-input/80 bg-background/60 text-left font-normal ${!selectedRenewalDate ? "text-muted-foreground" : ""}`}
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
                      form.setValue("renewalDate", date, {
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
            {form.formState.errors.renewalDate && <p className="text-xs text-destructive">{form.formState.errors.renewalDate.message}</p>}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Subscription"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
