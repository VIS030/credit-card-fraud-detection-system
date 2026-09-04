"use client"

import React, { useState } from "react"
import { Sidebar } from "@/components/dashboard"
import { Menu, X, ShieldAlert, Cpu, Database, Activity } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030303] text-foreground font-sans">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-64 shrink-0">
        <Sidebar userRole="admin" />
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-64 flex-col bg-[#050507] h-full animate-in slide-in-from-left duration-200">
            <div className="absolute right-4 top-4">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-muted hover:text-foreground hover:bg-white/5 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar userRole="admin" />
          </div>
        </div>
      )}

      {/* Content panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-border bg-[#050507]/60 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-muted hover:text-foreground hover:bg-white/5 rounded-lg md:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Environment Telemetry */}
            <div className="hidden sm:flex items-center gap-5 text-xs text-muted border-l border-border/80 pl-5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="font-semibold text-zinc-400">Model: v1.2.0-xgb (Active)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" />
                <span>CPU: 22%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                <span>DB Pool: Healthy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                <span>Latency: 38ms</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded bg-[#09090b] border border-border text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
              Evaluation Mode
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#030303] to-[#09090c] p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
