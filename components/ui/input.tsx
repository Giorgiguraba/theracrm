import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-9 w-full rounded-lg border bg-[var(--surface)] px-3 py-1 text-sm",
        "transition-colors placeholder:text-[var(--text-faint)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:border-transparent",
        "disabled:opacity-50",
        className,
      )}
      style={{ borderColor: "var(--border)", color: "var(--text)" }}
      {...props}
    />
  ),
);
Input.displayName = "Input";
