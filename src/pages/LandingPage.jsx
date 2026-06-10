import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import { api, useToast, AuthCtx, useAuth, fmt, fmtDate, timeAgo } from "../components/SharedContext";
import { Badge, KpiCard, Spinner, EmptyState, Toast, Sidebar, Topbar, NotifPanel } from "../components/SharedComponents";

// ─── LANDING PAGE ──────────────────────────────────────────────────────────────
export function LandingPage({ onNavigateToLogin }) {
  const roles = [
    { label: "Customer Portal", email: "sumankhamrai.98@gmail.com", icon: "👤", desc: "Access AI chat assistant, policy renewals, smart document upload, and raise tickets.", color: "from-blue-600/20 to-cyan-600/20 hover:border-blue-500/50" },
    { label: "CSR Agent Workspace", email: "sonia19khatun98@gmail.com", icon: "🎧", desc: "Manage tickets, live chat with customers, and review RAG-suggested solutions.", color: "from-purple-600/20 to-pink-600/20 hover:border-purple-500/50" },
    { label: "Supervisor Hub", email: "soniaagent234@gmail.com", icon: "📊", desc: "Monitor team metrics, track escalations, audit AI performance, and set rules.", color: "from-amber-600/20 to-orange-600/20 hover:border-amber-500/50" },
    { label: "Compliance & Safety", email: "compliance@test.com", icon: "🔒", desc: "Inspect detailed audit logs, track LLM guardrail violations, and export reports.", color: "from-emerald-600/20 to-teal-600/20 hover:border-emerald-500/50" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-500/20">I</div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">InsureAI Pro</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#roles" className="hover:text-white transition-colors">Workspaces</a>
            <a href="#stats" className="hover:text-white transition-colors">Impact</a>
            <a href="#security" className="hover:text-white transition-colors">Trust & Security</a>
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigateToLogin()} className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-white rounded-lg group bg-gradient-to-br from-blue-600 to-teal-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-800 transition-all cursor-pointer">
              <span className="relative px-5 py-2 transition-all ease-in duration-75 bg-slate-950 rounded-md group-hover:bg-opacity-0 font-semibold">
                Sign In
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-xs font-semibold mb-6 animate-pulse">
          ✨ Introducing GPT-4o Powered Document Parsing & Guardrails
        </div> */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-tight">
          The Future of Enterprise Insurance. <br />
          <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Driven by Agentic AI.</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          InsureAI Pro integrates agentic AI chatbots, dynamic claim parsing, compliance monitoring, and supervisor analytics into a secure unified platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button onClick={() => onNavigateToLogin()} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] cursor-pointer">
            Access Portal
          </button>
          <a href="#roles" className="w-full sm:w-auto border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 text-slate-300 font-semibold px-8 py-3.5 rounded-xl transition-all hover:scale-[1.02] inline-block">
            Quick Onboarding Roles ↓
          </a>
        </div>

        {/* Dashboard Mockup Showcase (Visual Wow Factor!) */}
        <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4 backdrop-blur-md shadow-2xl shadow-blue-500/5 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="flex items-center gap-2 pb-3 px-2 border-b border-slate-800 text-slate-600 text-xs">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-2 font-mono text-slate-500">insureai-pro-app://workspace/customer-chat</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 min-h-[350px] text-left text-xs text-slate-400 pt-3 gap-4">
            {/* Sidebar Simulation */}
            <div className="border-r border-slate-800/50 pr-4 space-y-3 hidden md:block">
              <div className="p-2 bg-slate-800/40 rounded-lg flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-[10px]">AI</div>
                <div>
                  <div className="font-bold text-slate-200">InsureAI Assistant</div>
                  <div className="text-[9px] text-teal-400">RAG Enabled</div>
                </div>
              </div>
              <div className="space-y-1">
                {["🏠 Dashboard", "🤖 AI Assistant", "🛡️ My Policies", "🔄 Renewal Hub", "✏️ Endorsement Center", "📤 Upload Documents"].map((it, idx) => (
                  <div key={idx} className={`p-2 rounded-lg font-medium transition-colors ${idx === 1 ? "bg-blue-600/20 text-blue-300 border border-blue-500/20" : "hover:bg-slate-800/30"}`}>
                    {it}
                  </div>
                ))}
              </div>
            </div>
            {/* Main Chat Simulation */}
            <div className="md:col-span-2 flex flex-col justify-between h-full p-2 bg-slate-950/40 rounded-xl border border-slate-800/30">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white">AI</div>
                  <div className="bg-slate-800/50 p-2.5 rounded-xl rounded-tl-none max-w-[85%] text-slate-300">
                    Hello! I'm your RAG-enabled insurance copilot. I can see your motor policy expiring in 12 days. Would you like to renew it now?
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="bg-blue-600/90 text-white p-2.5 rounded-xl rounded-tr-none max-w-[85%]">
                    Yes please, and can I pay using UPI?
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">ME</div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white">AI</div>
                  <div className="bg-slate-800/50 p-2.5 rounded-xl rounded-tl-none max-w-[85%] text-slate-300">
                    <span className="inline-block text-[9px] text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded-full mb-1">🧠 intent: renewal · confidence: 99%</span>
                    <br />
                    Perfect. Premium is ₹14,250. Click below to complete payment instantly!
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-800/50 flex gap-2">
                <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-500">Ask about coverage, claims, or updates...</div>
                <button className="bg-blue-600 text-white px-3 rounded-lg font-bold">Send</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Quick Onboarding Role Selectors (Slick interaction!) */}
      <section id="roles" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent pointer-events-none" />
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Experience the Unified Platform Roles
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            InsureAI Pro integrates distinct workspaces customized for each role. Click a workspace below to auto-fill the credentials and sign in instantly!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((r, i) => (
            <div key={i} onClick={() => onNavigateToLogin(r.email)}
              className={`group flex flex-col justify-between p-6 rounded-2xl border border-slate-900 bg-gradient-to-b ${r.color} transition-all duration-305 cursor-pointer hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/5`}>
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">{r.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{r.label}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">{r.desc}</p>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-blue-400 mt-2">
                <span>Quick Sign In →</span>
                <span className="text-slate-500 font-mono group-hover:text-slate-400">{r.email}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            State-of-the-Art Core Features
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Supercharge your insurance management lifecycle with fully integrated LLM agent workflows, guardrail protections, and analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "RAG Document Parsing", icon: "📚", text: "Upload dynamic policies or medical claims. Our Retrieval-Augmented Generation extracts deductibles, coverage rules, and policy status instantly." },
            { title: "LLM Guardrails & Compliance", icon: "🚨", text: "Every user interaction is strictly monitored in real-time. Automated sensitive actions trigger instant compliance safety warnings and audits." },
            { title: "Direct UPI Policy Renewals", icon: "🔄", text: "Check expiry dates and renew policies in 3 taps. Select payment methods including UPI and generate certified PDFs instantly." }
          ].map((f, idx) => (
            <div key={idx} className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 hover:border-slate-800 transition-all group">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Banner */}
      <section id="stats" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-900/40 rounded-3xl p-8 border border-slate-900 backdrop-blur-sm text-center">
          {[
            { val: "99.8%", label: "Intent Classification Accuracy" },
            { val: "< 2s", label: "Average Response Latency" },
            { val: "₹150M+", label: "Active Coverage Handled" },
            { val: "100%", label: "Guardrail Violations Logged" }
          ].map((st, i) => (
            <div key={i}>
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">{st.val}</div>
              <div className="text-xs text-slate-500 font-semibold uppercase mt-2 tracking-wider">{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise Security Section */}
      <section id="security" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900">
        <div className="bg-gradient-to-br from-slate-900 to-blue-950/40 rounded-3xl border border-slate-850 p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <Badge color="blue">Enterprise Grade Security</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Protected by SafeGuard LLM Shield</h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Every customer conversation is automatically processed through strict compliance guardrails to check for sensitive information leaks (like PII data), inappropriate questions, and unauthorized policy changes. Supervisors get notified immediately of any anomalies.
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center justify-center p-6 bg-slate-950/80 border border-slate-800 rounded-2xl w-full md:w-auto">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-green-400 font-semibold"><span className="text-base">🛡️</span> PII Leak Protection Active</div>
              <div className="flex items-center gap-2 text-green-400 font-semibold"><span className="text-base">🛡️</span> Guardrail Compliance Verified</div>
              <div className="flex items-center gap-2 text-green-400 font-semibold"><span className="text-base">🛡️</span> Real-time Audit Trail Enabled</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center font-bold text-white text-sm shadow-md">I</div>
            <span className="font-bold text-slate-300">InsureAI Pro</span>
          </div>
          <p className="text-center md:text-left">© {new Date().getFullYear()} InsureAI Pro Enterprise. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#roles" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
