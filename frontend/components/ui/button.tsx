import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
          {
            // Variants
            "bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 glow-primary": variant === 'primary',
            "bg-card hover:bg-card-hover text-foreground border border-border": variant === 'secondary',
            "border border-border bg-transparent hover:bg-white/5 text-foreground": variant === 'outline',
            "text-muted hover:text-foreground hover:bg-white/5 bg-transparent": variant === 'ghost',
            "bg-danger hover:bg-danger/90 text-white shadow-lg shadow-danger/20": variant === 'danger',
            "bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20": variant === 'success',
            // Sizes
            "px-3 py-1.5 text-xs": size === 'sm',
            "px-4 py-2 text-sm": size === 'md',
            "px-6 py-3 text-base": size === 'lg',
            "h-10 w-10 p-0": size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
