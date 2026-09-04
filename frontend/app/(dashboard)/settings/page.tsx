"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sliders, Key, ShieldCheck, Mail, User, Trash2, Copy, Check } from "lucide-react"

export default function SettingsPage() {
  const [name, setName] = useState("Senior Analyst")
  const [email, setEmail] = useState("analyst@fraudguard.ai")
  const [threshold, setThreshold] = useState(0.50)
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key: string; created: string }[]>([
    { id: "key-1", name: "Checkout API Core", key: "fg_live_df3a75a74e50882e3", created: "2026-07-05" }
  ])
  const [newKeyName, setNewKeyName] = useState("")
  const [copiedId, setCopiedId] = useState("")

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return

    const newKey = {
      id: `key-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: newKeyName,
      key: `fg_live_${Math.random().toString(16).substr(2, 16)}`,
      created: new Date().toISOString().split('T')[0]
    }

    setApiKeys([...apiKeys, newKey])
    setNewKeyName("")
  }

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id))
  }

  const handleCopyKey = (id: string, keyStr: string) => {
    navigator.clipboard.writeText(keyStr)
    setCopiedId(id)
    setTimeout(() => setCopiedId(""), 1500)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Settings & Configurations</h1>
        <p className="text-sm text-muted">Adjust system detection rules, model thresholds, profiles, and API access credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Profile Card & Detection rules */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Security Profile</CardTitle>
              <CardDescription>Review analyst credentials and system level access profiles.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Registered Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
              <div>
                <span className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">Role Permission</span>
                <span className="text-sm font-semibold text-white bg-white/5 border border-border p-2.5 rounded-lg flex items-center gap-1.5">
                  <ShieldCheck className="h-4.5 w-4.5 text-accent" />
                  System Administrator (Admin Role)
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => alert("Settings configuration saved successfully.")} className="text-xs">
                Save Profile Adjustments
              </Button>
            </CardFooter>
          </Card>

          {/* Model Rules Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Inference Decisions Threshold</CardTitle>
              <CardDescription>Determine the sensitivity of the active model scoring algorithm.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-zinc-300 font-semibold">Active Classification Threshold</span>
                  <span className="text-xl font-bold font-mono text-primary">{(threshold * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted leading-relaxed">
                  Transactions scoring above this percentage value are automatically flagged as Class 1 (Fraudulent). Decreasing this value captures more fraud but may elevate false-positive rates.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* API Credentials Management */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Programmatic Integration</CardTitle>
              <CardDescription>Generate API authentication tokens for webhook ingestion triggers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* API Key list */}
              {apiKeys.length === 0 ? (
                <p className="text-xs text-muted text-center py-6">No API keys registered yet.</p>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((k) => (
                    <div key={k.id} className="p-3 border border-border bg-[#09090b]/40 rounded-lg flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <span className="font-semibold text-white block truncate">{k.name}</span>
                        <span className="font-mono text-muted text-[10px] block truncate mt-0.5">{k.key}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleCopyKey(k.id, k.key)}
                          className="p-1.5 text-muted hover:text-foreground hover:bg-white/5 rounded transition-colors cursor-pointer"
                        >
                          {copiedId === k.id ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Generate form */}
              <form onSubmit={handleGenerateKey} className="pt-4 border-t border-border/50 space-y-3">
                <Input
                  label="API Key Descriptor"
                  placeholder="e.g. Payment Gateway Production"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="h-9 text-xs"
                />
                <Button type="submit" size="sm" className="w-full text-xs gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  Generate Token Credentials
                </Button>
              </form>

            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  )
}
