import { ClipboardList, CheckCircle, Eye } from "lucide-react";
import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import { api, useToast, AuthCtx, useAuth, fmt, fmtDate, timeAgo, parseDate } from "../components/SharedContext";
import { Badge, KpiCard, Spinner, PageLoader, EmptyState, Toast, Sidebar, Topbar, NotifPanel } from "../components/SharedComponents";

// ─── COMPLIANCE: DASHBOARD ────────────────────────────────────────────────────
export function ComplianceDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/compliance/summary").then(r => setData(r.data)); }, []);
  if (!data) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Audit Logs" value={fmt(data.total_audit_logs)} />
        <KpiCard label="Guardrail Violations" value={data.guardrail_violations_30d} color="text-amber-600" sub="Last 30 days" />
        <KpiCard label="Sensitive Actions" value={data.sensitive_actions_30d} sub="Last 30 days" />
        {/* <KpiCard label="Compliance Score" value={`${data.compliance_score}%`} color="text-green-600" /> */}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="font-semibold text-gray-700 mb-4">Top Actions</div>
        {(data.action_breakdown || []).map(a => (
          <div key={a.action} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{a.action}</span>
            <span className="font-bold text-gray-800">{a.cnt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COMPLIANCE: AUDIT LOGS ───────────────────────────────────────────────────
export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({ action: "", severity: "", date_from: "", date_to: "", page: 1 });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/compliance/audit-logs", { params: { ...filter, page_size: 30 } });
      setLogs(r.data.logs || []); setTotal(r.data.total || 0);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter.page]);

  const sevColor = { normal: "slate", sensitive: "amber", high: "red" };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Filter by action…" value={filter.action} onChange={e => setFilter(f => ({ ...f, action: e.target.value }))} />
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filter.severity} onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))}>
            <option value="">All Severity</option>
            <option value="normal">Normal</option>
            <option value="sensitive">Sensitive</option>
            <option value="high">High</option>
          </select>
          <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filter.date_from} onChange={e => setFilter(f => ({ ...f, date_from: e.target.value }))} />
          <button onClick={load} className="bg-[#FF7A45] hover:bg-[#F56B2F] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm">
            {loading ? <Spinner size="sm" /> : null} Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex justify-between">
          <div className="font-semibold text-gray-700">Audit Log</div>
          <Badge color="blue">{fmt(total)} entries</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{["ID", "User", "Action", "Details", "Time", "Severity"].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center"><Spinner /></td></tr> : logs.map(l => (
                <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{l.id}</td>
                  <td className="px-4 py-3">{l.user_name || "System"}</td>
                  <td className="px-4 py-3"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{l.action}</span></td>
                  <td className="px-4 py-3 max-w-[200px]"><div className="truncate text-gray-600">{l.details}</div></td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{parseDate(l.created_at).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3"><Badge color={sevColor[l.severity] || "slate"}>{l.severity}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && logs.length === 0 && <EmptyState icon={ClipboardList} title="No audit logs match filter" />}
      </div>
    </div>
  );
}

// ─── COMPLIANCE: GUARDRAIL VIOLATIONS ────────────────────────────────────────
export function GuardrailViolations() {
  const [violations, setViolations] = useState([]);
  useEffect(() => { api.get("/compliance/guardrail-violations").then(r => setViolations(r.data.violations || [])); }, []);
  return (
    <div className="space-y-3">
      {violations.length === 0 ? <EmptyState icon={CheckCircle} title="No guardrail violations" desc="All conversations within policy" /> : violations.map(v => (
        <div key={v.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚨</span>
              <span className="font-mono text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded">{v.violation_type}</span>
              <Badge color={v.severity === "high" ? "red" : "amber"}>{v.severity}</Badge>
            </div>
            <span className="text-xs text-gray-400">{timeAgo(v.created_at)}</span>
          </div>
          <div className="text-sm text-gray-700 mb-1">{v.message}</div>
          <div className="text-xs text-gray-500">{v.user_name || "Unknown user"}{v.user_email ? ` · ${v.user_email}` : ""}</div>
        </div>
      ))}
    </div>
  );
}

// ─── COMPLIANCE: SENSITIVE ACTIONS ───────────────────────────────────────────
export function SensitiveActionsPage() {
  const [actions, setActions] = useState([]);
  useEffect(() => { api.get("/compliance/sensitive-actions").then(r => setActions(r.data.actions || [])); }, []);
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100 font-semibold text-gray-700">Sensitive Actions</div>
      {actions.length === 0 ? <EmptyState icon={Eye} title="No sensitive actions" /> : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{["User", "Action", "Details", "Time", "Severity"].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr></thead>
          <tbody>{actions.map(a => (
            <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3">{a.user_name || "System"}</td>
              <td className="px-4 py-3"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{a.action}</span></td>
              <td className="px-4 py-3 max-w-[200px]"><div className="truncate">{a.details}</div></td>
              <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{parseDate(a.created_at).toLocaleString("en-IN")}</td>
              <td className="px-4 py-3"><Badge color={a.severity === "high" ? "red" : "amber"}>{a.severity}</Badge></td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

// ─── COMPLIANCE: EXPORT ───────────────────────────────────────────────────────
export function ExportPage() {
  const [form, setForm] = useState({ date_from: "", date_to: "", format: "csv" });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const doExport = async () => {
    setLoading(true);
    try {
      const r = await api.get("/compliance/export", { params: form, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement("a"); a.href = url; a.download = "insureai_audit_export.csv"; a.click();
      toast("Export downloaded!", "success");
    } catch { toast("Export failed", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md">
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="font-semibold text-gray-700">Export Compliance Report</div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Date From</label>
          <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.date_from} onChange={e => setForm(f => ({ ...f, date_from: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Date To</label>
          <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.date_to} onChange={e => setForm(f => ({ ...f, date_to: e.target.value }))} />
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          Exports full audit log as CSV. This action is itself logged for compliance.
        </div>
        <button onClick={doExport} disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
          {loading ? <Spinner size="sm" /> : "📥"} Download CSV Report
        </button>
      </div>
    </div>
  );
}

// ─── CSR: KNOWLEDGE BASE ──────────────────────────────────────────────────────
export function CSRKnowledgeBase() {
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState([]);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const loadDocs = async () => {
    try {
      const r = await api.get("/kb/list");
      const list = (r.data.documents || []).map(d => ({
        name: d.file_name,
        category: d.category || d.document_type,
        uploaded_at: d.uploaded_at,
        size: d.file_size,
        relevance: d.relevance_score || d.relevance || null,
      }));
      setDocs(list);
    } catch (e) {
      // ignore
    }
  };

  const submitUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return toast("Please select at least one file.", "error");

    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".txt"];
    const MAX = 5 * 1024 * 1024; // 5 MB

    // Basic client-side validation
    for (const f of selectedFiles) {
        const okExt = allowed.some(ext => f.name.toLowerCase().endsWith(ext));
        if (!okExt) {
          const msg = `File ${f.name} has invalid format. Allowed: PDF, JPG, JPEG, PNG.`;
          setErrorMessage(msg);
          toast(msg, "error");
          return;
        }
        if (f.size > MAX) {
          const msg = `File ${f.name} is too large. Max 5 MB.`;
          // Only toast, no errorMessage state
          toast(msg, "error");
          return;
        }
      }

    const formData = new FormData();
    for (const f of selectedFiles) formData.append("file", f);

    setUploading(true);
    setUploadProgress(0);
    try {
      const res = await api.post("/kb/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000, // 3 minutes — LLM analysis takes time
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          }
        }
      });
      // res.data.results may contain per-file info
      const RELEVANCE_THRESHOLD = 70; // minimum acceptable relevance score
      if (res.data && res.data.results) {
        res.data.results.forEach(r => {
          if (r.success) {
            const score = typeof r.relevance_score === 'number' ? r.relevance_score : null;
            const category = r.category || null;
            if (!category) {
              toast(`${r.filename}: Rejected — no category detected`, "error");
            } else if (score !== null && score < RELEVANCE_THRESHOLD) {
              toast(`${r.filename}: Rejected — relevance ${score}% below threshold (${RELEVANCE_THRESHOLD}%)`, "error");
            } else {
              // Update docs list with new category and relevance if needed
              setDocs(prev => prev.map(doc => doc.name === r.filename ? { ...doc, category, relevance: score } : doc));
              toast(`Uploaded ${r.filename}: ${r.metrics?.chunks_embedded || 0} chunks (Category: ${category}, Relevance: ${score ?? 'N/A'}%)`, "success");
            }
          } else {
            const score = r.relevance_score;
            if (typeof score === 'number') {
              toast(`${r.filename}: Rejected — relevance ${score}% — ${r.error || 'processing error'}`, "error");
            } else {
              toast(`Failed ${r.filename}: ${r.error || 'processing error'}`, "error");
            }
          }
        });
      } else {
        toast("Upload completed.", "success");
      }
        await loadDocs();
        setErrorMessage('');
      setShowModal(false);
      setSelectedFiles([]);
    } catch (err) {
      const resp = err.response;
      if (resp && resp.data) {
        const d = resp.data;
        if (d.results && Array.isArray(d.results)) {
          d.results.forEach(r => { if (!r.success) toast(`${r.filename}: ${r.error || 'processing error'}`, "error"); });
        } else if (d.detail) {
          toast(d.detail, "error");
        } else if (d.message) {
          toast(d.message, "error");
        } else if (typeof d === 'string') {
          toast(d, "error");
        } else {
          try { toast(JSON.stringify(d), "error"); } catch { toast("Upload failed.", "error"); }
        }
      } else {
        toast(err.message || "Upload failed.", "error");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length === 0) return;
    // merge with existing selectedFiles
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  useEffect(() => { loadDocs(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Knowledge Base Management</h2>
          <p className="text-sm text-gray-500">Manage internal documents and resources for CSR.</p>
        </div>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.txt" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
        <button onClick={() => setShowModal(true)} disabled={uploading} className="bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:bg-gray-400 shadow-sm">
          {uploading ? <Spinner size="sm" /> : <span>📤</span>}
          {uploading ? "Processing..." : "Upload Document"}
        </button>

        {/* Simple modal popup for file selection */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg">
              {uploading && (
                <div className="absolute inset-0 bg-black/40 z-50 flex flex-col items-center justify-center rounded-xl">
                  <div className="bg-white p-4 rounded-lg flex flex-col items-center gap-2">
                    <Spinner size="lg" />
                    <div className="text-sm font-medium">Uploading... {uploadProgress}%</div>
                    <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-[#FF5A14] h-2" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Upload Document</h3>
                <button onClick={() => { setShowModal(false); setSelectedFiles([]); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-gray-500">✖</button>
              </div>
              <div className="space-y-3">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`w-full border-2 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer ${dragActive ? 'border-[#FF8A55] bg-[#FFF7F2]' : 'border-dashed border-gray-200 bg-gray-50'}`}
                >
                  <div className="text-sm text-gray-600 mb-2">Drag & drop files here</div>
                  <div className="text-xs text-gray-500 mb-3">or</div>
                  <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="px-3 py-2 bg-white border border-[#D8D8D8] rounded text-sm hover:bg-[#FFF7F2]">Select files</button>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.txt" multiple className="hidden" ref={fileInputRef} onChange={(e) => { handleFileChange(e); if (e.target.files?.[0]) fileInputRef.current.value = ""; }} />
                </div>
                <div className="text-sm text-gray-500">Allowed formats: PDF, JPG, JPEG, PNG, TXT. Max size: 5 MB.</div>
                {selectedFiles.length > 0 && (
                  <div className="p-3 border rounded-md max-h-40 overflow-y-auto">
                    {selectedFiles.map((sf, idx) => (
                      <div key={idx} className="mb-2">
                        <div className="font-semibold text-sm">{sf.name}</div>
                        <div className="text-xs text-gray-500">{(sf.size/1024).toFixed(1)} KB</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => { setShowModal(false); setSelectedFiles([]); setErrorMessage(''); }} className="px-4 py-2 rounded-lg border border-[#D8D8D8] text-gray-600 hover:bg-gray-50">Cancel</button>
                  
                  <button onClick={submitUpload} disabled={uploading} className="px-4 py-2 rounded-lg bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-semibold shadow-sm">{uploading ? <Spinner size="sm" /> : "Upload"}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="p-2 border-b border-gray-100 font-semibold text-gray-700">All Documents</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{["File Name", "Category", "Uploaded At", /* "Size (KB)", */ "Relevance"].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr></thead>
            <tbody>
              {docs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No documents found. Upload to see them here.</td></tr>
              ) : docs.map((d, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3">{d.category}</td>
                  <td className="px-4 py-3">{d.uploaded_at ? new Date(d.uploaded_at).toLocaleString() : "-"}</td>
                  {/* <td className="px-4 py-3">{d.size ? Math.round(d.size/1024) : "-"}</td> */}
                  <td className="px-4 py-3">{d.relevance ?? "-"}</td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
