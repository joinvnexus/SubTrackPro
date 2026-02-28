import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-primary/40 bg-primary text-primary-foreground shadow-[0_14px_36px_-16px_hsl(var(--primary)/0.85)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0",
        destructive:
          "border border-destructive/40 bg-destructive text-destructive-foreground shadow-[0_10px_24px_-14px_hsl(var(--destructive)/0.8)] hover:-translate-y-0.5 hover:bg-destructive/90 active:translate-y-0",
        outline:
          "border border-input/90 bg-background/80 backdrop-blur-sm hover:border-primary/45 hover:bg-accent/50 hover:text-accent-foreground",
        secondary:
          "border border-border bg-secondary/85 text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary",
        ghost: "border border-transparent hover:bg-accent/65 hover:text-accent-foreground",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
