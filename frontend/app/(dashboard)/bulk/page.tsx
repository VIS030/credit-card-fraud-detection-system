"use client"

import React, { useRef, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight, Download } from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import type { BulkUploadResponse } from "@/lib/types"

const REQUIRED_COLUMNS = ["Time", ...Array.from({ length: 28 }, (_, i) => `V${i + 1}`), "Amount"]

export default function BulkPredictPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"idle" | "uploading" | "completed" | "failed">("idle")
  const [error, setError] = useState("")
  const [result, setResult] = useState<BulkUploadResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const assignFile = (next: File | null) => {
    setFile(next)
    setError("")
    setResult(null)
    setStatus("idle")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (!dropped) return
    if (!dropped.name.toLowerCase().endsWith(".csv")) {
      setError("Please drop a .csv file with columns Time, V1–V28, Amount.")
      return
    }
    assignFile(dropped)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Only CSV files are supported.")
      return
    }
    assignFile(selected)
  }

  const startProcessing = async () => {
    if (!file) return
    setStatus("uploading")
    setError("")
    setResult(null)
    try {
      const res = await ApiClient.predictCSV(file)
      setResult(res)
      setStatus("completed")
    } catch (err: unknown) {
      setStatus("failed")
      setError(err instanceof Error ? err.message : "CSV prediction failed.")
    }
  }

  const downloadPreview = () => {
    if (!result) return
    const header = "id,time,amount,fraud_probability,prediction_class"
    const rows = result.results.map(
      (row) => `${row.id},${row.time},${row.amount},${row.fraud_probability},${row.prediction_class}`
    )
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${result.file_name.replace(/\.csv$/i, "")}-predictions.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Batch CSV Classification</h1>
        <p className="text-sm text-muted">
          Upload uses the same scaler and XGBoost model as single prediction. Required columns: Time, V1–V28, Amount.
        </p>
      </div>

      {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inflow Configuration</CardTitle>
            <CardDescription>Extra columns are ignored. Missing required columns are rejected.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-3 rounded-lg border border-border bg-[#09090b]/80 font-mono text-xs text-zinc-400">
              Schema: {REQUIRED_COLUMNS.join(", ")}
            </div>

            {status === "idle" || status === "failed" ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/40 bg-[#09090b]/40 hover:bg-[#121214]/60 p-12 rounded-xl text-center cursor-pointer transition-all duration-200 group"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv,text/csv" className="hidden" />
                <UploadCloud className="h-10 w-10 text-muted group-hover:text-primary mx-auto mb-4 transition-colors" />
                <h3 className="text-sm font-semibold text-white mb-1">{file ? file.name : "Select transaction dataset"}</h3>
                <p className="text-xs text-muted max-w-[280px] mx-auto leading-relaxed">
                  {file ? `${(file.size / 1024).toFixed(1)} KB • Ready for scoring` : "Drag a CSV here or click to browse."}
                </p>
              </div>
            ) : (
              <div className="p-6 border border-border bg-[#09090b]/60 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4.5 w-4.5 text-primary" />
                    <div>
                      <span className="text-xs font-semibold text-white block">{file?.name}</span>
                      <span className="text-[10px] text-muted block uppercase tracking-wider">
                        {status === "uploading" && "Scoring rows with the production model..."}
                        {status === "completed" && "Batch scoring completed"}
                      </span>
                    </div>
                  </div>
                  {status === "completed" ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Loader2 className="h-5 w-5 text-primary animate-spin" />}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            {status === "idle" || status === "failed" ? (
              <Button onClick={startProcessing} disabled={!file} className="text-xs">
                Run Batch Classification
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => assignFile(null)}
                className="text-xs"
                disabled={status === "uploading"}
              >
                Reset Form
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingestion Diagnostics</CardTitle>
            <CardDescription>Counts come from the scored CSV, not a client simulation.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px] flex flex-col justify-center">
            {!result && (
              <div className="text-center py-10 space-y-2 text-muted">
                <AlertCircle className="h-8 w-8 mx-auto stroke-zinc-700" />
                <span className="text-xs max-w-[200px] mx-auto block">Upload a valid CSV to see fraud and legitimate counts.</span>
              </div>
            )}
            {result && (
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-white/5 border border-border/50 text-xs space-y-3">
                  <span className="font-semibold text-zinc-300 block uppercase tracking-wider text-[10px]">Batch Summary</span>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <span className="text-muted block text-[10px]">Total Scanned</span>
                      <span className="text-sm font-bold text-white">{result.total_rows}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">Flagged Fraud</span>
                      <span className="text-sm font-bold text-danger">{result.fraud_count}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">Legitimate</span>
                      <span className="text-sm font-bold text-success">{result.legitimate_count}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">Status</span>
                      <span className="text-sm font-bold text-white capitalize">{result.status}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-300 block uppercase tracking-wider text-[10px]">Sample Rows</span>
                    <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={downloadPreview}>
                      <Download className="h-3 w-3 mr-1" />
                      Export sample
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {result.results.map((row) => (
                      <div key={row.id} className="p-2.5 rounded border border-border/80 bg-[#09090b]/80 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-mono text-zinc-400 block">{row.id.slice(0, 8)}</span>
                          <span className="text-muted text-[10px]">{formatCurrency(row.amount)}</span>
                        </div>
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${row.prediction_class === 1 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
                          {(row.fraud_probability * 100).toFixed(1)}% {row.prediction_class === 1 ? "Risk" : "Legit"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
