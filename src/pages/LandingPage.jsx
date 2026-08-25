import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import {
  api,
  useToast,
  AuthCtx,
  useAuth,
  fmt,
  fmtDate,
  timeAgo,
} from "../components/SharedContext";
import {
  Badge,
  KpiCard,
  Spinner,
  EmptyState,
  Toast,
  Sidebar,
  Topbar,
  NotifPanel,
} from "../components/SharedComponents";

// ─── LANDING PAGE ──────────────────────────────────────────────────────────────
export function LandingPage({ onNavigateToLogin }) {
  const roles = [
    {
      label: "Customer Portal",
      email: "soniakhatun9786@gmail.com",
      icon: "👤",
      desc: "Access AI chat assistant, policy renewals, smart document upload, and raise tickets.",
    },
    {
      label: "CSR Agent Workspace",
      email: "rohan.developer2001@gmail.com",
      icon: "🎧",
      desc: "Manage tickets, live chat with customers, and review RAG-suggested solutions.",
    },
    {
      label: "Supervisor Hub",
      email: "soniaagent234@gmail.com",
      icon: "📊",
      desc: "Monitor team metrics, track escalations, audit AI performance, and set rules.",
    },
    {
      label: "Compliance & Safety",
      email: "compliance@test.com",
      icon: "🔒",
      desc: "Inspect detailed audit logs, track LLM guardrail violations, and export reports.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#666666] font-sans relative overflow-x-hidden selection:bg-[#FF5A14] selection:text-white">
      {/* Decorative Light Globs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FFF7F2] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#FF8A55]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-[#FFF7F2] rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#D8D8D8] bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigateToLogin()}>
            <div className="w-10 h-10 rounded-xl bg-[#FF5A14] flex items-center justify-center font-bold text-white text-lg shadow-md shadow-[#FF5A14]/30">
              I
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] bg-clip-text text-transparent tracking-tight">
              InsureAI Pro
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#666666]">
            <a href="#features" className="hover:text-[#FF5A14] transition-colors">
              Features
            </a>
            <a href="#roles" className="hover:text-[#FF5A14] transition-colors">
              Workspaces
            </a>
            <a href="#stats" className="hover:text-[#FF5A14] transition-colors">
              Impact
            </a>
            <a href="#security" className="hover:text-[#FF5A14] transition-colors">
              Trust & Security
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigateToLogin()}
              className="bg-[#FF7A45] hover:bg-[#F56B2F] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md shadow-[#FF5A14]/20"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#4A4A4A] mb-6 max-w-4xl mx-auto leading-tight">
          The Future of Enterprise Insurance. <br />
          <span className="bg-gradient-to-r from-[#FF5A14] via-[#FF7A45] to-[#F56B2F] bg-clip-text text-transparent">
            Driven by Agentic AI.
          </span>
        </h1>
        <p className="text-lg text-[#666666] max-w-2xl mx-auto mb-10 leading-relaxed">
          InsureAI Pro integrates agentic AI chatbots, dynamic claim parsing,
          compliance monitoring, and supervisor analytics into a secure unified
          platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button
            onClick={() => onNavigateToLogin()}
            className="w-full sm:w-auto bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-[#FF5A14]/25 transition-all hover:scale-[1.02] cursor-pointer"
          >
            Access Portal
          </button>
          <a
            href="#roles"
            className="w-full sm:w-auto border border-[#D8D8D8] hover:border-[#FF8A55] bg-[#FFF7F2] text-[#666666] hover:text-[#FF5A14] font-semibold px-8 py-3.5 rounded-xl transition-all hover:scale-[1.02] inline-block"
          >
            Quick Onboarding Roles ↓
          </a>
        </div>

        {/* Dashboard Mockup Showcase */}
        <div className="relative mx-auto max-w-5xl rounded-2xl border border-[#D8D8D8] bg-white p-3 sm:p-4 shadow-2xl shadow-[#FF5A14]/10 overflow-hidden group">
          <div className="flex items-center gap-2 pb-3 px-2 border-b border-[#D8D8D8] text-xs">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 font-mono text-[#888888]">
              insureai-pro-app://workspace/customer-chat
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 min-h-[350px] text-left text-xs text-[#666666] pt-3 gap-4">
            {/* Sidebar Simulation */}
            <div className="border-r border-[#D8D8D8] pr-4 space-y-3 hidden md:block bg-[#4A4A4A] text-white p-3 rounded-xl">
              <div className="p-2 bg-[#5A5A5A] rounded-lg flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#FF5A14] flex items-center justify-center font-bold text-white text-[10px]">
                  AI
                </div>
                <div>
                  <div className="font-bold text-white">
                    InsureAI Assistant
                  </div>
                  <div className="text-[9px] text-[#FF8A55]">RAG Enabled</div>
                </div>
              </div>
              <div className="space-y-1">
                {[
                  "🏠 Dashboard",
                  "🤖 AI Assistant",
                  "🛡️ My Policies",
                  "🔄 Renewal Hub",
                  "✏️ Endorsement Center",
                  "📤 Upload Documents",
                ].map((it, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg font-medium transition-colors ${idx === 1 ? "bg-[#FF5A14] text-white" : "hover:bg-[#5A5A5A] text-[#D8D8D8]"}`}
                  >
                    {it}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Chat Simulation */}
            <div className="md:col-span-2 flex flex-col justify-between h-full p-3 bg-[#FFF7F2] rounded-xl border border-[#FF8A55]/30">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FF5A14] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    AI
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#D8D8D8] rounded-tl-none max-w-[85%] text-[#666666] shadow-sm">
                    Hello! I'm your RAG-enabled insurance copilot. I can see
                    your motor policy expiring in 12 days. Would you like to
                    renew it now?
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="bg-[#FF7A45] text-white p-2.5 rounded-xl rounded-tr-none max-w-[85%] shadow-sm">
                    Yes please, and can I pay using UPI?
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#4A4A4A] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    ME
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FF5A14] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    AI
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#D8D8D8] rounded-tl-none max-w-[85%] text-[#666666] shadow-sm">
                    <span className="inline-block text-[9px] text-[#FF5A14] bg-[#FFF7F2] border border-[#FF8A55]/40 px-1.5 py-0.5 rounded-full mb-1 font-mono">
                      🧠 intent: renewal · confidence: 99%
                    </span>
                    <br />
                    Perfect. Premium is ₹14,250. Click below to complete payment
                    instantly!
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-[#D8D8D8] flex gap-2">
                <div className="flex-1 bg-white border border-[#D8D8D8] rounded-lg px-3 py-1.5 text-[#B0B0B0]">
                  Ask about coverage, claims, or updates...
                </div>
                <button className="bg-[#FF7A45] text-white px-4 py-1.5 rounded-lg font-bold shadow-sm">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Quick Onboarding Role Selectors */}
      <section
        id="roles"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D8D8D8] relative bg-[#FFF7F2]/50"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-[#4A4A4A] sm:text-4xl">
            Experience Unified Workspace Roles
          </h2>
          <p className="mt-4 text-[#666666] max-w-2xl mx-auto">
            InsureAI Pro integrates distinct workspaces customized for each
            role. Click a workspace below to auto-fill credentials and sign
            in instantly!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((r, i) => (
            <div
              key={i}
              onClick={() => onNavigateToLogin(r.email)}
              className="group flex flex-col justify-between p-6 rounded-2xl border border-[#D8D8D8] bg-white hover:border-[#FF8A55] hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1.5"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#FFF7F2] border border-[#FF8A55]/30 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {r.icon}
                </div>
                <h3 className="text-lg font-bold text-[#4A4A4A] mb-2 group-hover:text-[#FF5A14] transition-colors">
                  {r.label}
                </h3>
                <p className="text-sm text-[#666666] leading-relaxed mb-6">
                  {r.desc}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#FF5A14] mt-2">
                <span>Quick Sign In →</span>
                <span className="text-[#888888] font-mono group-hover:text-[#666666]">
                  {r.email}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Features Grid */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D8D8D8]"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-[#4A4A4A] sm:text-4xl">
            State-of-the-Art Core Features
          </h2>
          <p className="mt-4 text-[#666666] max-w-2xl mx-auto">
            Supercharge your insurance management lifecycle with fully
            integrated LLM agent workflows, guardrail protections, and
            analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "RAG Document Parsing",
              icon: "📚",
              text: "Upload dynamic policies or medical claims. Our Retrieval-Augmented Generation extracts deductibles, coverage rules, and policy status instantly.",
            },
            {
              title: "LLM Guardrails & Compliance",
              icon: "🚨",
              text: "Every user interaction is strictly monitored in real-time. Automated sensitive actions trigger instant compliance safety warnings and audits.",
            },
            {
              title: "Direct UPI Policy Renewals",
              icon: "🔄",
              text: "Check expiry dates and renew policies in 3 taps. Select payment methods including UPI and generate certified PDFs instantly.",
            },
          ].map((f, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-[#D8D8D8] bg-white hover:border-[#FF8A55] hover:shadow-lg transition-all group"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-[#4A4A4A] mb-2 group-hover:text-[#FF5A14] transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-[#666666] leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Banner */}
      <section
        id="stats"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#D8D8D8]"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-[#FFF7F2] rounded-3xl p-8 border border-[#FF8A55]/30 text-center shadow-sm">
          {[
            { val: "99.8%", label: "Intent Classification Accuracy" },
            { val: "< 2s", label: "Average Response Latency" },
            { val: "₹150M+", label: "Active Coverage Handled" },
            { val: "100%", label: "Guardrail Violations Logged" },
          ].map((st, i) => (
            <div key={i}>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#FF5A14]">
                {st.val}
              </div>
              <div className="text-xs text-[#888888] font-semibold uppercase mt-2 tracking-wider">
                {st.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise Security Section */}
      <section
        id="security"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D8D8D8]"
      >
        <div className="bg-gradient-to-br from-[#FFF7F2] to-white rounded-3xl border border-[#FF8A55]/30 p-8 sm:p-12 shadow-md flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <Badge color="blue">Enterprise Grade Security</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4A4A4A]">
              Protected by SafeGuard LLM Shield
            </h2>
            <p className="text-sm sm:text-base text-[#666666] leading-relaxed">
              Every customer conversation is automatically processed through
              strict compliance guardrails to check for sensitive information
              leaks (like PII data), inappropriate questions, and unauthorized
              policy changes. Supervisors get notified immediately of any
              anomalies.
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center justify-center p-6 bg-white border border-[#D8D8D8] rounded-2xl w-full md:w-auto shadow-sm">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#FF5A14] font-semibold">
                <span className="text-base">🛡️</span> PII Leak Protection Active
              </div>
              <div className="flex items-center gap-2 text-[#FF5A14] font-semibold">
                <span className="text-base">🛡️</span> Guardrail Compliance Verified
              </div>
              <div className="flex items-center gap-2 text-[#FF5A14] font-semibold">
                <span className="text-base">🛡️</span> Real-time Audit Trail Enabled
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D8D8D8] bg-[#4A4A4A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[#D8D8D8]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF5A14] flex items-center justify-center font-bold text-white text-sm shadow-md">
              I
            </div>
            <span className="font-bold text-white">InsureAI Pro</span>
          </div>
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} InsureAI Pro Enterprise. All rights
            reserved.
          </p>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#roles" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
