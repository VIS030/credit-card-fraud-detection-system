"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldAlert, ArrowRight, Loader2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiClient } from "@/lib/api-client"

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await ApiClient.register({ email, password, full_name: fullName || "Analyst" })
      await ApiClient.login({ email, password })
      router.push("/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030303] text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="w-full max-w-md z-10">
        <Card className="glass-panel border-border/80">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="mx-auto h-10 w-10 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 glow-primary">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-xl font-bold tracking-tight">Create Analyst Account</CardTitle>
              <CardDescription className="text-xs text-muted">Password must be at least 8 characters. Duplicate emails are rejected.</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && <div className="p-3 rounded-lg border border-danger/20 bg-danger/5 text-xs text-danger font-medium">{error}</div>}
              <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} placeholder="Analyst" />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required minLength={8} />
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full h-11 flex justify-center items-center gap-2 text-sm font-semibold" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Register <ArrowRight className="h-4 w-4" /></>}
              </Button>
              <Link href="/login" className="text-xs text-muted hover:text-foreground">Already have an account? Log in</Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
