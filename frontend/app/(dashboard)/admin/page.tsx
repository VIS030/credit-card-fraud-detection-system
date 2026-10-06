"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, Database, Cpu, BrainCircuit } from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import type { ModelVersion, SystemDiagnostics } from "@/lib/types"

export default function AdminPage() {
  const [models, setModels] = useState<ModelVersion[]>([])
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [diag, modelList] = await Promise.all([
        ApiClient.getDiagnostics(),
        ApiClient.getAdminModels().catch(() => [] as ModelVersion[]),
      ])
      setDiagnostics(diag)
      setModels(modelList)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load diagnostics.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleActivate = async (id: string) => {
    try {
      const res = await ApiClient.activateModel(id)
      setMessage(res.message)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activation failed.")
    }
  }

  const handleRetrain = async () => {
    try {
      await ApiClient.retrainModel()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Retraining is not enabled in the API.")
    }
  }

  const statusClass = (status?: string) =>
    status === "healthy" ? "text-success" : "text-danger"

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Diagnostics</h1>
        <p className="text-sm text-muted">Statuses are queried from the live API, database, and model loader.</p>
      </div>

      {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</div>}
      {message && <div className="rounded-lg border border-border bg-white/5 px-4 py-3 text-xs text-zinc-300">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { key: "api", icon: Cpu, title: "API" },
          { key: "database", icon: Database, title: "Database" },
          { key: "model", icon: BrainCircuit, title: "ML Model" },
          { key: "authentication", icon: Activity, title: "Authentication" },
          { key: "environment", icon: Activity, title: "Environment" },
        ].map((item) => {
          const service = diagnostics?.[item.key as keyof SystemDiagnostics]
          const detail = typeof service === "object" && service && "status" in service ? service : null
          const Icon = item.icon
          return (
            <Card key={item.key}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
                  <CardDescription>{loading ? "Checking..." : detail?.detail || "Unavailable"}</CardDescription>
                </div>
                <Icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <span className={`text-2xl font-extrabold capitalize ${statusClass(detail?.status)}`}>
                  {detail?.status || (loading ? "..." : "unknown")}
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registered Model Versions</CardTitle>
            <CardDescription>Values come from the model_versions table, including metrics stored with the artifact.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {models.length === 0 ? (
              <p className="text-xs text-muted">No model versions registered, or admin access is required to list them.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted uppercase font-semibold text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Version</th>
                    <th className="py-3.5 px-4">Algorithm</th>
                    <th className="py-3.5 px-4 text-center">F1</th>
                    <th className="py-3.5 px-4 text-center">AUC</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {models.map((model) => (
                    <tr key={model.id}>
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-300">{model.version}</td>
                      <td className="py-3.5 px-4 text-muted">{model.algorithm}</td>
                      <td className="py-3.5 px-4 text-center font-mono">{model.f1_score != null ? model.f1_score.toFixed(3) : "—"}</td>
                      <td className="py-3.5 px-4 text-center font-mono">{model.auc_roc != null ? model.auc_roc.toFixed(3) : "—"}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${model.is_active ? "bg-success/10 text-success" : "bg-[#09090b] text-muted"}`}>
                          {model.is_active ? "Active" : "Standby"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!model.is_active && (
                          <Button variant="secondary" size="sm" onClick={() => handleActivate(model.id)} className="text-[10px] h-7 px-2">
                            Activate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retrain Pipeline</CardTitle>
            <CardDescription>Training is an offline process using ml/train_model.py.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted leading-relaxed">
              The API will not fake a training job. Retrain locally with the dataset, then restart the backend so it reloads `fraud_model.pkl`.
            </p>
            <Button variant="secondary" onClick={handleRetrain} className="text-xs w-full">
              Check retrain endpoint
            </Button>
            <Button variant="outline" onClick={load} className="text-xs w-full">
              Refresh diagnostics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
