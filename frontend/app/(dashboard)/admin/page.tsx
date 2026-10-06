"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MOCK_MODELS, MOCK_DIAGNOSTICS } from "@/lib/mock-data"
import { Activity, ShieldCheck, Database, Cpu, BrainCircuit, RefreshCw, CheckCircle2, Play } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

export default function AdminPage() {
  const [models, setModels] = useState(MOCK_MODELS)
  const [retraining, setRetraining] = useState(false)
  const [retrainLogs, setRetrainLogs] = useState<{ stage: string; status: 'pending' | 'running' | 'completed'; timestamp?: string }[]>([])
  
  const diagnostics = MOCK_DIAGNOSTICS

  const handleActivateModel = (id: string) => {
    setModels(prev => 
      prev.map(m => ({ ...m, isActive: m.id === id }))
    )
  }

  const handleStartRetraining = () => {
    setRetraining(true)
    
    // Set initial logs state
    setRetrainLogs([
      { stage: "Data ingestion & clean", status: 'running' },
      { stage: "SMOTE Target Class balancing", status: 'pending' },
      { stage: "GridSearchCV Hyperparameter Optimization", status: 'pending' },
      { stage: "SHAP attribution array computations", status: 'pending' },
      { stage: "Register model version v1.3.0-xgb", status: 'pending' }
    ])

    // Step-by-step training simulation log timers
    setTimeout(() => {
      setRetrainLogs(prev => [
        { stage: "Data ingestion & clean", status: 'completed', timestamp: "17:05:02" },
        { stage: "SMOTE Target Class balancing", status: 'running' },
        ...prev.slice(2)
      ])
    }, 1200)

    setTimeout(() => {
      setRetrainLogs(prev => [
        prev[0],
        { stage: "SMOTE Target Class balancing", status: 'completed', timestamp: "17:05:05" },
        { stage: "GridSearchCV Hyperparameter Optimization", status: 'running' },
        ...prev.slice(3)
      ])
    }, 2500)

    setTimeout(() => {
      setRetrainLogs(prev => [
        ...prev.slice(0, 2),
        { stage: "GridSearchCV Hyperparameter Optimization", status: 'completed', timestamp: "17:05:15" },
        { stage: "SHAP attribution array computations", status: 'running' },
        prev[4]
      ])
    }, 4500)

    setTimeout(() => {
      setRetrainLogs(prev => [
        ...prev.slice(0, 3),
        { stage: "SHAP attribution array computations", status: 'completed', timestamp: "17:05:22" },
        { stage: "Register model version v1.3.0-xgb", status: 'running' }
      ])
    }, 6000)

    setTimeout(() => {
      setRetrainLogs(prev => [
        ...prev.slice(0, 4),
        { stage: "Register model version v1.3.0-xgb", status: 'completed', timestamp: "17:05:25" }
      ])
      
      // Inject new model version into the registry table
      const newModel = {
        id: "m4",
        version: "v1.3.0-xgb",
        accuracy: 0.9997,
        precision: 0.938,
        recall: 0.881,
        f1Score: 0.908,
        aucRoc: 0.991,
        deployedAt: new Date().toISOString(),
        isActive: false,
        algorithm: "XGBoost Classifier (SMOTE + HPO Optimized)"
      }
      setModels(prev => [newModel, ...prev])
      setRetraining(false)
    }, 7500)
  }

  // format history data for charts
  const cpuChartData = diagnostics.cpu.history.map((usage, idx) => ({ time: `${idx * 10}s`, cpu: usage }))

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Diagnostics & ML Registration</h1>
        <p className="text-sm text-muted">Admin panel to track server infrastructure performance, database telemetry, and manage machine learning versions.</p>
      </div>

      {/* Infrastructure Telemetry Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CPU diagnostic */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">Active CPU Workload</CardTitle>
              <CardDescription>Server core attributions.</CardDescription>
            </div>
            <Cpu className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            <span className="text-3xl font-extrabold text-white block">{diagnostics.cpu.usage}%</span>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cpuChartData}>
                  <Line type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={1.5} dot={false} />
                  <Tooltip contentStyle={{ display: 'none' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Memory Diagnostic */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">RAM Allocation</CardTitle>
              <CardDescription>System memory pool footprint.</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent className="space-y-4">
            <span className="text-3xl font-extrabold text-white block">{diagnostics.memory.usage}%</span>
            <div className="text-xs text-muted space-y-1 pt-1">
              <div className="flex justify-between">
                <span>Allocated Memory</span>
                <span className="text-white">7.68 GB</span>
              </div>
              <div className="flex justify-between">
                <span>Total Pool limit</span>
                <span className="text-white">{diagnostics.memory.limit} GB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Diagnostic */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">PostgreSQL Pools</CardTitle>
              <CardDescription>Relational connection metrics.</CardDescription>
            </div>
            <Database className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent className="space-y-4">
            <span className="text-3xl font-extrabold text-white block">Healthy</span>
            <div className="text-xs text-muted space-y-1 pt-1">
              <div className="flex justify-between">
                <span>Active Connections</span>
                <span className="text-white">{diagnostics.dbPool.active}</span>
              </div>
              <div className="flex justify-between">
                <span>Idle Pools</span>
                <span className="text-white">{diagnostics.dbPool.idle}</span>
              </div>
              <div className="flex justify-between">
                <span>Pool limit</span>
                <span className="text-white">{diagnostics.dbPool.max}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Model Registry List Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Registry Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Model Version Control</CardTitle>
            <CardDescription>Manage available models, compare validation performance, and change active inference engine version.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted uppercase font-semibold text-[10px] tracking-wider bg-white/1">
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-4">Algorithm Model</th>
                  <th className="py-3.5 px-4 text-center">F1-Score</th>
                  <th className="py-3.5 px-4 text-center">PR AUC</th>
                  <th className="py-3.5 px-4 text-center">Active Status</th>
                  <th className="py-3.5 px-4 text-right">Inference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {models.map((model) => (
                  <tr key={model.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-300">{model.version}</td>
                    <td className="py-3.5 px-4 text-muted">{model.algorithm}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold">{model.f1Score.toFixed(3)}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold">{model.aucRoc.toFixed(3)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${model.isActive ? 'bg-success/10 text-success' : 'bg-[#09090b] text-muted'}`}>
                        {model.isActive ? "Active" : "Standby"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!model.isActive && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => handleActivateModel(model.id)}
                          className="text-[10px] h-7 px-2"
                        >
                          Activate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Retraining panel */}
        <Card>
          <CardHeader>
            <CardTitle>Automatic Pipeline Retrainer</CardTitle>
            <CardDescription>Trigger retrain runs on latest database updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {retrainLogs.length === 0 && !retraining && (
              <div className="text-center py-6 border border-border bg-[#09090b]/40 rounded-lg space-y-3">
                <BrainCircuit className="h-8 w-8 text-muted mx-auto stroke-zinc-700" />
                <p className="text-xs text-muted max-w-[200px] mx-auto leading-relaxed">Continuous training pipeline inactive. Trigger retraining manually below.</p>
                <Button onClick={handleStartRetraining} size="sm" className="text-xs gap-1.5 w-auto">
                  <Play className="h-3.5 w-3.5" />
                  Retrain Model Pipeline
                </Button>
              </div>
            )}

            {/* Retraining log console list */}
            {retrainLogs.length > 0 && (
              <div className="space-y-4">
                <div className="p-3 border border-border bg-[#09090b]/80 rounded-lg space-y-2">
                  <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Training Console Output</span>
                  <div className="space-y-2 font-mono text-[10px] max-h-[200px] overflow-y-auto pr-1">
                    {retrainLogs.map((log, idx) => (
                      <div key={idx} className="flex justify-between items-center text-zinc-300">
                        <span className="flex items-center gap-1.5 truncate">
                          {log.status === 'completed' && <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />}
                          {log.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping shrink-0" />}
                          {log.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />}
                          <span className={log.status === 'running' ? 'text-primary font-bold' : ''}>{log.stage}</span>
                        </span>
                        <span className="text-[9px] text-muted shrink-0">
                          {log.status === 'completed' ? `[OK ${log.timestamp}]` : log.status === 'running' ? "[RUNNING]" : "[PENDING]"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {!retraining && (
                  <Button variant="secondary" onClick={() => setRetrainLogs([])} className="text-xs w-full">
                    Reset Console Panel
                  </Button>
                )}
              </div>
            )}

          </CardContent>
        </Card>

      </div>

    </div>
  )
}
