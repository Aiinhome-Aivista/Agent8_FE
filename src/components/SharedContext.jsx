import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";


// ─── API Client ───────────────────────────────────────────────────────────────
export const BASE = (import.meta?.env?.VITE_API_URL) || "http://localhost:8001/api";
export const api = axios.create({ baseURL: BASE, timeout: 30000 });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("ia_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(r => r, e => {
  if (e.response?.status === 401) {
    localStorage.removeItem("ia_token");
    localStorage.removeItem("ia_user");
    window.dispatchEvent(new Event("ia_logout"));
  }
  return Promise.reject(e);
});

// ─── Auth Context ─────────────────────────────────────────────────────────────
export const AuthCtx = createContext(null);
export function useAuth() { return useContext(AuthCtx); }

// ─── Toast ────────────────────────────────────────────────────────────────────
export const ToastCtx = createContext(null);
export function useToast() { return useContext(ToastCtx); }

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const fmt = (n) => new Intl.NumberFormat("en-IN").format(n);
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const timeAgo = (d) => { const s = (Date.now() - new Date(d)) / 1000; if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; };
