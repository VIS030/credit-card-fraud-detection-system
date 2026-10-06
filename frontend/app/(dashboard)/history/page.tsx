"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { ShapForcePlot } from "@/components/ml/shap-force-plot"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { ApiClient } from "@/lib/api-client"
import type { HistoryItem } from "@/lib/types"

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<HistoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [selectedTx, setSelectedTx] = useState<HistoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadHistory = async (filter = classFilter) => {
    setLoading(true)
    setError("")
    try {
      const historyRes = await ApiClient.getHistory(filter, 200)
      setTransactions(Array.isArray(historyRes) ? historyRes : [])
    } catch (err) {
      setTransactions([])
      setError(err instanceof Error ? err.message : "Could not load prediction history.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory("all")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadHistory(classFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter])

  const filtered = transactions.filter((tx) => {
    const haystack = `${tx.id} ${tx.amount} ${tx.time}`.toLowerCase()
    return haystack.includes(searchTerm.toLowerCase())
  })

  const handleOverride = async (txId: string, value: 0 | 1) => {
    try {
      const updated = await ApiClient.overridePrediction(txId, value)
      setTransactions((prev) => prev.map((t) => (t.id === txId ? updated : t)))
      setSelectedTx(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Override failed.")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Prediction History</h1>
        <p className="text-sm text-muted">Only your saved model outputs are listed here.</p>
      </div>

      {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</div>}

      <Card>
        <CardContent className="p-5 flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <Input
              label="Search"
              placeholder="Filter by transaction ID, amount, or time index..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              label="Anomaly Class"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: "all", label: "All Transactions" },
                { value: "fraud", label: "Flagged Fraud (Class 1)" },
                { value: "legit", label: "Legitimate (Class 0)" },
              ]}
            />
          </div>
          <Button variant="secondary" onClick={() => { setSearchTerm(""); setClassFilter("all"); }} className="text-xs h-10 w-full md:w-auto">
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-muted uppercase font-semibold text-[10px] tracking-wider bg-white/1">
                <th className="py-3.5 px-6">Transaction Ref</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Time Index</th>
                <th className="py-3.5 px-4">Risk Probability</th>
                <th className="py-3.5 px-4 text-center">Status / Override</th>
                <th className="py-3.5 px-6 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted">Loading history...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted">
                    No prediction history yet. Run a single or CSV prediction first.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const hasOverride = tx.user_override !== undefined && tx.user_override !== null
                  const finalState = hasOverride ? tx.user_override : tx.prediction_class
                  return (
                    <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-4 px-6 font-mono font-semibold text-zinc-300">{tx.id.slice(0, 8)}</td>
                      <td className="py-4 px-4 text-muted">{formatDateTime(tx.timestamp)}</td>
                      <td className="py-4 px-4 font-semibold text-white">{formatCurrency(tx.amount)}</td>
                      <td className="py-4 px-4 text-muted">{tx.time}</td>
                      <td className="py-4 px-4">
                        <span className={`font-mono font-bold ${tx.prediction_class === 1 ? "text-danger" : "text-zinc-300"}`}>
                          {(tx.fraud_probability * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {hasOverride ? (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${tx.user_override === 1 ? "bg-danger/5 border-danger/20 text-danger" : "bg-success/5 border-success/20 text-success"}`}>
                            Overridden ({tx.user_override === 1 ? "Fraud" : "Legit"})
                          </span>
                        ) : (
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${finalState === 1 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
                            {tx.prediction_class === 1 ? "Flagged Fraud" : "Legitimate"}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button variant="secondary" size="sm" onClick={() => setSelectedTx(tx)} className="text-[10px] py-1 px-2.5 h-7">
                          Review
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title={`Audit Review: ${selectedTx?.id.slice(0, 8)}`} description="Stored model probability and SHAP values for this transaction.">
        {selectedTx && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 border-b border-border/50 pb-5 text-xs">
              <div>
                <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Amount</span>
                <span className="text-sm font-semibold text-white">{formatCurrency(selectedTx.amount)}</span>
                <span className="block text-[10px] text-muted">Time Index: {selectedTx.time}s</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Saved Probability</span>
                <span className="text-sm font-semibold text-white font-mono">{(selectedTx.fraud_probability * 100).toFixed(2)}%</span>
              </div>
            </div>
            <ShapForcePlot shapValues={selectedTx.shap_values || {}} predictionClass={selectedTx.prediction_class} />
            <div className="p-4 rounded-lg border border-border bg-[#09090b]/80 space-y-3">
              <span className="text-[10px] uppercase text-zinc-300 font-bold block tracking-wider">Manual Analyst Overrides</span>
              <div className="flex gap-2.5">
                <Button variant="success" size="sm" disabled={selectedTx.user_override === 0} onClick={() => handleOverride(selectedTx.id, 0)} className="text-xs flex-1">
                  Confirm Legitimate
                </Button>
                <Button variant="danger" size="sm" disabled={selectedTx.user_override === 1} onClick={() => handleOverride(selectedTx.id, 1)} className="text-xs flex-1">
                  Confirm Fraud
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
