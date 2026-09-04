"use client"

import React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { MOCK_ANALYTICS_TRENDS } from "@/lib/mock-data"
import { ShieldCheck, BarChart3, TrendingUp, Sparkles } from "lucide-react"

export default function AnalyticsPage() {
  const trends = MOCK_ANALYTICS_TRENDS

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Analytics & ML Indicators</h1>
        <p className="text-sm text-muted">Feature correlations, distribution weights, and model diagnostic aggregations.</p>
      </div>

      {/* Top row analytics overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Model metrics summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Model Feature Weights</CardTitle>
            <CardDescription>Correlation impact variables relative to target Class (0 vs 1).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {trends.topCorrelations.map((corr) => {
                const isNegative = corr.impact < 0;
                return (
                  <div key={corr.feature} className="p-3 rounded-lg border border-border bg-[#09090b]/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">{corr.feature}</span>
                      <span className={`font-mono text-xs font-bold ${isNegative ? 'text-danger' : 'text-success'}`}>
                        {corr.impact > 0 ? '+' : ''}{corr.impact.toFixed(2)} Correlation
                      </span>
                    </div>
                    <p className="text-[11px] text-muted leading-tight">{corr.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Amount distribution chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fraud Attributions by Transaction Value</CardTitle>
            <CardDescription>Visualizing frequency of flagged fraudulent activities inside amount buckets.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends.amountDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="range" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelClassName="text-white text-xs font-mono font-bold"
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#f4f4f5' }} />
                <Bar dataKey="legitimate" name="Legitimate Audits" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Bar dataKey="fraud" name="Flagged Fraud" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Performance Line Graphs */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance Trends</CardTitle>
          <CardDescription>Ingested transaction volumes plotted against detected alert speeds.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends.dailyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis yAxisId="left" stroke="#71717a" fontSize={10} tickLine={false} label={{ value: 'Daily volume', angle: -90, position: 'insideLeft', style: { fill: '#71717a', fontSize: 10 } }} />
              <YAxis yAxisId="right" orientation="right" stroke="#71717a" fontSize={10} tickLine={false} label={{ value: 'Fraud Alerts', angle: 90, position: 'insideRight', style: { fill: '#71717a', fontSize: 10 } }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                labelClassName="text-white text-xs font-mono font-bold"
                itemStyle={{ fontSize: '12px' }}
              />
              <Line yAxisId="left" type="monotone" dataKey="transactions" name="Processed Inflow" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="fraudAlerts" name="Identified Fraud" stroke="#d946ef" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  )
}
