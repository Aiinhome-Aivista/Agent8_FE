import { Shield, Edit3, Folder, Ticket, Bell, MessageSquare, RefreshCw, CheckCircle, Settings, CreditCard, Megaphone, FileText, Image, UploadCloud, Trash2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import { api, useToast, AuthCtx, useAuth, fmt, fmtDate, timeAgo, parseDate } from "../components/SharedContext";
import { Badge, KpiCard, Spinner, PageLoader, EmptyState, Toast, Sidebar, Topbar, NotifPanel } from "../components/SharedComponents";

// ─── SHARED HELPER: strip JSON wrappers from LLM responses ───────────────────
function cleanAiResponse(text) {
  if (!text) return "";
  let s = text.trim();
  s = s.replace(/^```[\w]*\n?/, "").replace(/```$/, "").trim();

  const extract = (obj) => {
    if (obj?.assistant?.message) return obj.assistant.message.trim();
    for (const key of ["message", "response", "reply", "content", "answer"]) {
      if (typeof obj[key] === "string") return obj[key].trim();
    }
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

// ─── SHARED HELPER: render basic markdown (bold) ──────────────────────────────
function renderMarkdown(text) {
  if (!text) return null;
  
  const sourceRegex = /\[Source:\s*(.+?)\]/g;
  const sources = [];
  let match;
  while ((match = sourceRegex.exec(text)) !== null) {
    if (!sources.includes(match[1])) {
      sources.push(match[1]);
    }
  }
  
  const cleanText = text.replace(sourceRegex, "").trim();
  
  const parts = cleanText.split(/(\*\*.*?\*\*)/g);
  const elements = parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });

  if (sources.length > 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="whitespace-pre-wrap">{elements}</div>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200/60 mt-1">
          {sources.map((src, i) => (
            <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-md text-[11px] font-medium text-gray-600 shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              {src}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <span className="whitespace-pre-wrap">{elements}</span>;
}


// ─── CUSTOMER: DASHBOARD ──────────────────────────────────────────────────────
export function CustomerDashboard({ setPage }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/dashboard/customer").then(r => setData(r.data)).catch(() => { }); }, []);
  if (!data) return <PageLoader />;

  const sqlPol = data.policies || {};
  const docPol = data.doc_policies;
  const useDoc = docPol && (sqlPol.active ?? 0) === 0;
  const pol = useDoc ? docPol : sqlPol;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name || "Customer"}!</h2>
          <p className="text-blue-100">Manage your policies, track claims, and get instant answers with our AI assistant.</p>
        </div>
        <button onClick={() => setPage("customer-chat")} className="whitespace-nowrap bg-white text-blue-700 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-50 transition-colors flex items-center gap-2 flex-shrink-0">
          <MessageSquare size={20} />
          Ask AI Assistant
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
        <KpiCard label="Active Policies" value={pol.active ?? 0} sub="In good standing" />
        <KpiCard label="Total Coverage" value={`₹${fmt(Math.round((pol.total_coverage || 0) / 100000))}L`} sub="Across all policies" />
        <KpiCard label="Annual Premium" value={`₹${fmt(Math.round(pol.total_premium || 0))}`} sub="Per year" />
        <KpiCard label="Open Tickets" value={data.open_tickets ?? 0} color={data.open_tickets > 0 ? "text-red-600" : "text-green-600"} sub={data.open_tickets > 0 ? "Needs attention" : "All resolved"} />
      </div>

      {/* ── Expiring Soon ── */}
      {data.expiring_soon?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <span className="text-lg">⚠️</span> Policies Expiring Soon
          </div>
          <div className="space-y-2">
            {data.expiring_soon.map(p => (
              <div key={p.policy_number} className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm py-2 px-4 bg-white rounded-xl border border-amber-100 shadow-sm">
                <span className="text-amber-900 font-semibold mb-2 sm:mb-0">{p.policy_type} <span className="text-amber-500 font-mono ml-2">{p.policy_number}</span></span>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  <span className="text-amber-700 font-medium">{p.days} days left <span className="text-amber-400 text-xs hidden md:inline ml-1">({fmtDate(p.expiry_date)})</span></span>
                  <button onClick={() => setPage("customer-policy-renewal")} className="text-sm bg-amber-500 text-white px-4 py-1.5 rounded-lg hover:bg-amber-600 font-bold transition-colors shadow-sm shadow-amber-500/20">Renew Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => setPage("customer-documents")} className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors mb-3">
              <UploadCloud size={26} />
            </div>
            <span className="font-bold text-gray-800">Upload Document</span>
            <span className="text-xs text-gray-500 mt-1 text-center font-medium">Add claims or proofs</span>
          </button>
          
          <button onClick={() => setPage("customer-escalation")} className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-amber-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors mb-3">
              <Ticket size={26} />
            </div>
            <span className="font-bold text-gray-800">Raise Ticket</span>
            <span className="text-xs text-gray-500 mt-1 text-center font-medium">Get help with issues</span>
          </button>

          <button onClick={() => setPage("customer-policy-renewal")} className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-green-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors mb-3">
              <RefreshCw size={26} />
            </div>
            <span className="font-bold text-gray-800">Renew Policy</span>
            <span className="text-xs text-gray-500 mt-1 text-center font-medium">Extend your coverage</span>
          </button>

          <button onClick={() => setPage("customer-policies")} className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-indigo-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-3">
              <Shield size={26} />
            </div>
            <span className="font-bold text-gray-800">View Policies</span>
            <span className="text-xs text-gray-500 mt-1 text-center font-medium">Check all active plans</span>
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── CUSTOMER: AI CHAT ────────────────────────────────────────────────────────
export function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    // Resume a specific session if requested, otherwise resume last active session or create new
    const resume = sessionStorage.getItem("resume_session_id");
    if (resume) { sessionStorage.removeItem("resume_session_id"); sessionStorage.setItem("active_session_id", resume); return resume; }
    const active = sessionStorage.getItem("active_session_id");
    if (active) return active;
    const newId = crypto.randomUUID();
    sessionStorage.setItem("active_session_id", newId);
    return newId;
  });
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const loadSessions = useCallback(() => {
    api.get("/chat/sessions")
      .then(r => setSessions(r.data.sessions || []))
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const startNewChat = () => {
    const newId = crypto.randomUUID();
    sessionStorage.setItem("active_session_id", newId);
    setSessionId(newId);
    setMessages([{
      role: "ai",
      content: `Hello ${user?.name?.split(" ")[0]}! 👋 I'm your InsureAI Assistant.\n\nI've started a fresh conversation. What can I help you with today?`,
      intent: null, time: new Date()
    }]);
  };

  useEffect(() => {
    // If resuming a session, load its history; otherwise show greeting
    api.get("/chat/history", { params: { session_id: sessionId, page: 1, page_size: 100 } })
      .then(r => {
        const hist = (r.data.history || []).reverse().filter(h => !["verify_otp", "otp_sent", "otp_consent_prompt", "otp_invalid", "otp_declined"].includes(h.detected_intent));
        if (hist.length > 0) {
          const loaded = hist.flatMap(h => [
            { role: "user", content: h.user_message, time: parseDate(h.created_at) },
            { role: "ai", content: cleanAiResponse(h.ai_response), intent: h.detected_intent, confidence: h.confidence_score, time: parseDate(h.created_at) },
          ]);
          setMessages(loaded);
        } else {
          setMessages([{
            role: "ai",
            content: `Hello ${user?.name?.split(" ")[0]}! 👋 I'm your InsureAI Assistant. I can help you with:\n• Policy renewals and queries\n• Coverage information\n• Address/contact updates\n• Complaints and escalations\n\nWhat can I help you with today?`,
            intent: null, time: new Date()
          }]);
        }
      })
      .catch(() => {
        setMessages([{
          role: "ai",
          content: `Hello ${user?.name?.split(" ")[0]}! 👋 I'm your InsureAI Assistant.\n\nWhat can I help you with today?`,
          intent: null, time: new Date()
        }]);
      });
  }, [sessionId]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    
    const isOTP = messages.length > 0 && messages[messages.length - 1].intent === "verify_otp" && /^\d{6}$/.test(msg);
    
    if (!isOTP) {
      setMessages(m => [...m, { role: "user", content: msg, time: new Date() }]);
    }
    
    setLoading(true);
    try {
      const res = await api.post("/chat", { message: msg, session_id: sessionId }, { timeout: 120000 });
      const d = res.data;
      setMessages(m => {
        let nextM = [...m];
        if (isOTP && d.intent !== "otp_invalid") {
           nextM = nextM.filter(x => !["verify_otp", "otp_sent", "otp_consent_prompt", "otp_invalid", "otp_declined"].includes(x.intent));
        }
        return [...nextM, { role: "ai", content: d.response, intent: d.intent, confidence: d.confidence, guardrail: d.guardrail_violated, time: new Date() }];
      });
      loadSessions();
    } catch (e) {
      setMessages(m => [...m, { role: "ai", content: "Sorry, I'm having trouble connecting. Please try again.", time: new Date() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const QUICK = ["What are my active policies?", "Check my coverage details", "Update my address", "I have a complaint"];
  const intentColor = { renewal: "blue", policy_inquiry: "purple", complaint: "red", coverage_question: "teal", address_update: "amber", faq: "slate" };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* INJECTED: Chat History Sidebar */}
      <div className="w-64 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden hidden md:flex">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="font-semibold text-gray-800 text-sm">Chat History</div>
          <button onClick={startNewChat} className="text-gray-500 hover:text-blue-600 transition-colors" title="New Chat">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingSessions ? (
            <div className="p-4 flex justify-center"><Spinner size="sm" /></div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-xs text-gray-500 text-center">No previous chats</div>
          ) : (
            sessions.map(s => (
              <button 
                key={s.session_id} 
                onClick={() => setSessionId(s.session_id)} 
                className={`w-full text-left p-3 rounded-lg text-sm transition-all flex flex-col gap-1 ${sessionId === s.session_id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
              >
                <div className={`truncate ${sessionId === s.session_id ? 'font-semibold text-blue-800' : 'font-medium text-gray-700'}`}>
                  {s.title}
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span className="truncate flex-1 pr-2 capitalize">
                    {s.intent !== 'faq' && s.intent ? s.intent.replace(/_/g, ' ') : 'General'}
                  </span>
                  <span className="flex-shrink-0">{timeAgo(s.last_at)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex flex-col flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AI</div>
            <div>
              <div className="font-semibold text-gray-800">InsureAI Assistant</div>
              <div className="flex items-center gap-1.5 text-xs text-teal-600">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                Online · AI-powered
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* INJECTED: Agent Status Widget */}
            {messages.length > 0 && messages[messages.length - 1].role === "ai" && messages[messages.length - 1].worker_used && (
              <div className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 font-mono font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                {messages[messages.length - 1].worker_used || "Intent Agent"}
              </div>
            )}
            <button onClick={startNewChat} className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium transition-colors">
              + New Chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${m.role === "ai" ? "bg-gradient-to-br from-blue-600 to-teal-500" : "bg-gradient-to-br from-violet-500 to-pink-500"}`}>
                {m.role === "ai" ? "AI" : (user?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U")}
              </div>
              <div className={`max-w-[75%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                {/* Intent badge removed as requested */}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === "ai" ? "bg-gray-100 text-gray-800 rounded-tl-sm" : "bg-blue-600 text-white rounded-tr-sm"}`}>
                  {m.role === "ai" ? renderMarkdown(m.content) : m.content}
                </div>
                <div className="text-xs text-gray-400 mt-1">{m.time ? new Date(m.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">AI</div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                {[0, 150, 300].map(d => <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Quick replies */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {QUICK.map(q => (
              <button key={q} onClick={() => send(q)} className="px-3 py-1.5 text-xs border border-blue-200 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all bg-white">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          {messages.length > 0 && messages[messages.length - 1].role === "ai" && messages[messages.length - 1].intent === "verify_otp" && !loading ? (
            <div className="flex flex-col items-center justify-center gap-2 w-full bg-blue-50/50 rounded-2xl py-4 border border-blue-100">
              <div className="text-sm font-semibold text-blue-800">Please enter the 6-digit OTP sent to your email</div>
              <input
                autoFocus
                type="text"
                maxLength={6}
                placeholder="------"
                className="w-48 text-center text-3xl tracking-[0.3em] font-mono bg-white border-2 border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 shadow-inner"
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  e.target.value = val;
                  if (val.length === 6) {
                    send(val);
                  }
                }}
              />
            </div>
          ) : (
            <>
              <textarea ref={inputRef} rows={1} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask me anything about your insurance…"
                className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all" />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                className="w-10 h-10 bg-blue-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all flex-shrink-0">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="rotate-90"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </>
          )}
          </div>
        </div>
      </div>
  );
}

// ─── CUSTOMER: POLICIES ───────────────────────────────────────────────────────
export function PoliciesPage({ setPage }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [coverage, setCoverage] = useState(null);

  useEffect(() => {
    api.get("/policies").then(r => setPolicies(r.data.policies || [])).finally(() => setLoading(false));
  }, []);

  const viewCoverage = async (pol) => {
    setSelected(pol);
    try { const r = await api.get(`/policies/${pol.id}/coverage`); setCoverage(r.data); } catch { }
  };

  const statusColor = { active: "green", expired: "red", pending: "amber", cancelled: "red" };
  const typeIcon = { "Motor Insurance": "🚗", "Health Insurance": "❤️", "Term Life": "🛡️", "Home Insurance": "🏠", "Travel Insurance": "✈️", "Business Insurance": "🏢" };

  if (loading) return <PageLoader text="Loading Assistant..." />;

  return (
    <div>
      {selected && coverage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setCoverage(null); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-lg font-bold">{coverage.policy_type}</div>
                <div className="font-mono text-sm text-gray-500">{coverage.policy_number}</div>
              </div>
              <button onClick={() => { setSelected(null); setCoverage(null); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-xs text-blue-600 font-semibold mb-1">Sum Insured</div>
                <div className="text-xl md:text-2xl font-bold text-blue-700">₹{fmt(coverage.sum_insured)}</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-xs text-green-600 font-semibold mb-1">Premium</div>
                <div className="text-xl md:text-2xl font-bold text-green-700">₹{fmt(coverage.premium || 0)}</div>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(coverage.coverage_details || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-2 border-b border-gray-100">
                  <span className="text-gray-600">{k}</span>
                  <span className="font-medium text-gray-800 text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setSelected(null); setCoverage(null); setPage("customer-policy-renewal"); }} className="w-full mt-4 bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm">
              Renew Policy
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.length === 0 ? <EmptyState icon={Shield} title="No policies found" desc="Your policies will appear here" /> : policies.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className={`h-1 ${p.status === "active" ? "bg-green-500" : p.status === "pending" ? "bg-amber-500" : "bg-red-500"}`} />
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeIcon[p.policy_type] || "🛡️"}</span>
                    <span className="font-semibold text-gray-800">{p.policy_type}</span>
                  </div>
                  <div className="font-mono text-xs text-gray-400 mt-0.5">{p.policy_number}</div>
                </div>
                <Badge color={statusColor[p.status] || "slate"}>{p.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                <div><span className="text-gray-400">Coverage</span><div className="font-semibold text-gray-700 text-sm">₹{fmt(p.coverage_amount)}</div></div>
                <div><span className="text-gray-400">Premium</span><div className="font-semibold text-blue-600 text-sm">₹{fmt(p.premium)}/yr</div></div>
                <div><span className="text-gray-400">Expiry</span><div className="font-medium text-gray-700">{fmtDate(p.expiry_date)}</div></div>
                <div><span className="text-gray-400">Days Left</span><div className={`font-medium ${(p.days_to_expiry || 0) < 30 ? "text-red-600" : "text-gray-700"}`}>{p.days_to_expiry ?? "—"} days</div></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => viewCoverage(p)} className="flex-1 text-xs py-2 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium">View Details</button>
                {p.status !== "expired" && <button onClick={() => setPage("customer-policy-renewal")} className="flex-1 text-xs py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium">Renew</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CUSTOMER: RENEWAL ────────────────────────────────────────────────────────
export function RenewalPage() {
  const [policies, setPolicies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [method, setMethod] = useState("UPI");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const [step, setStep] = useState(1);
  const toast = useToast();

  useEffect(() => {
    api.get("/policies").then(r => setPolicies((r.data.policies || []).filter(p => p.status !== "cancelled")));
  }, []);

  const renew = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const r = await api.post("/renewals", { policy_id: selected.id, payment_method: method });
      setDone(r.data);
      setStep(4);
      toast("Policy renewed successfully!", "success");
    } catch (e) {
      toast(e.response?.data?.detail || "Renewal failed. Please try again.", "error");
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-xl shadow-blue-900/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50/50">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <div className="text-2xl font-bold text-gray-800 mb-2">Renewal Successful!</div>
        <div className="text-gray-500 mb-8">Your policy has been renewed successfully for another year. A copy of the renewed document has been sent to your registered email.</div>
        
        <div className="bg-gray-50 rounded-2xl p-6 text-left text-sm space-y-3 mb-8 border border-gray-100">
          {[
            ["Policy Number", done.policy_number], 
            ["Amount Paid", `₹${fmt(done.amount)}`], 
            ["Payment Mode", done.payment_method], 
            ["Transaction ID", done.transaction_id], 
            ["New Expiry Date", fmtDate(done.new_expiry)]
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between items-center py-1">
              <span className="text-gray-500 font-medium">{l}</span>
              <span className="font-bold text-gray-800 text-right">{v}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { setDone(null); setSelected(null); setStep(1); }} className="w-full sm:w-auto px-8 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
          Renew Another Policy
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Wizard */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8 relative">
              {/* Progress Line */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10 -translate-y-1/2 hidden sm:block"></div>
              
              {["Select Policy", "Review", "Payment", "Done"].map((s, i) => {
                const isActive = step === i + 1;
                const isPast = step > i + 1;
                return (
                  <div key={s} className="flex flex-col items-center gap-2 bg-white px-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isPast ? "bg-green-500 text-white shadow-md shadow-green-500/20" : isActive ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-4 ring-blue-50" : "bg-gray-100 text-gray-400"}`}>
                      {isPast ? <CheckCircle size={16} /> : i + 1}
                    </div>
                    <span className={`text-xs hidden sm:block ${isActive ? "text-blue-600 font-bold" : isPast ? "text-gray-700 font-medium" : "text-gray-400"}`}>{s}</span>
                  </div>
                );
              })}
            </div>

            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">Select a policy to renew</h3>
                {policies.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <Folder size={40} className="mx-auto text-gray-300 mb-3" />
                    <p>No eligible policies found for renewal.</p>
                  </div>
                ) : policies.map(p => (
                  <div key={p.id} onClick={() => { setSelected(p); setStep(2); }}
                    className={`border-2 rounded-xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${selected?.id === p.id ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-gray-100 hover:border-blue-300 bg-white"}`}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <div className="font-bold text-gray-800 text-base mb-1">{p.policy_type}</div>
                        <div className="font-mono text-xs text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded-md">{p.policy_number}</div>
                      </div>
                      <div className="sm:text-right">
                        <div className="text-xl font-black text-blue-600 mb-1">₹{fmt(p.premium)}</div>
                        <div className="text-xs font-medium text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded-md">Expires {fmtDate(p.expiry_date)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 2 && selected && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-bold text-gray-800 mb-5 text-lg">Review Renewal Details</h3>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 text-sm">
                    {[
                      ["Policy Type", selected.policy_type], 
                      ["Policy Number", selected.policy_number], 
                      ["Current Expiry", fmtDate(selected.expiry_date)], 
                      ["New Expiry", "Extended by 1 Year"], 
                      ["Sum Insured", `₹${fmt(selected.coverage_amount)}`], 
                      ["Premium Due", `₹${fmt(selected.premium)}`]
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5">{l}</div>
                        <div className="font-bold text-gray-800 text-base">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 text-sm text-blue-800 mb-6 border border-blue-100">
                  <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Secure Transaction</span>
                    Your payment is secured with 256-bit encryption. The renewed policy document will be emailed to you instantly after payment.
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button onClick={() => setStep(1)} className="w-full sm:w-1/3 border-2 border-gray-200 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">← Back</button>
                  <button onClick={() => setStep(3)} className="w-full sm:w-2/3 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">Proceed to Payment →</button>
                </div>
              </div>
            )}

            {step === 3 && selected && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-bold text-gray-800 mb-5 text-lg">Choose Payment Method</h3>
                <div className="space-y-3 mb-6">
                  {["UPI", "Net Banking", "Credit/Debit Card", "NEFT/RTGS"].map(m => (
                    <label key={m} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${method === m ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-gray-100 hover:border-gray-300"}`}>
                      <input type="radio" className="hidden" checked={method === m} onChange={() => setMethod(m)} />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === m ? "border-blue-600" : "border-gray-300"}`}>
                        {method === m && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                      </div>
                      <span className={`font-bold ${method === m ? "text-blue-900" : "text-gray-700"}`}>{m}</span>
                    </label>
                  ))}
                </div>
                
                <div className="flex justify-between items-center bg-gray-900 text-white p-5 rounded-xl mb-6 shadow-lg">
                  <span className="font-medium">Total Amount Payable</span>
                  <span className="text-2xl font-black">₹{fmt(selected.premium)}</span>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button onClick={() => setStep(2)} className="w-full sm:w-1/3 border-2 border-gray-200 py-3.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">← Back</button>
                  <button onClick={renew} disabled={loading} className="w-full sm:w-2/3 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:bg-gray-400 disabled:shadow-none transition-all">
                    {loading ? <><Spinner size="sm" /> Processing Securely…</> : `Pay ₹${fmt(selected.premium)} Securely`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Info Panel */}
        <div className="space-y-6">
          {selected && step > 1 && (
            <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10 animate-in fade-in zoom-in-95 duration-300">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-blue-300" />
                Renewal Summary
              </h3>
              <div className="space-y-4 text-blue-100 text-sm">
                <div>
                  <div className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Policy Number</div>
                  <div className="font-mono text-white text-base bg-white/10 inline-block px-2 py-0.5 rounded">{selected.policy_number}</div>
                </div>
                <div>
                  <div className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Sum Insured</div>
                  <div className="font-bold text-white text-lg">₹{fmt(selected.coverage_amount)}</div>
                </div>
                <div className="w-full h-px bg-blue-500/50 my-2" />
                <div className="flex justify-between items-end">
                  <span className="text-blue-200 font-medium">Total Premium</span> 
                  <span className="font-black text-white text-2xl">₹{fmt(selected.premium)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2 text-lg">
              <Shield size={22} className="text-blue-500" /> 
              Why Renew Online?
            </h3>
            <ul className="space-y-5 text-sm text-gray-600">
              <li className="flex gap-4 items-start">
                <div className="mt-0.5 bg-green-100 p-1.5 rounded-lg text-green-600"><CheckCircle size={18} /></div>
                <div>
                  <span className="font-bold text-gray-800 block mb-0.5">Instant Issuance</span>
                  Get your renewed policy document downloaded immediately.
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <div className="mt-0.5 bg-blue-100 p-1.5 rounded-lg text-blue-600"><RefreshCw size={18} /></div>
                <div>
                  <span className="font-bold text-gray-800 block mb-0.5">No Break in Coverage</span>
                  Ensure seamless continuity of your insurance benefits.
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <div className="mt-0.5 bg-amber-100 p-1.5 rounded-lg text-amber-600"><Ticket size={18} /></div>
                <div>
                  <span className="font-bold text-gray-800 block mb-0.5">Exclusive Discounts</span>
                  Online renewals come with zero hidden processing fees.
                </div>
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center">
             <div className="text-gray-400 mb-2">Need help with renewal?</div>
             <a href="#/chat" className="text-blue-600 font-bold hover:underline flex justify-center items-center gap-1.5">
               <MessageSquare size={16} /> Chat with AI Assistant
             </a>
          </div>
        </div>

      </div>
    </div>
  );
}
// ─── CUSTOMER: ENDORSEMENTS ───────────────────────────────────────────────────
export function EndorsementsPage() {
  const [tab, setTab] = useState("address");
  const [policies, setPolicies] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ policy_id: "", new_value: "", apply_to_all: false });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.get("/policies").then(r => setPolicies(r.data.policies || []));
    api.get("/endorsements").then(r => setHistory(r.data.endorsements || []));
  }, []);

  const submit = async () => {
    if (!form.new_value.trim()) { toast("Please enter the new value", "error"); return; }
    setLoading(true);
    try {
      await api.post("/endorsements", {
        policy_id: form.policy_id ? parseInt(form.policy_id) : (policies[0]?.id || 0),
        update_type: tab,
        new_value: form.new_value,
        apply_to_all: form.apply_to_all,
      });
      toast(`${tab.replace(/_/g, " ")} updated successfully!`, "success");
      api.get("/endorsements").then(r => setHistory(r.data.endorsements || []));
      setForm({ policy_id: "", new_value: "", apply_to_all: false });
    } catch (e) { toast(e.response?.data?.detail || "Update failed", "error"); }
    finally { setLoading(false); }
  };

  const tabs = [["address", "Address"], ["phone", "Phone"], ["email", "Email"]];
  const placeholders = { address: "Enter full new address", phone: "Enter new mobile number (+91 XXXXX)", email: "Enter new email address" };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex gap-2 mb-4">
          {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === k ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{l}</button>)}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 mb-4">
          ⚠️ Sensitive action — this change will be logged and reviewed by the compliance team.
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Select Policy</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.policy_id} onChange={e => setForm(f => ({ ...f, policy_id: e.target.value }))}>
              <option value="">All Active Policies</option>
              {policies.filter(p => p.status === "active").map(p => <option key={p.id} value={p.id}>{p.policy_type} — {p.policy_number}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">New {tab.replace(/_/g, " ")}</label>
            <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400" placeholder={placeholders[tab]} value={form.new_value} onChange={e => setForm(f => ({ ...f, new_value: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.apply_to_all} onChange={e => setForm(f => ({ ...f, apply_to_all: e.target.checked }))} className="accent-blue-600" />
            Apply to all active policies
          </label>
          <button onClick={submit} disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" /> : null} Update {tab.replace(/_/g, " ")}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 font-semibold text-gray-700">Endorsement History</div>
        {history.length === 0 ? <EmptyState icon={Edit3} title="No endorsements yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>{["Date", "Type", "Policy", "Old Value", "New Value", "Status"].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody>{history.map(e => (
                <tr key={e.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{fmtDate(e.updated_at)}</td>
                  <td className="px-4 py-3 capitalize">{e.update_type}</td>
                  <td className="px-4 py-3 font-mono text-xs">{e.policy_number || "—"}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-[120px] truncate">{e.old_value || "—"}</td>
                  <td className="px-4 py-3 max-w-[120px] truncate">{e.new_value}</td>
                  <td className="px-4 py-3"><Badge color="green">{e.status}</Badge></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CUSTOMER: UPLOAD DOCS ────────────────────────────────────────────────────
export function UploadPage() {
  const [docs, setDocs] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ policy_id: "", document_type: "Claim Form" });
  const [loading, setLoading] = useState(false);
  const [ragQ, setRagQ] = useState("");
  const [ragAns, setRagAns] = useState("");
  const [ragLoading, setRagLoading] = useState(false);
  const fileRef = useRef();
  const toast = useToast();

  const reload = () => {
    api.get("/documents").then(r => setDocs(r.data.documents || []));
    api.get("/policies").then(r => setPolicies(r.data.policies || []));
  };
  useEffect(reload, []);

  const upload = async () => {
    if (!file) { toast("Please select a file", "error"); return; }
    const fd = new FormData();
    fd.append("file", file);
    if (form.policy_id && !isNaN(form.policy_id)) fd.append("policy_id", form.policy_id);
    fd.append("document_type", form.document_type);
    setLoading(true);
    try {
      await api.post("/documents/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast("Document uploaded successfully!", "success");
      setFile(null); fileRef.current.value = "";
      reload();
    } catch (e) { toast(e.response?.data?.detail || "Upload failed", "error"); }
    finally { setLoading(false); }
  };

  const askRag = async () => {
    if (!ragQ.trim()) return;
    setRagLoading(true); setRagAns("");
    try {
      const r = await api.post("/documents/ask", { question: ragQ });
      setRagAns(r.data.answer);
    } catch { setRagAns("Unable to process query. Please try again."); }
    finally { setRagLoading(false); }
  };

  const deleteDoc = async (id) => {
    await api.delete(`/documents/${id}`);
    toast("Document deleted", "info");
    reload();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="font-semibold text-gray-700 mb-4">Upload Document</div>
          <div className="space-y-3">
            {form.document_type !== "Policy Document" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Policy (Optional)</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.policy_id} onChange={e => setForm(f => ({ ...f, policy_id: e.target.value }))}>
                  <option value="">-- Select --</option>
                  {policies.length > 0
                    ? policies.map(p => <option key={p.id} value={p.id}>{p.policy_type} — {p.policy_number}</option>)
                    : [
                      { id: "health", label: "Health Insurance" },
                      { id: "life", label: "Life Insurance" },
                      { id: "motor", label: "Motor Insurance" },
                      { id: "home", label: "Home Insurance" },
                      { id: "travel", label: "Travel Insurance" },
                      { id: "term", label: "Term Life Insurance" },
                    ].map(o => <option key={o.id} value={o.id}>{o.label}</option>)
                  }
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Document Type</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))}>
                {["Claim Form", "Photo ID Proof", "Address Proof", "Medical Records", "RC Book", "Nominee Proof", "Policy Document", "Other"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all" onClick={() => fileRef.current?.click()}>
              <div className="flex justify-center mb-2 text-blue-500"><UploadCloud size={32} /></div>
              <div className="text-sm font-medium text-gray-600">{file ? file.name : "Drop file or click to browse"}</div>
              <div className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</div>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.txt" onChange={e => setFile(e.target.files[0])} />
            </div>
            <button onClick={upload} disabled={loading || !file} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:bg-gray-300">
              {loading ? <><Spinner size="sm" /> Uploading…</> : "Upload Document"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="font-semibold text-gray-700">Uploaded Documents</div>
          <Badge color="blue">{docs.length} files</Badge>
        </div>
        {docs.length === 0 ? <EmptyState icon={Folder} title="No documents uploaded" desc="Upload your policy documents to get started" /> : (
          <div className="divide-y divide-gray-100">
            {docs.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-gray-500">{d.file_name.endsWith(".pdf") ? <FileText size={20} /> : <Image size={20} />}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{d.file_name}</div>
                  <div className="text-xs text-gray-400">{d.document_type} · {fmtDate(d.uploaded_at)}</div>
                </div>
                <Badge color={d.is_processed ? "green" : "amber"}>{d.is_processed ? "Indexed" : "Processing"}</Badge>
                <button onClick={() => deleteDoc(d.id)} className="text-gray-400 hover:text-red-500 text-sm"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CUSTOMER: ESCALATION ─────────────────────────────────────────────────────
export function EscalationPage() {
  const [tickets, setTickets] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState({ policy_id: "", issue: "", category: "Claim Rejection", priority: "medium", reason: "", file: null });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const reload = () => {
    api.get("/escalations").then(r => setTickets(r.data.escalations || []));
    api.get("/policies").then(r => {
      const pols = r.data.policies || [];
      setPolicies(pols);
      if (pols.length > 0) {
        setForm(f => ({ ...f, policy_id: pols[0].id }));
      }
    });
  };
  useEffect(reload, []);

  const submit = async () => {
    if (form.issue.trim().length < 10) { toast("Please describe your issue in at least 10 characters", "error"); return; }
    if (form.category === "Contact/Address Update" && form.reason.trim().length < 5) { toast("Please provide a valid reason for the update", "error"); return; }
    setLoading(true);
    try {
      const finalIssue = form.category === "Contact/Address Update" ? `[Reason: ${form.reason}] ${form.issue}` : form.issue;

      const formData = new FormData();
      formData.append("issue", finalIssue);
      formData.append("category", form.category);
      formData.append("priority", form.priority);
      if (form.policy_id) formData.append("policy_id", form.policy_id);
      if (form.file) formData.append("file", form.file);

      const r = await api.post("/escalations", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast(`Ticket ${r.data.ticket_id} created! CSR will respond within 2 hours.`, "success");
      setForm(f => ({ ...f, issue: "", category: "Claim Rejection", priority: "medium", reason: "", file: null }));
      reload();
    } catch (e) { toast(e.response?.data?.detail || "Failed to create ticket", "error"); }
    finally { setLoading(false); }
  };

  const statusColor = { open: "red", "in-progress": "amber", resolved: "green", closed: "slate" };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="font-semibold text-gray-700 mb-4">Raise Support Ticket</div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Related Policy (optional)</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.policy_id} onChange={e => setForm(f => ({ ...f, policy_id: e.target.value }))}>
              <option value="">General — No Specific Policy</option>
              {policies.map(p => <option key={p.id} value={p.id}>{p.policy_type} — {p.policy_number}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Category</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {["Claim Rejection", "Premium Discrepancy", "Policy Document Issue", "Contact/Address Update", "Nominee Update", "Refund Request", "Technical Issue", "Other"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Priority</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              {["low", "medium", "high", "critical"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          {form.category === "Contact/Address Update" && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Valid Reason for Update</label>
              <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="e.g. Relocated to a new city" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Supportive Document (Optional)</label>
            <input type="file" accept="image/png, image/jpeg" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Describe Your Issue {form.category === "Contact/Address Update" ? "(Include new details here)" : ""}</label>
            <textarea rows={5} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400" placeholder="Please describe your issue in detail…" value={form.issue} onChange={e => setForm(f => ({ ...f, issue: e.target.value }))} />
          </div>
          <button onClick={submit} disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" /> : null} Submit Ticket
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[calc(100vh-8rem)]">
        <div className="p-4 border-b border-gray-100 font-semibold text-gray-700 flex-shrink-0">My Tickets</div>
        <div className="flex-1 overflow-y-auto">
          {tickets.length === 0 ? <EmptyState icon={Ticket} title="No tickets yet" /> : (
            <div className="divide-y divide-gray-100">
            {tickets.map(t => (
              <div key={t.id} className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-xs text-gray-400">{t.ticket_id}</span>
                  <div className="flex gap-1.5">
                    <Badge color={t.priority === "high" || t.priority === "critical" ? "red" : t.priority === "medium" ? "amber" : "slate"}>{t.priority}</Badge>
                    <Badge color={statusColor[t.status] || "slate"}>{t.status}</Badge>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-800 mb-1">{t.issue}</div>
                <div className="text-xs text-gray-400">{t.category} · Created {fmtDate(t.created_at)}</div>
                {t.assigned_csr_name && <div className="text-xs text-blue-600 mt-1">Assigned to: {t.assigned_csr_name}</div>}

                {/* INJECTED: Escalation Timeline */}
                <div className="mt-4 pl-3 border-l-2 border-indigo-100 space-y-3">
                  <div className="relative text-xs">
                    <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-2 ring-white"></div>
                    <span className="font-semibold text-gray-700">Ticket Created</span>
                    <div className="text-gray-400 mt-0.5">{fmtDate(t.created_at)}</div>
                  </div>
                  {t.assigned_csr_name && (
                    <div className="relative text-xs">
                      <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white"></div>
                      <span className="font-semibold text-gray-700">Assigned to CSR</span>
                      <div className="text-gray-400 mt-0.5">{t.assigned_csr_name}</div>
                    </div>
                  )}
                  {t.status === 'resolved' && (
                    <div className="relative text-xs">
                      <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white"></div>
                      <span className="font-semibold text-gray-700">Ticket Resolved</span>
                      <div className="text-gray-400 mt-0.5">{t.updated_at ? fmtDate(t.updated_at) : 'Done'}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMER: NOTIFICATIONS ──────────────────────────────────────────────────
export function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const toast = useToast();

  const reload = () => api.get("/notifications").then(r => { setNotifs(r.data.notifications || []); setUnread(r.data.unread_count || 0); });
  useEffect(() => { reload(); }, []);

  const markRead = async (id) => { await api.patch(`/notifications/${id}/read`); reload(); };
  const markAll = async () => { await api.patch("/notifications/read-all"); reload(); toast("All notifications marked as read", "success"); };

  const typeIcon = { renewal: RefreshCw, escalation: Ticket, update: Edit3, claim: CheckCircle, system: Settings, payment: CreditCard };
  const typeColor = { renewal: "amber", escalation: "red", update: "blue", claim: "green", system: "slate", payment: "purple" };

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <Badge color="blue">{unread} unread</Badge>
        <button onClick={markAll} className="text-xs text-blue-600 hover:underline">Mark all as read</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {notifs.length === 0 ? <EmptyState icon={Bell} title="No notifications" /> : notifs.map(n => (
          <div key={n.id} className={`flex gap-3 p-4 cursor-pointer hover:bg-gray-50 ${n.status === "unread" ? "bg-blue-50/40" : ""}`} onClick={() => markRead(n.id)}>
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.status === "unread" ? "bg-blue-500" : "bg-transparent border border-gray-300"}`} />
            {(() => { const IconCmp = typeIcon[n.type] || Megaphone; return <IconCmp size={20} className="text-gray-500 flex-shrink-0 mt-0.5" />; })()}
            <div className="flex-1 min-w-0">
              <div className={`text-sm ${n.status === "unread" ? "font-semibold text-gray-800" : "text-gray-600"}`}>{n.message}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge color={typeColor[n.type] || "slate"}>{n.type}</Badge>
                <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CUSTOMER: CHAT HISTORY ───────────────────────────────────────────────────
export function ChatHistoryPage({ setPage }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadSessions = () => {
    setLoading(true);
    api.get("/chat/sessions")
      .then(r => setSessions(r.data.sessions || []))
      .catch(() => toast("Failed to load history", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSessions(); }, []);

  const continueChat = (sessionId) => {
    sessionStorage.setItem("resume_session_id", sessionId);
    setPage("customer-chat");
  };

  const clearAll = async () => {
    await api.delete("/chat/history");
    setSessions([]);
    toast("All chat history cleared", "info");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="font-semibold text-gray-800 text-lg">Chat History</div>
          <div className="text-sm text-gray-500">Your past conversations with the AI Assistant</div>
        </div>
        {sessions.length > 0 && (
          <button onClick={clearAll} className="text-sm text-red-500 hover:text-red-700 hover:underline">Clear All History</button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium w-7/12">Session</th>
              <th className="px-5 py-3 font-medium text-center w-2/12">Messages</th>
              <th className="px-5 py-3 font-medium text-right w-2/12">Last Active</th>
              <th className="px-5 py-3 font-medium text-right w-1/12">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-12 text-center"><Spinner size="md" /></td></tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center">
                  <EmptyState icon={MessageSquare} title="No chat history" desc="Start a conversation with the AI Assistant" />
                </td>
              </tr>
            ) : sessions.map(s => (
              <tr key={s.session_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-semibold text-gray-800 mb-1">{s.title}</div>
                  <div className="text-xs text-gray-500 truncate max-w-lg">{s.preview}</div>
                </td>
                <td className="px-5 py-4 text-center">
                  <Badge color="blue">{s.message_count} messages</Badge>
                </td>
                <td className="px-5 py-4 text-right text-gray-500">
                  {timeAgo(s.last_at)}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => continueChat(s.session_id)}
                    className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap shadow-sm"
                  >
                    ▶ Continue
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
