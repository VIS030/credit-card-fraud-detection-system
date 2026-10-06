"use client"

import React from "react"
import Link from "next/link"
import { ShieldCheck, ShieldAlert, Cpu, Activity, ArrowRight, Server, Terminal, LineChart, Code } from "lucide-react"
import { motion } from "framer-motion"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-foreground flex flex-col selection:bg-primary/30 relative overflow-hidden">
      
      {/* Background Neon Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-indigo-500/[0.02] blur-[80px] pointer-events-none animate-pulse" />

      {/* Header */}
      <header className="h-20 border-b border-border/40 bg-[#030303]/60 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 glow-primary">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">FraudGuard AI</span>
            <span className="block text-[8px] text-muted uppercase font-bold tracking-widest">Enterprise Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-semibold text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
            Log In
          </Link>
          <Link href="/dashboard" className="text-xs font-semibold bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg shadow-lg shadow-primary/25 transition-all duration-200 active:scale-[0.98] glow-primary flex items-center gap-1.5">
            View Live Demo
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto z-10 relative">
        {/* Banner Pill */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-3 py-1 rounded-full border border-border/80 bg-[#09090b]/80 glass-panel text-[11px] font-mono text-indigo-400 font-semibold mb-6 flex items-center gap-1.5 uppercase tracking-wider"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
          Production-Ready ML Platform (Phase 1 Live)
        </motion.div>

        {/* Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6"
        >
          AI-Powered Real-Time <br />
          <span className="bg-gradient-to-r from-primary via-indigo-400 to-accent bg-clip-text text-transparent">
            Credit Card Fraud Detection
          </span>
        </motion.h1>

        {/* Paragraph */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed mb-10"
        >
          Detect, analyze, and mitigate transaction risks instantly with our state-of-the-art XGBoost classification model. Explain inferences in real-time with detailed local SHAP attribution scores.
        </motion.p>

        {/* Hero CTA buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full"
        >
          <Link 
            href="/dashboard" 
            className="w-full sm:w-auto text-sm font-semibold bg-white hover:bg-zinc-200 text-black px-8 py-3.5 rounded-xl shadow-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Launch Terminal Dashboard
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto text-sm font-semibold border border-border bg-card/40 hover:bg-white/5 text-foreground px-8 py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] glass-panel"
          >
            Sign In with Security Token
          </Link>
        </motion.div>

        {/* Stats overlay */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl border border-border bg-[#09090b]/40 rounded-2xl p-6 glass-panel"
        >
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-bold text-white block">99.94%</span>
            <span className="text-xs text-muted block">Detection Accuracy</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-bold text-white block">&lt; 38ms</span>
            <span className="text-xs text-muted block">API Latency</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-bold text-white block">24/7</span>
            <span className="text-xs text-muted block">Continuous Audit Ingestion</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-bold text-white block">SMOTE</span>
            <span className="text-xs text-muted block">Imbalance Resampling Optimized</span>
          </div>
        </motion.div>
      </section>

      {/* Code Demo Section */}
      <section className="py-20 border-t border-border/40 bg-[#050507]/40 relative z-10">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-primary">
              <Code className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Enterprise Programmatic Integration</h2>
            <p className="text-muted leading-relaxed">
              Generate credentials directly inside the profile settings and integrate our REST prediction model directly into your checkout pipelines. Our JSON schemas provide clean parameter bindings.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-success" />
                <span className="text-sm text-zinc-300">Stateless prediction triggers over secure endpoints</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-success" />
                <span className="text-sm text-zinc-300">Automatic SHAP explainer matrix generation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-success" />
                <span className="text-sm text-zinc-300">Continuous model audit logs mapped to database references</span>
              </div>
            </div>
          </div>

          {/* Interactive JSON Mock Screen */}
          <div className="border border-border rounded-xl overflow-hidden shadow-2xl bg-[#09090c] relative">
            <div className="h-10 border-b border-border bg-[#0c0c10] px-4 flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-danger/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
              </div>
              <span className="text-[10px] text-muted font-mono uppercase tracking-wider">POST /api/v1/predict/single</span>
            </div>
            <div className="p-5 font-mono text-xs text-zinc-300 overflow-x-auto space-y-3">
              <span className="text-zinc-500 block">// Ingestion Request Payload</span>
              <pre className="text-indigo-400">
{`{
  "time": 406.00,
  "amount": 1250.00,
  "pca_features": {
    "V1": -2.312, "V2": 1.952, "V3": -1.610,
    ...
    "V28": 0.184
  }
}`}
              </pre>
              <span className="text-zinc-500 block">// Model Diagnostic Output</span>
              <pre className="text-emerald-400">
{`{
  "id": "tx-uuid-1290",
  "fraud_probability": 0.9650,
  "prediction_class": 1,
  "risk_factors": ["Extreme V14 deviance", "High Amount"],
  "shap_values": { "V14": -0.38, "V17": -0.45, "Amount": 0.28 }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 bg-[#030303] text-center text-xs text-muted z-10">
        <p className="mb-2">FraudGuard AI Compliance Platform. Certified to AICPA SOC 2 standards.</p>
        <p>&copy; {new Date().getFullYear()} FraudGuard Inc. All rights reserved. Created in partnership with Advanced Fintech Laboratories.</p>
      </footer>
    </div>
  )
}
