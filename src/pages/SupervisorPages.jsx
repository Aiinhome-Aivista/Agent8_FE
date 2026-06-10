import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import { api, useToast, AuthCtx, useAuth, fmt, fmtDate, timeAgo } from "../components/SharedContext";
import { Badge, KpiCard, Spinner, EmptyState, Toast, Sidebar, Topbar, NotifPanel } from "../components/SharedComponents";

// ─── SUPERVISOR DASHBOARD ─────────────────────────────────────────────────────
export function SupervisorDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/dashboard/supervisor").then(r => setData(r.data)).catch(() => { }); }, []);
  if (!data) return <div className="flex items-center justify-center h-[60vh]"><Spinner size="lg" /></div>;

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
          {(data.intent_distribution || []).length === 0 && <EmptyState icon="📊" title="No chat data yet" />}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="font-semibold text-gray-700 mb-3">Daily Chat Volume</div>
          {(data.daily_volume || []).length === 0 ? <EmptyState icon="📈" title="No volume data yet" /> : (
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
        {(data.top_csrs || []).length === 0 ? <EmptyState icon="🏆" title="No CSR data yet" /> : (
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
  if (!data) return <div className="flex items-center justify-center h-[60vh]"><Spinner size="lg" /></div>;

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
          {(data.intent_distribution || []).length === 0 && <EmptyState icon="🧠" title="No intent data yet" />}
        </div>
      </div>
    </div>
  );
}

// ─── SUPERVISOR: ESCALATION MONITOR ──────────────────────────────────────────
export function EscalationMonitor() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ status: "", note: "", resolution_notes: "" });
  const [updating, setUpdating] = useState(false);
  const toast = useToast();

  const reload = () => { api.get("/escalations").then(r => setTickets(r.data.escalations || [])); };
  useEffect(reload, []);

  const selectTicket = async (t) => {
    setSelected(t);
    setForm({ status: t.status, note: "", resolution_notes: t.resolution_notes || "" });
    try {
      const res = await api.get(`/escalations/${t.id}`);
      setSelected(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  const update = async () => {
    setUpdating(true);
    try {
      await api.patch(`/escalations/${selected.id}`, { status: form.status || selected.status, note: form.note, resolution_notes: form.resolution_notes });
      toast("Ticket updated!", "success");
      setForm({ status: "", note: "", resolution_notes: "" });
      reload();
      const res = await api.get(`/escalations/${selected.id}`);
      setSelected(res.data);
    } catch { toast("Update failed", "error"); }
    finally { setUpdating(false); }
  };

  const statusColor = { open: "red", "in-progress": "amber", resolved: "green", closed: "slate" };

  const openCount = tickets.filter(t => t.status === "open").length;
  const highCount = tickets.filter(t => (t.priority === "high" || t.priority === "critical") && t.status !== "resolved").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total Tickets" value={tickets.length} />
        <KpiCard label="Open" value={openCount} color="text-red-600" />
        <KpiCard label="High Priority" value={highCount} color="text-red-600" />
        <KpiCard label="Resolved" value={tickets.filter(t => t.status === "resolved").length} color="text-green-600" />
      </div>
      {openCount > 0 && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">⚠️ {openCount} open ticket{openCount > 1 ? "s" : ""} require immediate attention.</div>}
      
      <div className="flex gap-4 h-[600px]">
        <div className="w-80 flex flex-col">
          <div className="flex gap-1 mb-3 flex-wrap">
            {["all", "open", "in-progress", "resolved"].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>{s}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {filtered.map(t => (
              <div key={t.id} onClick={() => selectTicket(t)}
                className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${selected?.id === t.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300 bg-white"}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-xs text-gray-400">{t.ticket_id}</span>
                  <Badge color={statusColor[t.status] || "slate"}>{t.status}</Badge>
                </div>
                <div className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">{t.issue}</div>
                <div className="text-xs text-gray-400">{t.customer_name} · <Badge color={t.priority === "high" || t.priority === "critical" ? "red" : "amber"}>{t.priority}</Badge></div>
              </div>
            ))}
            {filtered.length === 0 && <EmptyState icon="📭" title="No tickets found" />}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto">
          {!selected ? (
            <EmptyState icon="👈" title="Select a ticket to manage" desc="Click any ticket on the left to view and update" />
          ) : (
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-mono text-sm text-gray-500">{selected.ticket_id}</div>
                  <div className="text-lg font-bold text-gray-800 mt-1">{selected.issue}</div>
                </div>
                <div className="flex gap-2">
                  <Badge color={statusColor[selected.status] || "slate"}>{selected.status}</Badge>
                  <Badge color={selected.priority === "high" || selected.priority === "critical" ? "red" : "amber"}>{selected.priority}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-3 text-sm mb-4">
                {[["Customer", selected.customer_name], ["Email", selected.customer_email], ["Phone", selected.customer_phone || "—"], ["Policy", selected.policy_number || "—"], ["Category", selected.category || "—"], ["Created", fmtDate(selected.created_at)], ["Assigned CSR", selected.assigned_csr_name || "Unassigned"]].map(([l, v]) => (
                  <div key={l}><div className="text-xs text-gray-400 font-semibold">{l}</div><div className="text-gray-800">{v}</div></div>
                ))}
              </div>

              {selected.notes?.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-600 mb-2">CSR & Supervisor Notes</div>
                  {selected.notes.map((n, i) => (
                    <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 mb-1.5 text-sm">
                      <div className="text-gray-700">{n.note}</div>
                      <div className="text-xs text-gray-400 mt-1">{n.csr_name} · {timeAgo(n.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Update Status</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status || selected.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {["open", "in-progress", "resolved", "closed"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                {selected.attachment_path && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Attached Proof Document</label>
                    <a href={`http://localhost:8001/api/${selected.attachment_path.replace(/\\/g, "/")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
                      📄 View Uploaded Document
                    </a>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Add Supervisor Note (Internal)</label>
                  <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400" placeholder="Internal note..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Resolution Notes</label>
                  <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400" placeholder="How was this resolved?" value={form.resolution_notes} onChange={e => setForm(f => ({ ...f, resolution_notes: e.target.value }))} />
                </div>
                <button onClick={update} disabled={updating} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                  {updating ? <Spinner size="sm" /> : null} Update Ticket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
