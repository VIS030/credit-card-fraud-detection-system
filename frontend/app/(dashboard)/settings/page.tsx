"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import type { UserProfile } from "@/lib/types"

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    ApiClient.getProfile()
      .then((user) => {
        if (!mounted) return
        setProfile(user)
        setName(user.full_name || "")
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Could not load profile.")
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const updated = await ApiClient.updateProfile(name)
      setProfile(updated)
      setMessage("Profile name saved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-muted">Account details are loaded from the authenticated profile endpoint.</p>
      </div>

      {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</div>}
      {message && <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-xs text-success">{message}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Security Profile</CardTitle>
          <CardDescription>{loading ? "Loading profile..." : "Signed-in analyst account"}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          <Input label="Registered Email" value={profile?.email || ""} disabled />
          <div>
            <span className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">Role Permission</span>
            <span className="text-sm font-semibold text-white bg-white/5 border border-border p-2.5 rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-accent" />
              {profile?.role || "unknown"}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || loading} className="text-xs">
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classification Threshold</CardTitle>
          <CardDescription>The API currently flags fraud at 50% model probability.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted leading-relaxed">
            This value is enforced server-side (`FRAUD_THRESHOLD`) so the UI cannot silently change stored predictions. To tune it, set the backend environment variable and restart the API.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Access</CardTitle>
          <CardDescription>Programmatic calls use the same JWT issued at login.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted leading-relaxed">
            There is no separate live API-key store in this deployment. Send `Authorization: Bearer &lt;access_token&gt;` to `/api/v1/predict`. Do not put `SECRET_KEY` or database credentials in frontend environment variables.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
