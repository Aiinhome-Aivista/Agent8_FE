import { BarChart2, LineChart, Trophy, Brain } from "lucide-react";
import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import { api, useToast, AuthCtx, useAuth, fmt, fmtDate, timeAgo } from "../components/SharedContext";
import { Badge, KpiCard, Spinner, PageLoader, EmptyState, Toast, Sidebar, Topbar, NotifPanel } from "../components/SharedComponents";

// ─── SUPERVISOR DASHBOARD ─────────────────────────────────────────────────────
export function SupervisorDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/dashboard/supervisor").then(r => setData(r.data)).catch(() => { }); }, []);
  if (!data) return <PageLoader />;

  const totalIntents = (data.intent_distribution || []).reduce((s, i) => s + i.cnt, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Chats Today" value={data.today_chats} sub={`${data.week_chats} this week`} />
        <KpiCard label="Open Escalations" value={data.open_escalations} color={data.open_escalations > 0 ? "text-red-600" : "text-green-600"} sub="Needs attention" />
        <KpiCard label="Resolved Today" value={data.resolved_today} color="text-green-600" />
        <KpiCard label="Active Policies" value={fmt(data.active_policies)} sub={`₹${fmt(Math.round((data.total_premium_active || 0) / 100000))}L premium`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Customers" value={fmt(data.total_customers)} />
        <KpiCard label="Renewals Today" value={data.renewals_today} sub={`₹${fmt(Math.round(data.renewal_revenue_today || 0))} revenue`} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="font-semibold text-gray-700 mb-3">Intent Distribution (7 days)</div>
          {(data.intent_distribution || []).map(item => (
            <div key={item.detected_intent} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="capitalize text-gray-600">{(item.detected_intent || "unknown").replace(/_/g, " ")}</span>
                <span className="font-medium text-gray-800">{item.cnt} ({totalIntents ? Math.round(item.cnt / totalIntents * 100) : 0}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalIntents ? item.cnt / totalIntents * 100 : 0}%` }} />
              </div>
            </div>
          ))}
          {(data.intent_distribution || []).length === 0 && <EmptyState icon={BarChart2} title="No chat data yet" />}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="font-semibold text-gray-700 mb-3">Daily Chat Volume</div>
          {(data.daily_volume || []).length === 0 ? <EmptyState icon={LineChart} title="No volume data yet" /> : (
            <div className="flex items-end gap-2 h-32">
              {(data.daily_volume || []).map(d => {
                const max = Math.max(...(data.daily_volume || []).map(x => x.cnt));
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs text-gray-500">{d.cnt}</div>
                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${max ? (d.cnt / max) * 100 : 0}%`, minHeight: "4px" }} />
                    <div className="text-xs text-gray-400 truncate w-full text-center">{new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" })}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="font-semibold text-gray-700 mb-3">Top CSR Performers</div>
        {(data.top_csrs || []).length === 0 ? <EmptyState icon={Trophy} title="No CSR data yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>{["CSR Name", "Assigned", "Resolved", "Resolution Rate"].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr></thead>
              <tbody>{(data.top_csrs || []).map((c, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.ticket_count}</td>
                  <td className="px-4 py-3 text-green-600 font-semibold">{c.resolved}</td>
                  <td className="px-4 py-3">{c.ticket_count ? Math.round(c.resolved / c.ticket_count * 100) : 0}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SUPERVISOR: AI PERFORMANCE ───────────────────────────────────────────────
export function AIPerformancePage() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/dashboard/supervisor").then(r => setData(r.data)); }, []);
  if (!data) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Chat Messages" value={fmt(data.week_chats)} sub="Last 7 days" />
        <KpiCard label="Unique Intents" value={(data.intent_distribution || []).length} />
        <KpiCard label="Escalation Rate" value={data.week_chats ? `${Math.round(data.open_escalations / Math.max(data.week_chats, 1) * 100)}%` : "0%"} />
        <KpiCard label="Top Intent" value={(data.intent_distribution || [])[0]?.detected_intent?.replace(/_/g, " ") || "—"} />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="font-semibold text-gray-700 mb-4">Intent Accuracy & Volume</div>
        <div className="space-y-3">
          {(data.intent_distribution || []).map(item => (
            <div key={item.detected_intent} className="flex items-center gap-3">
              <div className="w-36 text-sm text-gray-600 capitalize truncate">{(item.detected_intent || "").replace(/_/g, " ")}</div>
              <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center pl-2"
                  style={{ width: `${(data.intent_distribution || []).reduce((s, i) => s + i.cnt, 0) ? item.cnt / (data.intent_distribution || []).reduce((s, i) => s + i.cnt, 0) * 100 : 0}%`, minWidth: "2%" }}>
                  <span className="text-white text-xs font-semibold">{item.cnt}</span>
                </div>
              </div>
            </div>
          ))}
          {(data.intent_distribution || []).length === 0 && <EmptyState icon={Brain} title="No intent data yet" />}
        </div>
      </div>
    </div>
  );
}

// ─── SUPERVISOR: ESCALATION MONITOR ──────────────────────────────────────────
export function EscalationMonitor() {
  const [tickets, setTickets] = useState([]);
  useEffect(() => { api.get("/escalations").then(r => setTickets(r.data.escalations || [])); }, []);

  const open = tickets.filter(t => t.status.toLowerCase() === "open");
  const high = tickets.filter(t => (t.priority === "high" || t.priority === "critical") && t.status.toLowerCase() !== "resolved");
  const statusColor = { open: "red", "in-progress": "amber", resolved: "green", closed: "slate" };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total Tickets" value={tickets.length} />
        <KpiCard label="Open" value={open.length} color="text-red-600" />
        <KpiCard label="High Priority" value={high.length} color="text-red-600" />
        <KpiCard label="Resolved" value={tickets.filter(t => t.status.toLowerCase() === "resolved").length} color="text-green-600" />
      </div>
      {open.length > 0 && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">⚠️ {open.length} open ticket{open.length > 1 ? "s" : ""} require{open.length === 1 ? "s" : ""} immediate attention.</div>}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 font-semibold text-gray-700">All Escalations</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{["Ticket ID", "Customer", "Issue", "Priority", "Status", "Assigned To", "Created"].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr></thead>
            <tbody>{tickets.map(t => (
              <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{t.ticket_id}</td>
                <td className="px-4 py-3">{t.customer_name}</td>
                <td className="px-4 py-3 max-w-[180px]"><div className="truncate">{t.issue}</div></td>
                <td className="px-4 py-3"><Badge color={t.priority === "high" || t.priority === "critical" ? "red" : "amber"}>{t.priority}</Badge></td>
                <td className="px-4 py-3"><Badge color={statusColor[t.status.toLowerCase()] || "slate"}>{t.status}</Badge></td>
                <td className="px-4 py-3">{t.assigned_csr_name || <span className="text-gray-400">Unassigned</span>}</td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(t.created_at)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
