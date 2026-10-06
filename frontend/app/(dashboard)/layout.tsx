"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard"
import { Menu, X, Database, Activity, LogOut, User as UserIcon } from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import type { SystemDiagnostics, UserProfile } from "@/lib/types"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        const profile = await ApiClient.getProfile()
        if (profile?.email) {
          setUser(profile)
          setAuthenticated(true)
          ApiClient.getDiagnostics()
            .then(setDiagnostics)
            .catch(() => undefined)
        } else {
          setAuthenticated(false)
          router.push("/login?reason=unauthenticated")
        }
      } catch {
        setAuthenticated(false)
        router.push("/login?reason=unauthenticated")
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = () => {
    ApiClient.clearTokens()
    router.push("/login")
  }

  if (authenticated === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#030303] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted">Verifying session...</span>
        </div>
      </div>
    )
  }

  const role = user?.role === "admin" ? "admin" : "analyst"

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030303] text-foreground font-sans">
      <div className="hidden md:flex h-full w-64 shrink-0">
        <Sidebar userRole={role} userName={user?.full_name || "Analyst"} userEmail={user?.email || ""} onLogout={handleLogout} />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-64 flex-col bg-[#050507] h-full">
            <div className="absolute right-4 top-4">
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-muted hover:text-foreground hover:bg-white/5 rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar userRole={role} userName={user?.full_name || "Analyst"} userEmail={user?.email || ""} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-[#050507]/60 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-muted hover:text-foreground hover:bg-white/5 rounded-lg md:hidden cursor-pointer">
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-5 text-xs text-muted border-l border-border/80 pl-5">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${diagnostics?.model.status === "healthy" ? "bg-success" : "bg-danger"}`} />
                <span className="font-semibold text-zinc-400">Model: {diagnostics?.model.detail || "checking"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                <span>DB: {diagnostics?.database.status || "checking"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                <span>API: {diagnostics?.overall || "checking"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-[#09090b] text-xs text-zinc-300">
              <UserIcon className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[11px]">{user?.email}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white/5 hover:bg-danger/10 hover:border-danger/30 text-xs font-semibold text-zinc-300 hover:text-danger transition-colors cursor-pointer">
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#030303] to-[#09090c] p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
