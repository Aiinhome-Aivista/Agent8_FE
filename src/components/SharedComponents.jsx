import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Home, Bot, Shield, Upload, RefreshCw, Ticket, Bell, MessageSquare, BookOpen, Brain, AlertTriangle, ClipboardList, Siren, Eye, Download, Info, Edit3, CheckCircle, Settings, CreditCard, Megaphone, LogOut, Menu, X } from "lucide-react";

import { api, useToast, AuthCtx, useAuth, fmt, fmtDate, timeAgo } from "./SharedContext";

// ─── Components ───────────────────────────────────────────────────────────────

export function Badge({ children, color = "blue" }) {
  const map = { blue: "bg-blue-100 text-blue-800", green: "bg-green-100 text-green-800", red: "bg-red-100 text-red-800", amber: "bg-amber-100 text-amber-800", purple: "bg-purple-100 text-purple-800", slate: "bg-slate-100 text-slate-600" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[color] || map.slate}`}>{children}</span>;
}

export function KpiCard({ label, value, sub, color = "text-gray-900" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export function Spinner({ size = "md" }) {
  const s = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-10 w-10" : "h-6 w-6";
  return <div className={`${s} border-2 border-blue-600 border-t-transparent rounded-full animate-spin`} />;
}

export function PageLoader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[60vh] gap-3 text-gray-500">
      <Spinner size="lg" />
      <div className="text-sm font-medium animate-pulse">{text}</div>
    </div>
  );
}

export function EmptyState({ icon, title, desc }) {
  const IconComponent = icon || Info;
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 text-slate-300">
        {typeof icon === "string" ? <span className="text-4xl opacity-50">{icon}</span> : <IconComponent size={48} strokeWidth={1.5} className="text-slate-400" />}
      </div>
      <div className="text-gray-800 font-semibold mb-1">{title}</div>
      {desc && <div className="text-sm text-gray-500 max-w-sm">{desc}</div>}
    </div>
  );
}

export function Toast({ toasts, remove }) {
  const colors = { success: "bg-green-700", error: "bg-red-700", info: "bg-blue-700" };
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`${colors[t.type] || colors.info} text-white px-4 py-3 rounded-xl text-sm font-medium shadow-lg flex items-center gap-3 min-w-64 max-w-sm animate-fade-in`}>
          <span className="flex-1">{typeof t.msg === 'object' ? JSON.stringify(t.msg) : t.msg}</span>
          <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export const NAV = {
  customer: [
    { id: "customer-dashboard", label: "Dashboard", icon: Home },
    { id: "customer-ai-assistant", label: "AI Assistant", icon: Bot },
    { id: "customer-policies", label: "My Policies", icon: Shield },
    { id: "customer-documents", label: "My Documents", icon: Upload },
    { id: "customer-policy-renewal", label: "Policy Renewal", icon: RefreshCw },
    { id: "customer-raise-ticket", label: "Raise Ticket", icon: Ticket },
    { id: "customer-notifications", label: "Notifications", icon: Bell }
  ],
  csr: [
    { id: "csr-dashboard", label: "Dashboard", icon: Home },
    { id: "csr-all-tickets", label: "All Tickets", icon: Ticket },
    { id: "csr-conversation-view", label: "Conversation View", icon: MessageSquare },
    { id: "csr-knowledge-base", label: "Knowledge Base", icon: BookOpen },
  ],
  supervisor: [
    { id: "supervisor-dashboard", label: "KPI Dashboard", icon: Home },
    { id: "supervisor-ai-performance", label: "AI Performance", icon: Brain },
    { id: "supervisor-escalation-monitor", label: "Escalation Monitor", icon: AlertTriangle },
    { id: "supervisor-all-tickets", label: "Manage Tickets", icon: Ticket },
    { id: "supervisor-conversation-view", label: "Conversation View", icon: MessageSquare },
  ],
  compliance: [
    { id: "compliance-hub", label: "Compliance Hub", icon: Home },
    { id: "compliance-audit-logs", label: "Audit Logs", icon: ClipboardList },
    { id: "compliance-guardrail-alerts", label: "Guardrail Alerts", icon: Siren },
    { id: "compliance-sensitive-actions", label: "Sensitive Actions", icon: Eye },
    { id: "compliance-export-reports", label: "Export Reports", icon: Download },
  ],
};

export function Sidebar({ page, setPage, user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const nav = NAV[user?.role] || [];
  const initials = user?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U";
  return (
    <aside className={`${collapsed ? "w-[72px]" : "w-56"} bg-slate-900 flex flex-col flex-shrink-0 h-full transition-all duration-300`}>
      <div className={`p-4 border-b border-slate-700/60 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">I</div>
            <div className="font-bold text-slate-100 whitespace-nowrap">InsureAI</div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white leading-none flex-shrink-0" title="Toggle Sidebar">
          <Menu size={20} />
        </button>
      </div>
      <div className={`p-3 border-b border-slate-700/60 flex items-center ${collapsed ? "justify-center" : "gap-2.5"}`}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0" title={collapsed ? user?.name : ""}>{initials}</div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {nav.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} title={collapsed ? item.label : ""}
            className={`w-full text-left flex items-center ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2"} rounded-lg text-sm font-medium transition-colors ${page === item.id ? "bg-blue-600/25 text-blue-300" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
            <item.icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-700/60">
        <button onClick={onLogout} title={collapsed ? "Sign Out" : ""} className={`w-full flex items-center ${collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"} text-slate-400 hover:text-red-400 text-sm rounded-lg hover:bg-slate-800 transition-colors`}>
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

export function Topbar({ title, unread = 0, onNotif }) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0">
      <div className="font-semibold text-gray-800">{title}</div>
      <div className="flex items-center gap-2">
        <button onClick={onNotif} className="relative w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
          <Bell size={20} />
          {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
        </button>
      </div>
    </div>
  );
}

// ─── NOTIFICATION PANEL ───────────────────────────────────────────────────────
export function NotifPanel({ onClose }) {
  const [notifs, setNotifs] = useState([]);
  useEffect(() => { api.get("/notifications").then(r => setNotifs(r.data.notifications?.slice(0, 8) || [])).catch(() => { }); }, []);
  const typeIcon = { renewal: RefreshCw, escalation: Ticket, update: Edit3, claim: CheckCircle, system: Settings, payment: CreditCard };
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-14 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="font-semibold text-gray-800">Notifications</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        {notifs.map(n => {
          const IconCmp = typeIcon[n.type] || Megaphone;
          return (
          <div key={n.id} className={`flex gap-3 p-3 border-b border-gray-50 ${n.status === "unread" ? "bg-blue-50/50" : ""}`}>
            <IconCmp size={18} className="text-gray-500 mt-0.5" />
            <div>
              <div className={`text-xs ${n.status === "unread" ? "font-semibold text-gray-800" : "text-gray-600"}`}>{n.message}</div>
              <div className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</div>
            </div>
          </div>
          )
        })}
        {notifs.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>}
      </div>
    </div>
  );
}
