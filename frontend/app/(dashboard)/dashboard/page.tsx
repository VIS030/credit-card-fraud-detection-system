"use client"

import React, { useState, useEffect } from "react"
import { DollarSign, AlertOctagon, Percent, Activity, ArrowRight, FileText, Zap, ExternalLink } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { MetricCard } from "@/components/dashboard"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { ShapForcePlot } from "@/components/ml/shap-force-plot"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { ApiClient } from "@/lib/api-client"
import type { AnalyticsTrends, DashboardMetrics, HistoryItem } from "@/lib/types"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import Link from "next/link"

const emptyMetrics: DashboardMetrics = {
  total_processed: 0,
  processed_volume: 0,
  fraud_alerts: 0,
  legitimate_count: 0,
  false_positives: 0,
  avg_risk_score: 0,
  override_count: 0,
  latency_ms: null,
}

const emptyTrends: AnalyticsTrends = {
  dailyPerformance: [],
  amountDistribution: [],
  topCorrelations: [],
}

export default function DashboardPage() {
  const [selectedTx, setSelectedTx] = useState<HistoryItem | null>(null)
  const [stats, setStats] = useState<DashboardMetrics>(emptyMetrics)
  const [recentAlerts, setRecentAlerts] = useState<HistoryItem[]>([])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsTrends>(emptyTrends)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [overrideMessage, setOverrideMessage] = useState("")

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const [metricsRes, historyRes, analyticsRes] = await Promise.allSettled([
          ApiClient.getDashboardMetrics(),
          ApiClient.getHistory("all", 50),
          ApiClient.getAnalyticsTrends(),
        ])

        if (!isMounted) return

        const problems: string[] = []
        if (metricsRes.status === "fulfilled") {
          setStats(metricsRes.value)
        } else {
          problems.push("dashboard metrics")
        }

        if (historyRes.status === "fulfilled" && Array.isArray(historyRes.value)) {
          const flagged = historyRes.value.filter((item) => (item.user_override ?? item.prediction_class) === 1)
          setRecentAlerts(flagged.length > 0 ? flagged.slice(0, 5) : [])
        } else {
          problems.push("history")
        }

        if (analyticsRes.status === "fulfilled") {
          setAnalyticsData(analyticsRes.value)
        } else {
          problems.push("analytics")
        }

        if (problems.length) {
          setError(`Could not load ${problems.join(", ")}. Showing whatever data was available.`)
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load dashboard")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Risk Operations Terminal</h1>
          <p className="text-sm text-muted">Metrics are computed from your saved predictions, not sample data.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/predict">
            <Button variant="outline" className="text-xs h-9">
              <Zap className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Single Prediction
            </Button>
          </Link>
          <Link href="/bulk">
            <Button className="text-xs h-9">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Bulk CSV
            </Button>
          </Link>
        </div>
      </div>

      {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Processed Volume" value={formatCurrency(stats.processed_volume)} description={`${stats.total_processed} scored transactions`} icon={DollarSign} variant="primary" loading={loading} />
        <MetricCard title="Fraud Alerts" value={stats.fraud_alerts} description={`${stats.legitimate_count} legitimate`} icon={AlertOctagon} variant="danger" loading={loading} />
        <MetricCard title="Mean Fraud Probability" value={`${(stats.avg_risk_score * 100).toFixed(2)}%`} description={`${stats.false_positives} marked false positive`} icon={Percent} variant="accent" loading={loading} />
        <MetricCard title="Manual Overrides" value={stats.override_count} description="Analyst decisions recorded" icon={Activity} variant="success" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fraud Alerts Over Time</CardTitle>
            <CardDescription>Daily counts from your prediction history.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {analyticsData.dailyPerformance.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted">No scored transactions yet. Run a prediction to populate this chart.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.dailyPerformance}>
                  <defs>
                    <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px" }} labelClassName="text-white text-xs font-mono font-bold" itemStyle={{ color: "#ef4444", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="fraudAlerts" name="Fraud Alerts" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFraud)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Action Needed</CardTitle>
            <CardDescription>Highest-risk records from your history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAlerts.length === 0 && (
              <p className="text-xs text-muted py-8 text-center">No fraud alerts yet.</p>
            )}
            {recentAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="p-3.5 rounded-lg border border-border bg-[#09090b]/40 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-[2px] bg-danger" />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-zinc-300">{alert.id.slice(0, 8)}</span>
                  <span className="text-[10px] text-muted">{formatDateTime(alert.timestamp)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-white">{formatCurrency(alert.amount)}</span>
                  <span className="text-xs text-danger font-semibold font-mono bg-danger/10 px-1.5 py-0.5 rounded">
                    {(alert.fraud_probability * 100).toFixed(1)}% Risk
                  </span>
                </div>
              </div>
            ))}
            <Link href="/history" className="text-xs text-primary font-semibold hover:text-primary-hover flex items-center justify-end gap-1 pt-2">
              View All Log History
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Recent Flagged Transactions</CardTitle>
            <CardDescription>Records classified as fraud by the active model.</CardDescription>
          </div>
          <Link href="/history">
            <Button variant="outline" size="sm" className="text-xs">
              Go to History Audit
              <ExternalLink className="h-3 w-3 ml-1.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {recentAlerts.length === 0 ? (
            <p className="text-xs text-muted py-8 text-center">History is empty. Predictions you score will appear here.</p>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/80 text-muted uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Risk Score</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentAlerts.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-300">{tx.id.slice(0, 8)}</td>
                    <td className="py-3.5 px-4 text-muted">{formatDateTime(tx.timestamp)}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{formatCurrency(tx.amount)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-block font-mono font-bold text-danger bg-danger/10 px-2 py-0.5 rounded">
                        {(tx.fraud_probability * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button variant="secondary" size="sm" onClick={() => setSelectedTx(tx)} className="text-[10px] py-1 px-2.5 h-7">
                        Audit Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog isOpen={!!selectedTx} onClose={() => { setSelectedTx(null); setOverrideMessage(""); }} title={`Audit Diagnostic: ${selectedTx?.id.slice(0, 8)}`} description="Classifier attribution diagnostics for this saved prediction.">
        {selectedTx && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 border-b border-border/50 pb-5">
              <div>
                <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Transaction Amount</span>
                <span className="text-sm font-semibold text-white">{formatCurrency(selectedTx.amount)}</span>
                <span className="block text-[10px] text-muted">Time Index: {selectedTx.time}s</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Model Probability</span>
                <span className="text-sm font-bold text-danger font-mono bg-danger/10 px-2 py-0.5 rounded inline-block mt-0.5">
                  {(selectedTx.fraud_probability * 100).toFixed(2)}% Risk Score
                </span>
              </div>
            </div>
            <ShapForcePlot shapValues={selectedTx.shap_values || {}} predictionClass={selectedTx.prediction_class} />
            {overrideMessage && <p className="text-xs text-success">{overrideMessage}</p>}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button variant="secondary" onClick={() => setSelectedTx(null)} className="text-xs">Dismiss</Button>
              <Button
                variant="success"
                className="text-xs"
                onClick={async () => {
                  try {
                    await ApiClient.overridePrediction(selectedTx.id, 0)
                    setOverrideMessage("Marked as false positive and stored on this prediction.")
                  } catch (err) {
                    setOverrideMessage(err instanceof Error ? err.message : "Override failed")
                  }
                }}
              >
                Mark as False Positive
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
