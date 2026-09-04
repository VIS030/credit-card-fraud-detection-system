import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, label, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-muted uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-lg border border-border bg-[#09090b]/80 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            error ? "border-danger focus:ring-danger focus:border-danger" : "",
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-danger font-medium mt-0.5">
            {error}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"
