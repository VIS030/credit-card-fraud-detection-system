"use client"

import React from "react"
import { motion } from "framer-motion"
import { ShieldCheck, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ShapForcePlotProps {
  shapValues: Record<string, number>;
  predictionClass: 0 | 1;
}

export const ShapForcePlot: React.FC<ShapForcePlotProps> = ({ shapValues, predictionClass }) => {
  const features = Object.entries(shapValues || {})
    .map(([name, shapValue]) => ({ name, shapValue: Number(shapValue) || 0 }))
    .sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))
    .slice(0, 12)

  if (features.length === 0) {
    return (
      <p className="text-xs text-muted">
        No SHAP values are stored for this record. Bulk CSV scoring skips per-row explanations to keep batch jobs consistent with the same model probabilities.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-border/50">
        <div className="flex items-center gap-3">
          {predictionClass === 1 ? (
            <div className="p-2 rounded bg-danger/10 text-danger border border-danger/20">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          ) : (
            <div className="p-2 rounded bg-success/10 text-success border border-success/20">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
          )}
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              {predictionClass === 1 ? "SHAP: features pushing toward fraud" : "SHAP: features supporting legitimate"}
            </h4>
            <p className="text-xs text-muted">Bars use the model’s SHAP values. Red increases fraud score; green decreases it.</p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {features.map((feature, idx) => {
          const isRiskIncreaser = feature.shapValue > 0
          const percentageWidth = Math.min(Math.abs(feature.shapValue) * 150, 100)
          return (
            <div key={feature.name} className="flex items-center justify-between text-xs py-1 border-b border-border/20 last:border-b-0">
              <div className="w-1/4 min-w-0">
                <span className="font-semibold text-zinc-300 font-mono block truncate">{feature.name}</span>
              </div>
              <div className="flex-1 px-4 relative flex items-center">
                <div className="w-full h-2 rounded bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentageWidth}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                    className={cn("h-full rounded", isRiskIncreaser ? "bg-danger" : "bg-success")}
                  />
                </div>
              </div>
              <div className="w-20 text-right font-mono">
                <span className={cn("font-medium", isRiskIncreaser ? "text-danger" : "text-success")}>
                  {isRiskIncreaser ? "+" : ""}{feature.shapValue.toFixed(4)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ShapForcePlot
