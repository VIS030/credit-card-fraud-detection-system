"use client"

import React, { useState, useEffect } from "react"
import { 
  DollarSign, 
  AlertOctagon, 
  Percent, 
  Activity, 
  ArrowRight, 
  Search, 
  ShieldAlert, 
  FileText, 
  Zap, 
  Sliders,
  ExternalLink
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { MetricCard } from "@/components/dashboard"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { ShapForcePlot } from "@/components/ml/shap-force-plot"
import { 
  MOCK_DASHBOARD_STATS, 
  MOCK_HISTORY_TRANSACTIONS, 
  MOCK_ANALYTICS_TRENDS, 
  Transaction 
} from "@/lib/mock-data"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { ApiClient } from "@/lib/api-client"
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts"
import Link from "next/link"

export default function DashboardPage() {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [stats, setStats] = useState(MOCK_DASHBOARD_STATS)
  const [recentAlerts, setRecentAlerts] = useState<Transaction[]>(
    MOCK_HISTORY_TRANSACTIONS.filter(t => t.predictionClass === 1).slice(0, 3)
  )
  const [analyticsData, setAnalyticsData] = useState(MOCK_ANALYTICS_TRENDS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [metricsRes, historyRes, analyticsRes] = await Promise.allSettled([
          ApiClient.getDashboardMetrics(),
          ApiClient.getHistory("all", 50),
          ApiClient.getAnalyticsTrends()
        ]);

        if (!isMounted) return;

        if (metricsRes.status === "fulfilled" && metricsRes.value) {
          const m = metricsRes.value;
          setStats(prev => ({
            ...prev,
            totalProcessed: m.total_processed || prev.totalProcessed,
            processedVolume: m.processed_volume || prev.processedVolume,
            fraudAlerts: m.fraud_alerts || prev.fraudAlerts,
            falsePositives: m.false_positives || prev.falsePositives,
            avgRiskScore: m.avg_risk_score !== undefined ? m.avg_risk_score : prev.avgRiskScore,
            latencyMs: m.latency_ms || prev.latencyMs,
          }));
        }

        if (historyRes.status === "fulfilled" && Array.isArray(historyRes.value)) {
          const dbTxList: Transaction[] = historyRes.value.map((item: any) => ({
            id: item.id.substring(0, 8),
            timestamp: item.timestamp,
            amount: item.amount,
            time: item.time,
            pcaFeatures: item.pca_features || {},
            fraudProbability: item.fraud_probability,
            predictionClass: item.prediction_class,
            userOverride: item.user_override,
            merchant: item.merchant || "Digital Merchant",
            cardBrand: (item.card_brand as any) || "visa",
            cardLast4: item.card_last4 || "4321",
            location: item.location || "Online",
            shapValues: item.shap_values || {},
            riskFactors: item.risk_factors || []
          }));

          if (dbTxList.length > 0) {
            const flagged = dbTxList.filter(t => (t.userOverride ?? t.predictionClass) === 1);
            setRecentAlerts(flagged.length > 0 ? flagged.slice(0, 3) : dbTxList.slice(0, 3));
            setStats(prev => ({
              ...prev,
              activeAlerts: flagged.slice(0, 3).map(a => ({
                id: a.id,
                amount: a.amount,
                probability: a.fraudProbability,
                merchant: a.merchant,
                location: a.location,
                timeAgo: "Live Audit Log"
              }))
            }));
          }
        }

        if (analyticsRes.status === "fulfilled" && analyticsRes.value) {
          setAnalyticsData(analyticsRes.value);
        }
      } catch (err) {
        console.warn("Failed to load live metrics from backend:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Risk Operations Terminal</h1>
          <p className="text-sm text-muted">Real-time credit card transaction monitoring and machine learning fraud analysis.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/predict">
            <Button variant="outline" className="text-xs h-9">
              <Zap className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Test API Manual Form
            </Button>
          </Link>
          <Link href="/bulk">
            <Button className="text-xs h-9">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Upload Batch Ingestion
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Audit Volume"
          value={formatCurrency(stats.processedVolume)}
          change={3.2}
          changeLabel="vs yesterday"
          icon={DollarSign}
          variant="primary"
        />
        <MetricCard
          title="Identified Fraud Alerts"
          value={stats.fraudAlerts}
          change={-2.4}
          changeLabel="vs yesterday"
          icon={AlertOctagon}
          variant="danger"
        />
        <MetricCard
          title="Mean Ingestion Risk"
          value={`${(stats.avgRiskScore * 100).toFixed(2)}%`}
          change={0.1}
          changeLabel="flat line"
          icon={Percent}
          variant="accent"
        />
        <MetricCard
          title="API Engine Latency"
          value={`${stats.latencyMs} ms`}
          description="99.9th percentile metric"
          icon={Activity}
          variant="success"
        />
      </div>

      {/* Central Charts and Ingestion Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inflow Fraud Velocity</CardTitle>
            <CardDescription>Daily tracked transaction audit alerts relative to total throughput volume.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_ANALYTICS_TRENDS.dailyPerformance}>
                <defs>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelClassName="text-white text-xs font-mono font-bold"
                  itemStyle={{ color: '#ef4444', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="fraudAlerts" name="Fraud Alerts" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFraud)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Live Active Flags */}
        <Card>
          <CardHeader>
            <CardTitle>Action Needed</CardTitle>
            <CardDescription>Highest probability fraud alerts currently requiring manual audit confirmation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.activeAlerts.map((alert) => (
              <div 
                key={alert.id}
                className="p-3.5 rounded-lg border border-border bg-[#09090b]/40 hover:bg-[#121214]/60 transition-all duration-200 flex flex-col gap-2 relative overflow-hidden group"
              >
                <div className="absolute right-0 top-0 h-full w-[2px] bg-danger" />
                
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-zinc-300">{alert.id}</span>
                  <span className="text-[10px] text-muted">{alert.timeAgo}</span>
                </div>
                
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-white">{formatCurrency(alert.amount)}</span>
                  <span className="text-xs text-danger font-semibold font-mono bg-danger/10 px-1.5 py-0.5 rounded">
                    {(alert.probability * 100).toFixed(1)}% Risk
                  </span>
                </div>

                <div className="text-[11px] text-muted flex justify-between">
                  <span>{alert.merchant}</span>
                  <span>{alert.location}</span>
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

      {/* Critical Recent Alert Log Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Recent Verified Anomalies</CardTitle>
            <CardDescription>Recent transaction records identified as highly anomalous by active model.</CardDescription>
          </div>
          <Link href="/history">
            <Button variant="outline" size="sm" className="text-xs">
              Go to History Audit
              <ExternalLink className="h-3 w-3 ml-1.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/80 text-muted uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Merchant / Location</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-right">Risk Score</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {recentAlerts.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-zinc-300">{tx.id}</td>
                  <td className="py-3.5 px-4 text-muted">{formatDateTime(tx.timestamp)}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-white block">{tx.merchant}</span>
                    <span className="text-[10px] text-muted">{tx.location}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">{formatCurrency(tx.amount)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-block font-mono font-bold text-danger bg-danger/10 px-2 py-0.5 rounded">
                      {(tx.fraudProbability * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setSelectedTx(tx)}
                      className="text-[10px] py-1 px-2.5 h-7"
                    >
                      Audit Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Audit Detail Dialog */}
      <Dialog
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title={`Audit Diagnostic: ${selectedTx?.id}`}
        description="Comprehensive classifier attribution diagnostics and transaction attributes."
      >
        {selectedTx && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 border-b border-border/50 pb-5">
              <div>
                <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Merchant / Vendor</span>
                <span className="text-sm font-semibold text-white">{selectedTx.merchant}</span>
                <span className="block text-[10px] text-muted">{selectedTx.location}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Transaction Amount</span>
                <span className="text-sm font-semibold text-white">{formatCurrency(selectedTx.amount)}</span>
                <span className="block text-[10px] text-muted">Time Index: {selectedTx.time}s</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Card Brand & Info</span>
                <span className="text-sm font-semibold text-white uppercase">{selectedTx.cardBrand} •••• {selectedTx.cardLast4}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Model Probability</span>
                <span className="text-sm font-bold text-danger font-mono bg-danger/10 px-2 py-0.5 rounded inline-block mt-0.5">
                  {(selectedTx.fraudProbability * 100).toFixed(2)}% Risk Score
                </span>
              </div>
            </div>

            {/* Injected XAI SHAP Visuals */}
            <ShapForcePlot 
              shapValues={selectedTx.shapValues} 
              predictionClass={selectedTx.predictionClass} 
            />

            {/* Risk factors listing */}
            {selectedTx.riskFactors.length > 0 && (
              <div className="p-4 rounded-lg border border-border bg-[#09090b]/80 space-y-2">
                <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Identified Risk Markers</span>
                <ul className="list-disc pl-4 space-y-1 text-xs text-zinc-300">
                  {selectedTx.riskFactors.map((rf, i) => (
                    <li key={i}>{rf}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button variant="secondary" onClick={() => setSelectedTx(null)} className="text-xs">
                Dismiss
              </Button>
              <Button 
                variant="success" 
                onClick={() => {
                  setSelectedTx(null)
                  alert("Anomaly overridden as Legitimate. Override index recorded to system audits.")
                }}
                className="text-xs"
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
