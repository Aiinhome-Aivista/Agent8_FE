import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import { api, useToast, AuthCtx, useAuth, fmt, fmtDate, timeAgo } from "../components/SharedContext";
import { Badge, KpiCard, Spinner, EmptyState, Toast, Sidebar, Topbar, NotifPanel } from "../components/SharedComponents";

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
export function LoginPage({ onLogin, initialEmail, onBackToLanding }) {
  const [email, setEmail] = useState(initialEmail || "soniakhatun9786@gmail.com");
  const [pass, setPass] = useState("123456");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const roles = [
    { label: "Customer", email: "soniakhatun9786@gmail.com", icon: "👤" },
    { label: "CSR Agent", email: "sonia19khatun98@gmail.com", icon: "🎧" },
    { label: "Supervisor", email: "supervisor@test.com", icon: "📊" },
    { label: "Compliance", email: "compliance@test.com", icon: "🔒" },
  ];

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api.post("/auth/login", { email, password: pass });
      const { token, user } = res.data;
      localStorage.setItem("ia_token", token);
      localStorage.setItem("ia_user", JSON.stringify(user));
      toast(`Welcome back, ${user.name}!`, "success");
      onLogin(user, token);
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col items-center justify-center p-4 relative">
      {onBackToLanding && (
        <button onClick={onBackToLanding} className="absolute top-6 left-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-xl border border-slate-705/50 backdrop-blur-md">
          <span>←</span> <span>Back to Home</span>
        </button>
      )}
      <div className="w-full max-w-md">
        <div className="text-center mb-6 cursor-pointer group" onClick={onBackToLanding}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3 shadow-lg group-hover:scale-105 transition-transform">I</div>
          <div className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">InsureAI Pro</div>
          <div className="text-sm text-slate-400 mt-1">Enterprise Insurance Platform</div>
        </div>
        <div className="bg-white rounded-2xl p-7 shadow-2xl">
          <div className="text-sm font-semibold text-gray-600 mb-3">Quick access — select role</div>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {roles.map(r => (
              <button key={r.email} onClick={() => { setEmail(r.email); setPass("123456"); }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left text-sm transition-all ${email === r.email ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                <span>{r.icon}</span>
                <span className="font-medium text-gray-800">{r.label}</span>
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Email</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-blue-500" value={pass} onChange={e => setPass(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1" tabIndex={-1}>
                  {showPass ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>
            {error && <div className="text-red-600 text-xs mb-3 bg-red-50 p-2 rounded-lg">{error}</div>}
            <div className="text-xs text-gray-400 mb-3 bg-gray-50 rounded-lg p-2">All test accounts use password: <strong>123456</strong></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all">
              {loading ? <Spinner size="sm" /> : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
