"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  BarChart3, 
  SearchCode, 
  UploadCloud, 
  History, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  ShieldCheck,
  User
} from "lucide-react"

interface SidebarProps {
  userRole?: 'analyst' | 'admin';
  userName?: string;
  userEmail?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole = 'admin',
  userName = "Senior Analyst",
  userEmail = "analyst@fraudguard.ai"
}) => {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Single Predict", href: "/predict", icon: SearchCode },
    { label: "Bulk CSV Predict", href: "/bulk", icon: UploadCloud },
    { label: "Prediction History", href: "/history", icon: History },
    { label: "Settings", href: "/settings", icon: Settings },
  ]

  const handleLogout = () => {
    // Phase 1 Redirect mock
    router.push("/login")
  }

  return (
    <aside className="w-64 border-r border-border bg-[#050507] flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border/50 gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 glow-primary">
          <ShieldAlert className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <span className="font-semibold text-sm bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">FraudGuard AI</span>
          <span className="block text-[9px] text-muted uppercase font-bold tracking-wider">Enterprise v1.2</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <span className="px-3 text-[10px] uppercase tracking-widest text-muted font-bold block mb-3">General Control</span>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" 
                  : "text-muted hover:text-foreground hover:bg-white/5"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted group-hover:text-foreground")} />
              {item.label}
              {isActive && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          )
        })}

        {/* Admin Navigation */}
        {userRole === 'admin' && (
          <div className="pt-6 space-y-1.5">
            <span className="px-3 text-[10px] uppercase tracking-widest text-muted font-bold block mb-3">Administration</span>
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group relative",
                pathname === "/admin" 
                  ? "bg-accent/10 text-accent font-medium border-l-2 border-accent" 
                  : "text-muted hover:text-foreground hover:bg-white/5"
              )}
            >
              <ShieldCheck className={cn("h-4 w-4 shrink-0 transition-colors", pathname === "/admin" ? "text-accent" : "text-muted group-hover:text-foreground")} />
              System Diagnostics
              {pathname === "/admin" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              )}
            </Link>
          </div>
        )}
      </nav>

      {/* User Footer Context */}
      <div className="p-4 border-t border-border/50 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center border border-border">
            <User className="h-4.5 w-4.5 text-zinc-300" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{userName}</p>
            <p className="text-[10px] text-muted truncate">{userEmail}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-all duration-200 cursor-pointer font-medium"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
export default Sidebar;
