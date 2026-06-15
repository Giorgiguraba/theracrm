import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-accent)] text-[oklch(15%_0.05_130)] font-semibold hover:-translate-y-px hover:shadow-[0_8px_24px_var(--color-accent-glow)]",
        outline: "border bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-hover)]",
        ghost: "text-[var(--text-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]",
        danger: "bg-[var(--color-status-overdue)] text-white hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-3.5",
        lg: "h-10 px-4 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        style={{ borderColor: "var(--border)" }}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
