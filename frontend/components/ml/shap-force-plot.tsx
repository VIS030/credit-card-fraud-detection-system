"use client"

import React from "react"
import { motion } from "framer-motion"
import { ShieldCheck, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ShapFeature {
  name: string;
  value: number; // Feature's original value
  shapValue: number; // Feature's impact (SHAP value)
}

interface ShapForcePlotProps {
  shapValues: Record<string, number>;
  baseValue?: number;
  predictionClass: 0 | 1;
}

export const ShapForcePlot: React.FC<ShapForcePlotProps> = ({
  shapValues,
  baseValue = 0.05,
  predictionClass
}) => {
  // Map and sort features by absolute SHAP impact
  const features: ShapFeature[] = Object.entries(shapValues).map(([name, shapValue]) => {
    // Generate logical mock input feature values for aesthetics
    const randomVal = name === "Amount" ? 1250.00 : (Math.random() * 4 - 2);
    return {
      name,
      value: Number(randomVal.toFixed(2)),
      shapValue
    };
  }).sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));

  const positiveImpacts = features.filter(f => f.shapValue > 0);
  const negativeImpacts = features.filter(f => f.shapValue < 0);

  return (
    <div className="space-y-6">
      {/* SHAP explanation header */}
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
              {predictionClass === 1 ? "SHAP Explanation: Fraud Factors Dominating" : "SHAP Explanation: Legitimate Baseline Stable"}
            </h4>
            <p className="text-xs text-muted">
              Model base risk value is <span className="font-mono text-foreground">{(baseValue * 100).toFixed(1)}%</span>. Feature vectors pull probability up (red) or down (green).
            </p>
          </div>
        </div>
      </div>

      {/* Force plot visual bars */}
      <div className="space-y-4">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider block">Key Feature Risk Attribution</span>
        <div className="space-y-2">
          {features.map((feature, idx) => {
            const isRiskIncreaser = feature.shapValue > 0;
            const percentageWidth = Math.min(Math.abs(feature.shapValue) * 150, 100); // Scale up for visualization clarity

            return (
              <div key={feature.name} className="flex items-center justify-between text-xs py-1 border-b border-border/20 last:border-b-0 hover:bg-white/2">
                <div className="w-1/4 min-w-0">
                  <span className="font-semibold text-zinc-300 font-mono block truncate">{feature.name}</span>
                  <span className="text-[10px] text-muted font-mono block">Val: {feature.value}</span>
                </div>

                {/* Vector Bar */}
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

                {/* Score */}
                <div className="w-20 text-right font-mono">
                  <span className={cn("font-medium", isRiskIncreaser ? "text-danger" : "text-success")}>
                    {isRiskIncreaser ? '+' : ''}{feature.shapValue.toFixed(4)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default ShapForcePlot;
