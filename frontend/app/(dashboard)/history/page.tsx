"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { ShapForcePlot } from "@/components/ml/shap-force-plot"
import { MOCK_HISTORY_TRANSACTIONS, Transaction } from "@/lib/mock-data"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { ShieldCheck, AlertTriangle, Search, Filter, SlidersHorizontal, Check, RefreshCw } from "lucide-react"

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_HISTORY_TRANSACTIONS)
  const [searchTerm, setSearchTerm] = useState("")
  const [classFilter, setClassFilter] = useState<string>("all")
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  // Filter transactions based on query inputs
  const filtered = transactions.filter((tx) => {
    const matchesSearch = 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.location.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesClass = 
      classFilter === "all" ||
      (classFilter === "fraud" && tx.predictionClass === 1) ||
      (classFilter === "legit" && tx.predictionClass === 0);

    return matchesSearch && matchesClass;
  })

  // Apply analyst overrides
  const handleOverride = (txId: string, value: 0 | 1) => {
    setTransactions((prev) => 
      prev.map((t) => 
        t.id === txId ? { ...t, userOverride: value } : t
      )
    )
    if (selectedTx && selectedTx.id === txId) {
      setSelectedTx(prev => prev ? { ...prev, userOverride: value } : null)
    }
  }

  const handleResetFilters = () => {
    setSearchTerm("")
    setClassFilter("all")
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Prediction Audit Ingestion Logs</h1>
        <p className="text-sm text-muted">Complete records of manual and bulk predictions executed by the platform models.</p>
      </div>

      {/* Filter Controllers */}
      <Card>
        <CardContent className="p-5 flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <Input
              label="Search Ingestion Database"
              placeholder="Filter by Transaction ID, Merchant, or Location..."
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
                { value: "legit", label: "Legitimate (Class 0)" }
              ]}
            />
          </div>
          <Button variant="secondary" onClick={handleResetFilters} className="text-xs h-10 w-full md:w-auto">
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/* Main Logs Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-muted uppercase font-semibold text-[10px] tracking-wider bg-white/1">
                <th className="py-3.5 px-6">Transaction Ref</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Merchant / Location</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Risk Probability</th>
                <th className="py-3.5 px-4 text-center">Status / Override</th>
                <th className="py-3.5 px-6 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted">
                    No matching logs found in search queries.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  // Determine final audit resolution display (accounting for overrides)
                  const hasOverride = tx.userOverride !== undefined && tx.userOverride !== null
                  const finalState = hasOverride ? tx.userOverride : tx.predictionClass
                  const isFraud = finalState === 1

                  return (
                    <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-4 px-6 font-mono font-semibold text-zinc-300">{tx.id}</td>
                      <td className="py-4 px-4 text-muted">{formatDateTime(tx.timestamp)}</td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-white block">{tx.merchant}</span>
                        <span className="text-[10px] text-muted uppercase">{tx.cardBrand} •••• {tx.cardLast4} • {tx.location}</span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-white">{formatCurrency(tx.amount)}</td>
                      <td className="py-4 px-4">
                        <span className={`font-mono font-bold ${tx.predictionClass === 1 ? 'text-danger' : 'text-zinc-300'}`}>
                          {(tx.fraudProbability * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {hasOverride ? (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${tx.userOverride === 1 ? 'bg-danger/5 border-danger/20 text-danger' : 'bg-success/5 border-success/20 text-success'}`}>
                            <Check className="h-3 w-3" />
                            Overridden ({tx.userOverride === 1 ? "Fraud" : "Legit"})
                          </span>
                        ) : (
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${tx.predictionClass === 1 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                            {tx.predictionClass === 1 ? "Flagged Fraud" : "Legitimate"}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => setSelectedTx(tx)}
                          className="text-[10px] py-1 px-2.5 h-7"
                        >
                          Review Matrix
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

      {/* Review Modal Dialog */}
      <Dialog
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title={`Audit Diagnostic Review: ${selectedTx?.id}`}
        description="Verify system probability scoring models and review core attributions."
      >
        {selectedTx && (
          <div className="space-y-6">
            
            {/* Core details */}
            <div className="grid grid-cols-2 gap-4 border-b border-border/50 pb-5 text-xs">
              <div>
                <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Merchant / Footprint</span>
                <span className="text-sm font-semibold text-white">{selectedTx.merchant}</span>
                <span className="block text-[10px] text-muted">{selectedTx.location}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Transaction Amount</span>
                <span className="text-sm font-semibold text-white">{formatCurrency(selectedTx.amount)}</span>
                <span className="block text-[10px] text-muted">Time Index: {selectedTx.time}s</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">System Target Prediction</span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded inline-block mt-0.5 ${selectedTx.predictionClass === 1 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                  {selectedTx.predictionClass === 1 ? "Class 1 (Anomalous)" : "Class 0 (Normal)"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Current Decision Resolution</span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded inline-block mt-0.5 ${
                  (selectedTx.userOverride !== undefined && selectedTx.userOverride !== null)
                    ? (selectedTx.userOverride === 1 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success')
                    : (selectedTx.predictionClass === 1 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success')
                }`}>
                  {selectedTx.userOverride !== undefined && selectedTx.userOverride !== null
                    ? `Overridden to: ${selectedTx.userOverride === 1 ? "Fraud" : "Legit"}`
                    : "Active Classifier Decision"
                  }
                </span>
              </div>
            </div>

            {/* Injected XAI SHAP plots */}
            <ShapForcePlot 
              shapValues={selectedTx.shapValues} 
              predictionClass={selectedTx.predictionClass} 
            />

            {/* Operator Override Commands */}
            <div className="p-4 rounded-lg border border-border bg-[#09090b]/80 space-y-3">
              <span className="text-[10px] uppercase text-zinc-300 font-bold block tracking-wider">Manual Analyst Overrides</span>
              <div className="flex gap-2.5">
                <Button 
                  variant="success" 
                  size="sm" 
                  disabled={selectedTx.userOverride === 0}
                  onClick={() => handleOverride(selectedTx.id, 0)}
                  className="text-xs flex-1"
                >
                  Confirm Legitimate (False Positive Override)
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  disabled={selectedTx.userOverride === 1}
                  onClick={() => handleOverride(selectedTx.id, 1)}
                  className="text-xs flex-1"
                >
                  Confirm Fraud (Audit Override)
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button variant="secondary" onClick={() => setSelectedTx(null)} className="text-xs">
                Dismiss Review
              </Button>
            </div>

          </div>
        )}
      </Dialog>

    </div>
  )
}
