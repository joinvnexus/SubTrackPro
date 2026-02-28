"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { DayPicker } from "react-day-picker";

export type { DayPickerProps } from "react-day-picker";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("rounded-xl border border-border/60 bg-card/90 p-3 shadow-lg backdrop-blur-sm", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row sm:gap-5",
        month: "space-y-3",
        month_caption: "relative flex h-8 items-center justify-center",
        caption_label: "text-sm font-semibold tracking-tight",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between px-1",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "h-7 w-7 rounded-md border-border/50 bg-background/70 p-0 text-muted-foreground shadow-none hover:border-primary/40 hover:text-primary"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "h-7 w-7 rounded-md border-border/50 bg-background/70 p-0 text-muted-foreground shadow-none hover:border-primary/40 hover:text-primary"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "h-9 w-9 rounded-md text-center text-[0.72rem] font-semibold uppercase tracking-wide text-muted-foreground/85",
        week: "mt-1.5 flex w-full",
        day: "relative p-0 text-center text-sm focus-within:z-20 [&:has([aria-selected])]:rounded-lg [&:has([aria-selected])]:bg-primary/12",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 rounded-lg border-0 p-0 font-normal text-foreground hover:bg-primary/10 hover:text-primary"
        ),
        selected:
          "bg-primary text-primary-foreground shadow-[0_10px_26px_-16px_hsl(var(--primary)/0.9)] [&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary",
        today:
          "bg-primary/12 text-primary [&>button]:border [&>button]:border-primary/55 [&>button]:font-semibold",
        outside:
          "text-muted-foreground/60 opacity-60 aria-selected:bg-muted/30 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground/50 opacity-50",
        hidden: "invisible",
        range_start: "range-start",
        range_middle: "bg-primary/12",
        range_end: "range-end",
        ...classNames,
      }}

      components={{
        Chevron: ({ className, orientation, ...props }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
          ) : (
            <ChevronRight className={cn("h-4 w-4", className)} {...props} />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
