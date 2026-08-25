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

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
export function LoginPage({ onLogin, initialEmail, onBackToLanding }) {
  const [email, setEmail] = useState(
    initialEmail || "soniakhatun9786@gmail.com",
  );
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
    { label: "CSR Agent", email: "rohan.developer2001@gmail.com", icon: "🎧" },
    { label: "Supervisor", email: "soniaagent234@gmail.com", icon: "📊" },
    { label: "Compliance", email: "compliance@test.com", icon: "🔒" },
  ];

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password: pass });
      const { token, user } = res.data;
      localStorage.setItem("ia_token", token);
      localStorage.setItem("ia_user", JSON.stringify(user));
      toast(`Welcome back, ${user.name}!`, "success");
      onLogin(user, token);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Login failed. Check credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4A4A4A] via-[#3A3A3A] to-[#2A2A2A] flex flex-col items-center justify-center p-4 relative font-sans">
      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          className="absolute top-6 left-6 flex items-center gap-2 text-sm text-[#D8D8D8] hover:text-white transition-colors cursor-pointer bg-[#4A4A4A]/60 hover:bg-[#4A4A4A] px-4 py-2 rounded-xl border border-[#5A5A5A] backdrop-blur-md"
        >
          <span>←</span> <span>Back to Home</span>
        </button>
      )}
      <div className="w-full max-w-md">
        <div
          className="text-center mb-6 cursor-pointer group"
          onClick={onBackToLanding}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FF5A14] flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3 shadow-lg group-hover:scale-105 transition-transform">
            I
          </div>
          <div className="text-2xl font-bold text-white group-hover:text-[#FF7A45] transition-colors">
            InsureAI Pro
          </div>
          <div className="text-sm text-[#D8D8D8] mt-1">
            Enterprise Insurance Platform
          </div>
        </div>
        <div className="bg-white rounded-2xl p-7 shadow-2xl border border-[#D8D8D8]">
          <div className="text-sm font-semibold text-[#666666] mb-3">
            Quick access — select role
          </div>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {roles.map((r) => (
              <button
                key={r.email}
                onClick={() => {
                  setEmail(r.email);
                  setPass("123456");
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left text-sm transition-all ${email === r.email ? "border-[#FF8A55] bg-[#FFF7F2]" : "border-[#D8D8D8] hover:border-[#FF8A55]"}`}
              >
                <span>{r.icon}</span>
                <span className="font-medium text-[#666666]">{r.label}</span>
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="text-xs font-semibold text-[#888888] uppercase tracking-wide block mb-1">
                Email
              </label>
              <input
                className="w-full bg-[#FFF7F2] border border-[#D8D8D8] rounded-lg px-3 py-2 text-sm text-[#666666] focus:outline-none focus:border-[#FF8A55]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-[#888888] uppercase tracking-wide block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full bg-[#FFF7F2] border border-[#D8D8D8] rounded-lg px-3 py-2 pr-10 text-sm text-[#666666] focus:outline-none focus:border-[#FF8A55]"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#666666] transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="text-red-600 text-xs mb-3 bg-red-50 p-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              {loading ? <Spinner size="sm" /> : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
