import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { api, AuthCtx, ToastCtx } from "./components/SharedContext";
import { Toast, Sidebar, Topbar, NotifPanel, NAV } from "./components/SharedComponents";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { CustomerDashboard, ChatPage, PoliciesPage, RenewalPage, EndorsementsPage, UploadPage, EscalationPage, NotificationsPage, ChatHistoryPage } from "./pages/CustomerPages";
import { CSRDashboard, CSRTickets, CSRConversation } from "./pages/CSRPages";
import { SupervisorDashboard, AIPerformancePage, EscalationMonitor } from "./pages/SupervisorPages";
import { ComplianceDashboard, AuditLogsPage, GuardrailViolations, SensitiveActionsPage, ExportPage, CSRKnowledgeBase } from "./pages/CompliancePages";

// ─── PAGE TITLES ──────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  "customer-dashboard": "Dashboard", "customer-ai-assistant": "AI Insurance Assistant", "customer-policies": "My Policies",
  "customer-policy-renewal": "Policy Renewal",
  "customer-raise-ticket": "Raise Support Ticket", "customer-notifications": "Notifications", "customer-chat-history": "Chat History",
  "csr-dashboard": "CSR Dashboard", "csr-all-tickets": "Manage Tickets", "csr-conversation-view": "Conversation Viewer", "csr-knowledge-base": "Knowledge Base",
  "supervisor-dashboard": "Operations Dashboard", "supervisor-ai-performance": "AI Performance", "supervisor-escalation-monitor": "Escalation Monitor",
  "compliance-hub": "Compliance Hub", "compliance-audit-logs": "Audit Logs", "compliance-guardrail-alerts": "Guardrail Violations",
  "compliance-sensitive-actions": "Sensitive Actions", "compliance-export-reports": "Export Reports",
};

const DEFAULT_PAGE = { customer: "customer-dashboard", csr: "csr-dashboard", supervisor: "supervisor-dashboard", compliance: "compliance-hub" };




function MainLayout({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.get("/notifications").then(r => setUnreadCount(r.data.unread_count || 0)).catch(() => { });
    }
  }, [user]);

  const setPage = (id) => navigate("/" + id);
  const page = location.pathname.split("/").pop();

  const renderPage = () => {
    switch (page) {
      case "customer-dashboard": return <CustomerDashboard setPage={setPage} />;
      case "customer-ai-assistant": return <ChatPage />;
      case "customer-policies": return <PoliciesPage setPage={setPage} />;
      case "customer-policy-renewal": return <RenewalPage />;
      case "customer-raise-ticket": return <EscalationPage />;
      case "customer-notifications": return <NotificationsPage />;
      case "customer-chat-history": return <ChatHistoryPage />;
      case "csr-dashboard": return <CSRDashboard setPage={setPage} />;
      case "csr-all-tickets": return <CSRTickets />;
      case "csr-conversation-view": return <CSRConversation />;
      case "csr-knowledge-base": return <CSRKnowledgeBase />;
      case "supervisor-dashboard": return <SupervisorDashboard />;
      case "supervisor-ai-performance": return <AIPerformancePage />;
      case "supervisor-escalation-monitor": return <EscalationMonitor />;
      case "compliance-hub": return <ComplianceDashboard />;
      case "compliance-audit-logs": return <AuditLogsPage />;
      case "compliance-guardrail-alerts": return <GuardrailViolations />;
      case "compliance-sensitive-actions": return <SensitiveActionsPage />;
      case "compliance-export-reports": return <ExportPage />;
      default: return <div className="text-gray-400 text-center mt-16">Page not found</div>;
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar page={page} setPage={setPage} user={user} onLogout={onLogout} />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar title={PAGE_TITLES[page] || "InsureAI"} unread={unreadCount} onNotif={() => setShowNotif(true)} />
        <div className="flex-1 p-6 overflow-y-auto">
          {renderPage()}
        </div>
      </main>
      {showNotif && <NotifPanel onClose={() => setShowNotif(false)} />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("ia_user") || "null"); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem("ia_token") || "");
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  useEffect(() => {
    const handler = () => { setUser(null); setToken(""); };
    window.addEventListener("ia_logout", handler);
    return () => window.removeEventListener("ia_logout", handler);
  }, []);

  const onLogout = () => {
    localStorage.removeItem("ia_token"); localStorage.removeItem("ia_user");
    setUser(null); setToken("");
  };

  const onLogin = (u, t) => {
    setUser(u); setToken(t);
  };

  return (
    <ToastCtx.Provider value={addToast}>
      <AuthCtx.Provider value={{ user, token }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={user ? <Navigate to={`/${DEFAULT_PAGE[user.role] || "customer-dashboard"}`} /> : <LandingPage onNavigateToLogin={() => window.location.href = "/login"} />} />
            <Route path="/login" element={user ? <Navigate to={`/${DEFAULT_PAGE[user.role] || "customer-dashboard"}`} /> : <LoginPage onLogin={onLogin} onBackToLanding={() => window.location.href = "/"} />} />
            <Route path="/:page" element={<MainLayout user={user} onLogout={onLogout} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        <Toast toasts={toasts} remove={removeToast} />
      </AuthCtx.Provider>
    </ToastCtx.Provider>
  );
}
