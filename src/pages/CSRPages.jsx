import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import { api, useToast, AuthCtx, useAuth, fmt, fmtDate, timeAgo } from "../components/SharedContext";
import { Badge, KpiCard, Spinner, EmptyState, Toast, Sidebar, Topbar, NotifPanel } from "../components/SharedComponents";

// ─── CSR: DASHBOARD ───────────────────────────────────────────────────────────
export function CSRDashboard({ setPage }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/dashboard/csr").then(r => setData(r.data)); }, []);
  if (!data) return <div className="flex items-center justify-center h-[60vh]"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Assigned to Me" value={data.assigned_total} />
        <KpiCard label="Open" value={data.open} color="text-red-600" sub="Need action" />
        <KpiCard label="In Progress" value={data.in_progress} color="text-amber-600" />
        <KpiCard label="Resolved Today" value={data.resolved_today} color="text-green-600" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="font-semibold text-gray-700">My Open Tickets</div>
          <button onClick={() => setPage("csr-tickets")} className="text-xs text-blue-600 hover:underline">View all</button>
        </div>
        {(data.recent_tickets || []).length === 0 ? <EmptyState icon="🎉" title="No open tickets!" /> : (data.recent_tickets || []).map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs text-gray-400">{t.ticket_id}</span>
                <Badge color={t.priority === "high" || t.priority === "critical" ? "red" : "amber"}>{t.priority}</Badge>
              </div>
              <div className="text-sm text-gray-700 truncate">{t.issue}</div>
              <div className="text-xs text-gray-400">{t.customer_name} · {fmtDate(t.created_at)}</div>
            </div>
            <Badge color={t.status === "open" ? "red" : "amber"}>{t.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CSR: TICKETS ─────────────────────────────────────────────────────────────
export function CSRTickets() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ status: "", note: "", resolution_notes: "" });
  const [updating, setUpdating] = useState(false);
  const toast = useToast();

  const reload = () => { api.get("/escalations").then(r => setTickets(r.data.escalations || [])); };
  useEffect(reload, []);

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  const update = async () => {
    setUpdating(true);
    try {
      await api.patch(`/escalations/${selected.id}`, { status: form.status || selected.status, note: form.note, resolution_notes: form.resolution_notes });
      toast("Ticket updated!", "success");
      setSelected(null);
      reload();
    } catch { toast("Update failed", "error"); }
    finally { setUpdating(false); }
  };

  const statusColor = { open: "red", "in-progress": "amber", resolved: "green", closed: "slate" };

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">
      <div className="w-80 flex flex-col">
        <div className="flex gap-1 mb-3 flex-wrap">
          {["all", "open", "in-progress", "resolved"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>{s}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {filtered.map(t => (
            <div key={t.id} onClick={() => { setSelected(t); setForm({ status: t.status, note: "", resolution_notes: t.resolution_notes || "" }); }}
              className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${selected?.id === t.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300 bg-white"}`}>
              <div className="flex justify-between items-start mb-1">
                <span className="font-mono text-xs text-gray-400">{t.ticket_id}</span>
                <Badge color={statusColor[t.status] || "slate"}>{t.status}</Badge>
              </div>
              <div className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">{t.issue}</div>
              <div className="text-xs text-gray-400">{t.customer_name} · <Badge color={t.priority === "high" || t.priority === "critical" ? "red" : "amber"}>{t.priority}</Badge></div>
            </div>
          ))}
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
              {[["Customer", selected.customer_name], ["Email", selected.customer_email], ["Phone", selected.customer_phone || "—"], ["Policy", selected.policy_number || "—"], ["Category", selected.category || "—"], ["Created", fmtDate(selected.created_at)]].map(([l, v]) => (
                <div key={l}><div className="text-xs text-gray-400 font-semibold">{l}</div><div className="text-gray-800">{v}</div></div>
              ))}
            </div>

            {selected.notes?.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-semibold text-gray-600 mb-2">CSR Notes</div>
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
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
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
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Add Note (Internal)</label>
                <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400" placeholder="Internal note for team…" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
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
  );
}

// ─── CSR: CONVERSATION VIEW ───────────────────────────────────────────────────

// Strip JSON wrappers from AI responses (same logic as customer side)
function cleanAiMsg(text) {
  if (!text) return "";
  let s = text.trim().replace(/^```[\w]*\n?/, "").replace(/```$/, "").trim();

  const extract = (obj) => {
    if (obj?.assistant?.message) return obj.assistant.message.trim();
    for (const k of ["message","response","reply","content","answer"])
      if (typeof obj[k] === "string") return obj[k].trim();
    if (Object.keys(obj).length === 0) return "";
    return null;
  };

  if (s.startsWith("{")) {
    try {
      const msg = extract(JSON.parse(s));
      if (msg !== null) return msg;
    } catch {
      if (s.length < 10 || !s.includes("}")) return "";
    }
  } else if (s.includes("\n\n{")) {
    const idx = s.indexOf("\n\n{");
    const prefix = s.slice(0, idx);
    const rest = s.slice(idx + 2);
    try {
      const msg = extract(JSON.parse(rest));
      if (msg !== null) return msg ? `${prefix}\n\n${msg}` : prefix;
    } catch {
      if (rest.length < 10 || !rest.includes("}")) return prefix;
    }
  }

  if (s.endsWith("\n\n{")) return s.slice(0, -3).trim();
  if (s === "{") return "";

  return s;
}

// Render basic markdown (bold)
function renderMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function CSRConversation() {
  const [tickets, setTickets]         = useState([]);
  const [selectedTicket, setSelected] = useState(null);
  const [sessions, setSessions]       = useState([]);
  const [expanded, setExpanded]       = useState(null);
  const [messages, setMessages]       = useState([]);
  const [loadingS, setLoadingS]       = useState(false);
  const [loadingM, setLoadingM]       = useState(false);
  const toast = useToast();

  useEffect(() => { api.get("/escalations").then(r => setTickets(r.data.escalations || [])); }, []);

  const selectTicket = async (t) => {
    setSelected(t); setSessions([]); setExpanded(null); setMessages([]);
    setLoadingS(true);
    try {
      const r = await api.get(`/chat/sessions/customer/${t.user_id}`);
      setSessions(r.data.sessions || []);
    } catch (e) {
      toast(e.response?.data?.detail || "Could not load sessions", "error");
    } finally { setLoadingS(false); }
  };

  const openSession = async (sessionId) => {
    if (expanded === sessionId) { setExpanded(null); setMessages([]); return; }
    setExpanded(sessionId); setLoadingM(true);
    try {
      // CSR views customer history via session_id; use customer's user_id param
      const r = await api.get("/chat/history", { params: { session_id: sessionId, page: 1, page_size: 100 } });
      setMessages((r.data.history || []).reverse());
    } catch { toast("Failed to load messages", "error"); }
    finally { setLoadingM(false); }
  };

  const intentColors = {
    renewal:"blue", policy_inquiry:"purple", complaint:"red",
    coverage_question:"teal", premium_query:"green", faq:"slate",
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">
      {/* ── Left: Ticket list ── */}
      <div className="w-72 overflow-y-auto space-y-2 flex-shrink-0">
        <div className="text-xs text-gray-400 font-semibold uppercase px-1 mb-1">My Assigned Tickets</div>
        {tickets.length === 0 && <EmptyState icon="📭" title="No assigned tickets" />}
        {tickets.map(t => (
          <div key={t.id} onClick={() => selectTicket(t)}
            className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${selectedTicket?.id === t.id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}>
            <div className="flex justify-between mb-1">
              <span className="font-mono text-xs text-gray-400">{t.ticket_id}</span>
              <Badge color={t.status === "open" ? "red" : t.status === "in-progress" ? "amber" : "green"}>{t.status}</Badge>
            </div>
            <div className="text-sm font-semibold text-gray-800">{t.customer_name}</div>
            <div className="text-xs text-gray-500 truncate">{t.issue}</div>
          </div>
        ))}
      </div>

      {/* ── Right: Sessions + messages ── */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto flex flex-col">
        {!selectedTicket ? (
          <EmptyState icon="💬" title="Select a ticket to view conversation" desc="Click any ticket on the left" />
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex-shrink-0">
              <div className="font-bold text-gray-800">{selectedTicket.customer_name}</div>
              <div className="text-sm text-gray-500">{selectedTicket.ticket_id} · {selectedTicket.issue?.slice(0, 60)}</div>
            </div>

            {/* Sessions list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingS && <div className="flex justify-center py-8"><Spinner size="md" /></div>}
              {!loadingS && sessions.length === 0 && (
                <EmptyState icon="📭" title="No chat sessions found" desc="This customer has no recorded AI conversations" />
              )}
              {sessions.map((s, idx) => (
                <div key={s.session_id} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  {/* Session card header */}
                  <div
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => openSession(s.session_id)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-gray-800 text-sm truncate">{s.title}</span>
                        {s.intent && !["otp_consent_prompt","otp_sent"].includes(s.intent) && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                            {s.intent.replace(/_/g," ")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{s.preview}</div>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">🕐 {timeAgo(s.last_at)}</span>
                        <span className="text-xs text-gray-400">💬 {s.message_count} msgs</span>
                      </div>
                    </div>
                    <span className="text-gray-300 text-xs">{expanded === s.session_id ? "▲" : "▼"}</span>
                  </div>

                  {/* Expanded messages */}
                  {expanded === s.session_id && (
                    <div className="border-t border-gray-200 bg-white max-h-72 overflow-y-auto">
                      {loadingM
                        ? <div className="flex justify-center py-6"><Spinner size="sm" /></div>
                        : <div className="p-3 space-y-2">
                            {messages.map((m, i) => (
                              <div key={m.id || i} className="space-y-1">
                                <div className="flex justify-end">
                                  <div className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-2xl rounded-tr-sm max-w-[80%]">
                                    {m.user_message}
                                  </div>
                                </div>
                                <div className="flex gap-2 items-start">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
                                  <div className="bg-gray-100 text-gray-800 text-xs px-3 py-1.5 rounded-2xl rounded-tl-sm max-w-[80%] whitespace-pre-wrap">
                                    {renderMarkdown(cleanAiMsg(m.ai_response))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
