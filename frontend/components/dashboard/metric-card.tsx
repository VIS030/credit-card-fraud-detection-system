import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: number; // percentage change, e.g. +2.4 or -1.5
  changeLabel?: string; // e.g. "vs last week"
  icon: LucideIcon;
  variant?: 'primary' | 'accent' | 'success' | 'danger' | 'default';
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  change,
  changeLabel,
  icon: Icon,
  variant = 'default',
  loading = false
}) => {
  const isPositive = change && change >= 0;

  if (loading) {
    return (
      <Card className="animate-shimmer h-32 overflow-hidden border-border/50 bg-[#09090b]">
        <div className="p-6 h-full flex flex-col justify-between opacity-10">
          <div className="h-4 w-24 bg-white rounded" />
          <div className="h-8 w-32 bg-white rounded" />
          <div className="h-3 w-40 bg-white rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-panel-hover overflow-hidden relative">
      {/* Visual gradient backdrop */}
      <div className={cn("absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[50px] opacity-[0.03] pointer-events-none", {
        "bg-primary": variant === 'primary',
        "bg-accent": variant === 'accent',
        "bg-success": variant === 'success',
        "bg-danger": variant === 'danger',
        "bg-white": variant === 'default',
      })} />

      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</span>
          <div className={cn("p-2 rounded-lg border border-border/40 bg-white/5", {
            "text-primary border-primary/20 bg-primary/5": variant === 'primary',
            "text-accent border-accent/20 bg-accent/5": variant === 'accent',
            "text-success border-success/20 bg-success/5": variant === 'success',
            "text-danger border-danger/20 bg-danger/5": variant === 'danger',
            "text-muted": variant === 'default',
          })}>
            <Icon className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
          
          {(change !== undefined || description || changeLabel) && (
            <div className="flex items-center gap-1.5 text-xs">
              {change !== undefined && (
                <span className={cn("flex items-center font-semibold gap-0.5", {
                  "text-success": isPositive,
                  "text-danger": !isPositive
                })}>
                  {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {isPositive ? '+' : ''}{change}%
                </span>
              )}
              {changeLabel && <span className="text-muted">{changeLabel}</span>}
              {description && <span className="text-muted truncate block">{description}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
export default MetricCard;
