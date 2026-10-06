"use client"

import React, { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ApiClient } from "@/lib/api-client"
import type { AnalyticsTrends } from "@/lib/types"

const emptyTrends: AnalyticsTrends = {
  dailyPerformance: [],
  amountDistribution: [],
  topCorrelations: [],
}

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<AnalyticsTrends>(emptyTrends)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true
    async function loadTrends() {
      try {
        const res = await ApiClient.getAnalyticsTrends()
        if (isMounted) setTrends(res)
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Could not load analytics.")
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadTrends()
    return () => {
      isMounted = false
    }
  }, [])

  const hasData = trends.dailyPerformance.some((point) => point.transactions > 0) || trends.amountDistribution.some((b) => b.legitimate + b.fraud > 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
        <p className="text-sm text-muted">Charts are aggregated from your stored predictions.</p>
      </div>

      {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</div>}
      {loading && <p className="text-xs text-muted">Loading analytics...</p>}
      {!loading && !hasData && !error && (
        <p className="text-xs text-muted">No scored transactions yet. Run predictions to populate these charts.</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Mean SHAP Attributions</CardTitle>
            <CardDescription>Average feature impact from saved explanations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trends.topCorrelations.length === 0 ? (
              <p className="text-xs text-muted">SHAP summaries appear after single predictions are stored.</p>
            ) : (
              trends.topCorrelations.map((corr) => {
                const isNegative = corr.impact < 0
                return (
                  <div key={corr.feature} className="p-3 rounded-lg border border-border bg-[#09090b]/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">{corr.feature}</span>
                      <span className={`font-mono text-xs font-bold ${isNegative ? "text-danger" : "text-success"}`}>
                        {corr.impact > 0 ? "+" : ""}{corr.impact.toFixed(4)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted leading-tight">{corr.description}</p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Amount Distribution</CardTitle>
            <CardDescription>Legitimate vs fraud counts by transaction amount.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends.amountDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="range" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px" }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "10px", color: "#f4f4f5" }} />
                <Bar dataKey="legitimate" name="Legitimate" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Bar dataKey="fraud" name="Flagged Fraud" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Volume</CardTitle>
          <CardDescription>Processed transactions and fraud alerts by day.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {trends.dailyPerformance.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted">No daily history yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends.dailyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis yAxisId="left" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px" }} />
                <Line yAxisId="left" type="monotone" dataKey="transactions" name="Processed" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="fraudAlerts" name="Fraud alerts" stroke="#d946ef" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
