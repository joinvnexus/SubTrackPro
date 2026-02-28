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
      className={cn("rounded-xl border border-border/60 bg-card/80 p-3 shadow-lg backdrop-blur-sm", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row sm:gap-5",
        month: "space-y-4",
        caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-sm font-semibold tracking-tight",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-7 w-7 rounded-md border border-border/40 bg-background/70 p-0 text-muted-foreground opacity-100 hover:border-primary/40 hover:text-primary"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "h-9 w-9 rounded-md text-[0.76rem] font-medium uppercase tracking-wide text-muted-foreground/85",
        row: "mt-2 flex w-full",
        cell: "relative h-9 w-9 p-0 text-center text-sm focus-within:z-20 [&:has([aria-selected])]:rounded-lg [&:has([aria-selected])]:bg-primary/12",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 rounded-lg p-0 font-normal text-foreground hover:bg-primary/10 hover:text-primary aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground shadow-[0_10px_26px_-16px_hsl(var(--primary)/0.9)] hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "border border-primary/55 bg-primary/15 font-semibold text-primary",
        day_outside:
          "day-outside text-muted-foreground/60 opacity-60 aria-selected:bg-muted/30 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground/50 opacity-50",
        day_range_middle:
          "aria-selected:bg-primary/15 aria-selected:text-foreground",
        day_hidden: "invisible",
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
