import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useEstate, estateApi, claimApi, transferApi, documentApi, demoApi } from "../hooks/useApi";
import { GlassCard } from "../components/estate/GlassCard";
import { StatusBadge } from "../components/estate/StatusBadge";
import { theme } from "../theme";

const TABS = [
  { key: "overview",      label: "Overview",      emoji: "📊" },
  { key: "willscan",      label: "AI Scanner",    emoji: "🤖" },
  { key: "documents",     label: "Documents",     emoji: "🗂️" },
  { key: "beneficiaries", label: "Beneficiaries", emoji: "👥" },
  { key: "distribution",  label: "Distribution",  emoji: "⚖️" },
  { key: "legal",         label: "Legal",         emoji: "🔏" },
  { key: "transfers",     label: "Transfers",     emoji: "💸" },
  { key: "audit",         label: "Audit Log",     emoji: "🔍" },
];

const inputStyle: React.CSSProperties = {
  padding: "9px 12px", borderRadius: theme.radiusSm,
  border: `1px solid ${theme.border}`, background: "#fff",
  color: theme.textPrimary, fontSize: 13, outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s",
};

function Btn({ color = theme.accent, onClick, children, outline }: {
  color?: string; onClick: () => void; children: React.ReactNode; outline?: boolean;
}) {
  return (
    <button onClick={onClick} style={{
      padding: "9px 16px", borderRadius: theme.radiusSm,
      border: outline ? `1px solid ${color}` : "none",
      background: outline ? "transparent" : color,
      color: outline ? color : "#fff",
      fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
      transition: "opacity 0.15s",
    }}>
      {children}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "11px 0", borderBottom: `1px solid ${theme.borderLight}`, gap: 16,
    }}>
      <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontSize: 13, color: theme.textPrimary, fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export function EstateDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: estate, loading } = useEstate(id!);
  const [tab, setTab] = useState("overview");
  const [advisorEmail, setAdvisorEmail] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: theme.textMuted }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
        <div style={{ fontSize: 13 }}>Loading estate…</div>
      </div>
    </div>
  );
  if (!estate) return <div style={{ color: theme.error, padding: 40 }}>Estate not found</div>;

  return (
    <div style={{ animation: "fadeInUp 0.3s ease" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 100,
          padding: "12px 18px", borderRadius: 10,
          background: toast.ok ? theme.successLight : theme.errorLight,
          border: `1px solid ${toast.ok ? "#A7F3D0" : "#FECACA"}`,
          color: toast.ok ? "#065F46" : "#991B1B",
          fontSize: 13, fontWeight: 600, boxShadow: theme.shadowLg,
          animation: "fadeInUp 0.2s ease",
        }}>
          {toast.ok ? "✓" : "✗"} {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 16, display: "flex", gap: 6, alignItems: "center" }}>
        <Link to="/estates" style={{ color: theme.accent, fontWeight: 500 }}>Estates</Link>
        <span>/</span>
        <span>{estate.deceased_name}</span>
      </div>

      {/* Estate header bar */}
      <div style={{
        background: "#fff", borderRadius: theme.radiusLg,
        border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard,
        padding: "20px 24px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: theme.accentLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>👤</div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.3px" }}>
              {estate.deceased_name}
            </h1>
            <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono, marginTop: 2 }}>
              {estate.id} · {estate.death_date}
            </div>
          </div>
          <StatusBadge status={estate.status} pulse={["SCANNING","DISTRIBUTING"].includes(estate.status)} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.5px" }}>
            RM {Number(estate.total_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
            {estate.beneficiary_count} beneficiar{estate.beneficiary_count === 1 ? "y" : "ies"}
            {estate.account_frozen_at ? " · Account frozen" : ""}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 2, marginBottom: 20,
        background: "#fff", borderRadius: theme.radius,
        border: `1px solid ${theme.border}`,
        padding: 4, width: "fit-content",
        boxShadow: theme.shadowSm,
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "7px 14px", borderRadius: 8, border: "none",
            background: tab === t.key ? theme.accentLight : "transparent",
            color: tab === t.key ? theme.accent : theme.textSecondary,
            fontSize: 12, fontWeight: tab === t.key ? 700 : 500,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            transition: "all 0.14s", fontFamily: "inherit",
          }}>
            <span style={{ fontSize: 13 }}>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <GlassCard title="Estate Details" accent>
            <DetailRow label="Deceased Name"   value={estate.deceased_name} />
            <DetailRow label="Account ID"      value={<code style={{ fontSize: 11, fontFamily: theme.fontMono }}>{estate.deceased_account_id}</code>} />
            <DetailRow label="Date of Death"   value={estate.death_date} />
            <DetailRow label="Total Estate"    value={<strong>RM {Number(estate.total_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}</strong>} />
            <DetailRow label="Account Frozen"  value={estate.account_frozen_at
              ? <span style={{ color: theme.success, fontWeight: 600 }}>✓ {new Date(estate.account_frozen_at).toLocaleDateString("en-MY")}</span>
              : <span style={{ color: theme.warn }}>Not frozen</span>}
            />
            <DetailRow label="Status"          value={<StatusBadge status={estate.status} />} />
            <DetailRow label="Opened"          value={new Date(estate.created_at).toLocaleDateString("en-MY", { day: "2-digit", month: "long", year: "numeric" })} />
          </GlassCard>

          <GlassCard title="Actions" subtitle="Process this estate">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Btn onClick={async () => {
                try { await estateApi.calculate(estate.id); showToast("Share distribution calculated"); }
                catch (e: any) { showToast(e.response?.data?.detail || e.message, false); }
              }}>⚖️ Calculate Share Distribution</Btn>

              <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                <input
                  value={advisorEmail}
                  onChange={e => setAdvisorEmail(e.target.value)}
                  placeholder="Legal advisor email…"
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => e.target.style.borderColor = theme.accent}
                  onBlur={e => e.target.style.borderColor = theme.border}
                />
                <Btn onClick={async () => {
                  if (!advisorEmail) return showToast("Enter advisor email first", false);
                  try { await estateApi.dispatchAdvisor(estate.id, advisorEmail); showToast("Advisor notified — check console for approval URL"); }
                  catch (e: any) { showToast(e.response?.data?.detail || e.message, false); }
                }} color={theme.accent}>
                  📨 Notify
                </Btn>
              </div>

              <Btn color={theme.success} onClick={async () => {
                try { const r = await transferApi.execute(estate.id); showToast(`Transfers executed — ${r.results?.length ?? 0} legs`); }
                catch (e: any) { showToast(e.response?.data?.detail || e.message, false); }
              }}>💸 Execute Transfers</Btn>

              <div style={{
                padding: "10px 12px", borderRadius: theme.radiusSm,
                background: theme.infoLight, border: `1px solid #BAE6FD`,
                fontSize: 12, color: "#0369A1", lineHeight: 1.5,
              }}>
                ℹ️ Approval URL prints to the API console in dev mode.
                Set <code>USE_REAL_SES=true</code> to send actual emails.
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {tab === "willscan"      && <WillScanPanel estateId={estate.id} showToast={showToast} />}
      {tab === "documents"     && <DocumentsPanel estateId={estate.id} showToast={showToast} />}
      {tab === "beneficiaries" && <BeneficiariesPanel estateId={estate.id} showToast={showToast} />}
      {tab === "distribution"  && <DistributionPanel estateId={estate.id} showToast={showToast} totalRm={estate.total_rm} />}
      {tab === "transfers"     && <TransfersPanel estateId={estate.id} />}
      {tab === "legal"         && <LegalPanel estate={estate} showToast={showToast} />}
      {tab === "audit"         && <AuditLogPanel estateId={estate.id} />}
    </div>
  );
}

// ── Will Scan sub-panel ───────────────────────────────────────────────────────
function WillScanPanel({ estateId, showToast }: { estateId: string; showToast: (m: string, ok?: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleScan() {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("estate_id", estateId);
    fd.append("file", file);
    try {
      const res = await fetch("http://localhost:8001/scan", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || JSON.stringify(data));
      setResult(data);
      showToast("Will scanned successfully");
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setUploading(false);
    }
  }

  return (
    <GlassCard title="Will Document Scanner" subtitle="Upload a PDF or image — ML extracts beneficiary clauses automatically" accent>
      {/* Drop zone */}
      <label
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
        style={{
          display: "block", cursor: "pointer", marginBottom: 16,
          border: `2px dashed ${dragOver ? theme.accent : file ? theme.success : theme.border}`,
          borderRadius: theme.radius, padding: "36px 20px", textAlign: "center",
          background: dragOver ? theme.accentLight : file ? theme.successLight : theme.bg,
          transition: "all 0.2s",
        }}
      >
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.tiff" style={{ display: "none" }}
          onChange={e => setFile(e.target.files?.[0] || null)} />
        {file ? (
          <>
            <div style={{ fontSize: 36, marginBottom: 6 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.success }}>{file.name}</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>
              {(file.size / 1024).toFixed(1)} KB · click to change
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 36, marginBottom: 6 }}>📁</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: theme.textSecondary }}>
              Drop will document here, or <span style={{ color: theme.accent, fontWeight: 600 }}>browse</span>
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>PDF · JPG · PNG · TIFF — max 20 MB</div>
          </>
        )}
      </label>

      <button onClick={handleScan} disabled={!file || uploading} style={{
        padding: "10px 24px", borderRadius: theme.radiusSm, border: "none",
        background: (!file || uploading) ? theme.border : theme.accentGrad,
        color: (!file || uploading) ? theme.textMuted : "#fff",
        fontWeight: 600, fontSize: 13, cursor: file && !uploading ? "pointer" : "not-allowed",
        boxShadow: file && !uploading ? `0 2px 8px ${theme.accentGlow}` : "none",
        fontFamily: "inherit", transition: "all 0.15s",
      }}>
        {uploading ? "⟳ Scanning…" : "🔍 Scan Will Document"}
      </button>

      {result && <AiResultPanel result={result} onNext={() => showToast("Switch to Beneficiaries tab to add claimants")} />}
    </GlassCard>
  );
}

// ── Documents sub-panel ───────────────────────────────────────────────────────
const DOC_TYPES = ["WILL", "DEATH_CERTIFICATE", "COURT_ORDER", "ID_COPY", "OTHER"];

function DocumentsPanel({ estateId, showToast }: { estateId: string; showToast: (m: string, ok?: boolean) => void }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("WILL");
  const [uploadedBy, setUploadedBy] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);
  const [reviewedBy, setReviewedBy] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  async function loadDocs() {
    try {
      setLoading(true);
      const data = await documentApi.list(estateId);
      setDocs(data);
    } catch { /* silent */ } finally { setLoading(false); }
  }

  useEffect(() => { loadDocs(); }, [estateId]);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const doc = await documentApi.upload(estateId, file, docType, uploadedBy || undefined);
      setDocs(prev => [doc, ...prev]);
      setFile(null);
      showToast(`${doc.filename} uploaded — pending review`);
    } catch (e: any) {
      showToast(e.response?.data?.detail || e.message, false);
    } finally { setUploading(false); }
  }

  async function handleReview(action: "approve" | "reject") {
    if (!reviewTarget || !reviewedBy) return showToast("Reviewer name required", false);
    setReviewing(true);
    try {
      const updated = await documentApi.review(estateId, reviewTarget.id, action, reviewedBy, reviewNotes || undefined);
      setDocs(prev => prev.map(d => d.id === updated.id ? updated : d));
      setReviewTarget(null); setReviewedBy(""); setReviewNotes("");
      showToast(`Document ${action === "approve" ? "approved" : "rejected"}`);
    } catch (e: any) {
      showToast(e.response?.data?.detail || e.message, false);
    } finally { setReviewing(false); }
  }

  const statusColor: Record<string, string> = {
    PENDING_REVIEW: theme.warn,
    APPROVED: theme.success,
    REJECTED: theme.error,
  };
  const statusBg: Record<string, string> = {
    PENDING_REVIEW: theme.warnLight,
    APPROVED: theme.successLight,
    REJECTED: theme.errorLight,
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Upload card */}
      <GlassCard title="Upload Legal Document" subtitle="PDF, JPG, PNG — max 20 MB" accent>
        <label
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
          style={{
            display: "block", cursor: "pointer", marginBottom: 14,
            border: `2px dashed ${dragOver ? theme.accent : file ? theme.success : theme.border}`,
            borderRadius: theme.radius, padding: "28px 16px", textAlign: "center",
            background: dragOver ? theme.accentLight : file ? theme.successLight : theme.bg,
            transition: "all 0.2s",
          }}
        >
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.tiff,.docx"
            style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <>
              <div style={{ fontSize: 28, marginBottom: 4 }}>📎</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.success }}>{file.name}</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                {(file.size / 1024).toFixed(1)} KB · click to change
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 4 }}>📁</div>
              <div style={{ fontSize: 13, color: theme.textSecondary }}>
                Drop document here or <span style={{ color: theme.accent, fontWeight: 600 }}>browse</span>
              </div>
            </>
          )}
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Document Type
            </span>
            <select value={docType} onChange={e => setDocType(e.target.value)} style={{
              padding: "9px 12px", borderRadius: theme.radiusSm,
              border: `1px solid ${theme.border}`, background: "#fff",
              color: theme.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none",
            }}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Uploaded By (optional)
            </span>
            <input value={uploadedBy} onChange={e => setUploadedBy(e.target.value)}
              placeholder="e.g. Ahmad, Legal Dept…"
              style={{
                padding: "9px 12px", borderRadius: theme.radiusSm,
                border: `1px solid ${theme.border}`, background: "#fff",
                color: theme.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = theme.accent}
              onBlur={e => e.target.style.borderColor = theme.border}
            />
          </label>

          <button onClick={handleUpload} disabled={!file || uploading} style={{
            padding: "10px 20px", borderRadius: theme.radiusSm, border: "none",
            background: (!file || uploading) ? theme.border : theme.accentGrad,
            color: (!file || uploading) ? theme.textMuted : "#fff",
            fontWeight: 600, fontSize: 13, cursor: file && !uploading ? "pointer" : "not-allowed",
            fontFamily: "inherit", transition: "all 0.15s",
          }}>
            {uploading ? "⟳ Uploading…" : "⬆ Upload Document"}
          </button>
        </div>
      </GlassCard>

      {/* Document list */}
      <GlassCard title="Uploaded Documents" subtitle={`${docs.length} document${docs.length !== 1 ? "s" : ""}`}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: theme.textMuted, fontSize: 13 }}>Loading…</div>
        ) : docs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🗂️</div>
            <div style={{ fontSize: 13, color: theme.textMuted }}>No documents uploaded yet</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {docs.map(doc => (
              <div key={doc.id} style={{
                padding: "12px 14px", borderRadius: theme.radiusSm,
                border: `1px solid ${theme.borderLight}`,
                background: "#FAFAFA",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      📎 {doc.filename}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                      {doc.document_type.replace(/_/g, " ")} · {doc.file_size_bytes ? `${(doc.file_size_bytes / 1024).toFixed(1)} KB` : "—"}
                      {doc.uploaded_by ? ` · ${doc.uploaded_by}` : ""}
                    </div>
                    {doc.reviewer_notes && (
                      <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4, fontStyle: "italic" }}>
                        "{doc.reviewer_notes}"
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                      background: statusBg[doc.status] || theme.bg,
                      color: statusColor[doc.status] || theme.textMuted,
                      border: `1px solid ${statusColor[doc.status] || theme.border}40`,
                    }}>
                      {doc.status.replace(/_/g, " ")}
                    </span>
                    <div style={{ display: "flex", gap: 5 }}>
                      {doc.download_url && (
                        <a href={doc.download_url} target="_blank" rel="noreferrer" style={{
                          fontSize: 11, fontWeight: 600, color: theme.accent,
                          padding: "3px 8px", borderRadius: 6,
                          border: `1px solid ${theme.accentLight}`, background: theme.accentLight,
                          textDecoration: "none",
                        }}>View</a>
                      )}
                      {doc.status === "PENDING_REVIEW" && (
                        <button onClick={() => setReviewTarget(doc)} style={{
                          fontSize: 11, fontWeight: 600, color: "#6D28D9",
                          padding: "3px 8px", borderRadius: 6,
                          border: "1px solid #DDD6FE", background: "#EDE9FE",
                          cursor: "pointer", fontFamily: "inherit",
                        }}>Review</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Review modal overlay */}
      {reviewTarget && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={e => { if (e.target === e.currentTarget) setReviewTarget(null); }}>
          <div style={{
            background: "#fff", borderRadius: theme.radiusLg,
            boxShadow: theme.shadowLg, padding: 28, width: 440,
            animation: "fadeInUp 0.18s ease",
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>
              Review Document
            </h3>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 18 }}>
              📎 {reviewTarget.filename} · {reviewTarget.document_type.replace(/_/g, " ")}
            </div>

            {reviewTarget.download_url && (
              <a href={reviewTarget.download_url} target="_blank" rel="noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18,
                fontSize: 12, fontWeight: 600, color: theme.accent,
                padding: "6px 12px", borderRadius: 8,
                border: `1px solid ${theme.accentLight}`, background: theme.accentLight,
                textDecoration: "none",
              }}>
                🔗 Open document
              </a>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Reviewer Name <span style={{ color: theme.error }}>*</span>
                </span>
                <input value={reviewedBy} onChange={e => setReviewedBy(e.target.value)}
                  placeholder="Your name or employee ID"
                  style={{
                    padding: "9px 12px", borderRadius: theme.radiusSm,
                    border: `1px solid ${theme.border}`, fontSize: 13, fontFamily: "inherit", outline: "none",
                  }}
                  onFocus={e => e.target.style.borderColor = theme.accent}
                  onBlur={e => e.target.style.borderColor = theme.border}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Notes (optional)
                </span>
                <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Any observations or rejection reason…"
                  rows={3}
                  style={{
                    padding: "9px 12px", borderRadius: theme.radiusSm,
                    border: `1px solid ${theme.border}`, fontSize: 13, fontFamily: "inherit",
                    resize: "vertical", outline: "none",
                  }}
                  onFocus={e => e.target.style.borderColor = theme.accent}
                  onBlur={e => e.target.style.borderColor = theme.border}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleReview("approve")} disabled={reviewing} style={{
                flex: 1, padding: "10px", borderRadius: theme.radiusSm, border: "none",
                background: theme.success, color: "#fff",
                fontWeight: 600, fontSize: 13, cursor: reviewing ? "not-allowed" : "pointer",
                fontFamily: "inherit", opacity: reviewing ? 0.6 : 1,
              }}>
                ✓ Approve
              </button>
              <button onClick={() => handleReview("reject")} disabled={reviewing} style={{
                flex: 1, padding: "10px", borderRadius: theme.radiusSm, border: "none",
                background: theme.error, color: "#fff",
                fontWeight: 600, fontSize: 13, cursor: reviewing ? "not-allowed" : "pointer",
                fontFamily: "inherit", opacity: reviewing ? 0.6 : 1,
              }}>
                ✗ Reject
              </button>
              <button onClick={() => setReviewTarget(null)} style={{
                padding: "10px 16px", borderRadius: theme.radiusSm,
                border: `1px solid ${theme.border}`, background: "#fff",
                color: theme.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Result Panel ───────────────────────────────────────────────────────────
function AiResultPanel({ result, onNext }: { result: any; onNext: () => void }) {
  const bens: any[] = result.will_data?.beneficiaries ?? [];
  const pipeline = result.will_data?.ner_pipeline;
  const needsReview = result.needs_human_review;

  function confColor(c: number) {
    if (c >= 0.85) return theme.success;
    if (c >= 0.70) return theme.warn;
    return theme.error;
  }

  return (
    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {needsReview && (
        <div style={{ padding: "10px 14px", borderRadius: theme.radiusSm, background: theme.warnLight, border: `1px solid #FDE68A`, color: "#92400E", fontSize: 13, fontWeight: 500, display: "flex", gap: 8 }}>
          ⚠️ <strong>Manual review required</strong> — confidence below threshold or allocation mismatch
        </div>
      )}

      {/* Pipeline stats */}
      {pipeline && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "OCR Engine",       value: pipeline.ocr_engine  },
            { label: "NER Model",        value: pipeline.ner_model   },
            { label: "Tokens Processed", value: pipeline.tokens_processed?.toLocaleString() },
            { label: "Processing Time",  value: `${pipeline.processing_ms} ms` },
          ].map(k => (
            <div key={k.label} style={{ padding: "10px 12px", borderRadius: theme.radiusSm, background: "#0F172A", border: "1px solid #1E293B" }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#86EFAC", fontFamily: theme.fontMono }}>{k.value ?? "—"}</div>
            </div>
          ))}
        </div>
      )}

      {/* Extracted clauses */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
          Extracted Beneficiary Clauses ({bens.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {bens.map((b, i) => (
            <div key={i} style={{ padding: "12px 14px", borderRadius: theme.radiusSm, background: "#fff", border: `1px solid ${theme.borderLight}`, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: theme.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: theme.accent, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{b.name || "Unknown"}</div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                  {b.nic ? `IC: ${b.nic} · ` : ""}{b.type?.toUpperCase()}
                  {b.fraction !== undefined && ` · ${(b.fraction * 100).toFixed(0)}%`}
                  {b.fixed_rm !== undefined && ` · RM ${Number(b.fixed_rm).toLocaleString("en-MY")}`}
                </div>
              </div>
              {/* Confidence bar */}
              <div style={{ minWidth: 120 }}>
                <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 4 }}>
                  NER Confidence: <strong style={{ color: confColor(b.confidence ?? 0) }}>{((b.confidence ?? 0) * 100).toFixed(0)}%</strong>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: theme.borderLight, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(b.confidence ?? 0) * 100}%`, background: confColor(b.confidence ?? 0), borderRadius: 3, transition: "width 0.6s ease" }} />
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: b.type === "percentage" ? theme.infoLight : b.type === "fixed" ? theme.successLight : theme.warnLight, color: b.type === "percentage" ? theme.info : b.type === "fixed" ? theme.success : theme.warn, whiteSpace: "nowrap" }}>
                {b.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Allocation summary */}
      {result.will_data?.total_pct !== undefined && (
        <div style={{ padding: "10px 14px", borderRadius: theme.radiusSm, background: theme.bg, border: `1px solid ${theme.border}`, display: "flex", gap: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: theme.textSecondary }}>Total allocated: <strong style={{ color: theme.textPrimary }}>{(result.will_data.total_pct * 100).toFixed(0)}%</strong></span>
          {result.will_data.overallocation_warning && <span style={{ fontSize: 12, color: theme.error, fontWeight: 600 }}>⚠️ Overallocation detected</span>}
          {!result.will_data.overallocation_warning && result.will_data.total_pct <= 1 && <span style={{ fontSize: 12, color: theme.success, fontWeight: 600 }}>✓ Allocation valid</span>}
        </div>
      )}

      {/* Next step CTA */}
      <div style={{ padding: "14px 16px", borderRadius: theme.radiusSm, background: theme.infoLight, border: `1px solid #BAE6FD`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0369A1" }}>Next step: Add beneficiary claims</div>
          <div style={{ fontSize: 11, color: "#0369A1", marginTop: 2 }}>Switch to the Beneficiaries tab to register each heir and start KYC</div>
        </div>
        <button onClick={onNext} style={{ padding: "8px 16px", borderRadius: theme.radiusSm, border: "none", background: theme.accent, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          Go to Beneficiaries →
        </button>
      </div>
    </div>
  );
}

// ── Per-estate Audit Log panel ────────────────────────────────────────────────
function AuditLogPanel({ estateId }: { estateId: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    estateApi.auditLog(estateId).then(setEvents).catch(() => {}).finally(() => setLoading(false));
  }, [estateId]);

  const ACTION_META: Record<string, { icon: string; color: string }> = {
    ESTATE_CREATED: { icon: "📋", color: theme.accent }, ACCOUNT_FROZEN: { icon: "🔒", color: "#8B5CF6" },
    ASSET_DISCOVERY_DONE: { icon: "🔍", color: theme.info }, DOCUMENT_UPLOADED: { icon: "📎", color: theme.info },
    CLAIM_SUBMITTED: { icon: "👤", color: theme.accent }, WILL_SCANNED: { icon: "🤖", color: "#8B5CF6" },
    KYC_APPROVED: { icon: "✅", color: theme.success }, KYC_REJECTED: { icon: "❌", color: theme.error },
    SHARES_CALCULATED: { icon: "⚖️", color: theme.warn }, ADVISOR_DISPATCHED: { icon: "📨", color: theme.warn },
    LEGAL_APPROVED: { icon: "🔏", color: theme.success }, LEGAL_REJECTED: { icon: "🚫", color: theme.error },
    TRANSFER_SETTLED: { icon: "💰", color: theme.success }, ESTATE_CLOSED: { icon: "🏁", color: theme.success },
    FRAUD_VELOCITY_BLOCK: { icon: "⚠️", color: theme.error },
  };

  return (
    <GlassCard title="Estate Activity Log" subtitle="Chronological record of all actions on this estate">
      {loading ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: theme.textMuted, fontSize: 13 }}>Loading…</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 13, color: theme.textMuted }}>No audit events yet</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {events.map((ev, idx) => {
            const meta = ACTION_META[ev.action] ?? { icon: "📝", color: theme.textMuted };
            const isLast = idx === events.length - 1;
            return (
              <div key={ev.id} style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${meta.color}15`, border: `2px solid ${meta.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, zIndex: 1 }}>{meta.icon}</div>
                  {!isLast && <div style={{ width: 2, flex: 1, background: theme.borderLight, minHeight: 10 }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: isLast ? 0 : 8, paddingTop: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, fontFamily: theme.fontMono }}>{ev.action}</span>
                    <span style={{ fontSize: 10, color: theme.textMuted }}>{new Date(ev.created_at).toLocaleString("en-MY")}</span>
                  </div>
                  {ev.payload && Object.keys(ev.payload).length > 0 && (
                    <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {Object.entries(ev.payload).map(([k, v]) => (
                        <span key={k} style={{ fontSize: 10, color: theme.textSecondary }}>
                          <span style={{ color: theme.textMuted }}>{k}:</span> <span style={{ fontFamily: theme.fontMono }}>{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}

// ── Beneficiaries panel ───────────────────────────────────────────────────────
function BeneficiariesPanel({ estateId, showToast }: { estateId: string; showToast: (m: string, ok?: boolean) => void }) {
  const [bens, setBens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", nic: "", email: "", contact_number: "", wallet_id: "", transfer_method: "TNG" });

  async function load() {
    try { setBens(await estateApi.beneficiaries(estateId)); }
    catch { /* silent */ } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [estateId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    try {
      await claimApi.submit({ ...form, estate_id: estateId });
      showToast("Beneficiary claim submitted");
      setAdding(false);
      setForm({ name: "", nic: "", email: "", contact_number: "", wallet_id: "", transfer_method: "TNG" });
      load();
    } catch (err: any) { showToast(err.response?.data?.detail || err.message, false); }
    finally { setSubmitting(false); }
  }

  async function handleApprove(id: string) {
    try { await claimApi.approve(id); showToast("KYC approved"); load(); }
    catch (err: any) { showToast(err.response?.data?.detail || err.message, false); }
  }

  async function handleReject(id: string) {
    const reason = window.prompt("Rejection reason (min 10 chars):");
    if (!reason || reason.length < 10) return showToast("Reason too short", false);
    try { await claimApi.reject(id, reason); showToast("KYC rejected"); load(); }
    catch (err: any) { showToast(err.response?.data?.detail || err.message, false); }
  }

  const kycColor: Record<string, string> = { PENDING: theme.warn, ID_VERIFIED: theme.info, BIOMETRIC_CONFIRMED: "#8B5CF6", APPROVED: theme.success, REJECTED: theme.error };
  const kycBg: Record<string, string>    = { PENDING: theme.warnLight, ID_VERIFIED: theme.infoLight, BIOMETRIC_CONFIRMED: "#EDE9FE", APPROVED: theme.successLight, REJECTED: theme.errorLight };

  const fld = (name: string, label: string, placeholder: string, required = true, type = "text") => (
    <label key={name} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}{required && <span style={{ color: theme.error }}> *</span>}
      </span>
      <input type={type} placeholder={placeholder} required={required}
        value={(form as any)[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
        style={{ padding: "8px 12px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 13, fontFamily: "inherit", outline: "none" }}
        onFocus={e => e.target.style.borderColor = theme.accent}
        onBlur={e => e.target.style.borderColor = theme.border}
      />
    </label>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {adding && (
        <GlassCard title="Add Beneficiary Claim" accent>
          <form onSubmit={handleAdd}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              {fld("name", "Full Name", "Ahmad bin Yusof")}
              {fld("nic", "IC Number", "900101-14-1234")}
              {fld("email", "Email", "ahmad@email.com")}
              {fld("contact_number", "Phone", "+601x-xxxxxxx", false)}
              {fld("wallet_id", "TNG Wallet ID", "acc_ben_001", false)}
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Transfer Method</span>
                <select value={form.transfer_method} onChange={e => setForm(p => ({ ...p, transfer_method: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff" }}>
                  <option value="TNG">TNG eWallet</option>
                  <option value="WISE">Wise (FX)</option>
                </select>
              </label>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={submitting} style={{ padding: "9px 18px", borderRadius: theme.radiusSm, border: "none", background: theme.accentGrad, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: submitting ? 0.6 : 1 }}>
                {submitting ? "Submitting…" : "Submit Claim"}
              </button>
              <button type="button" onClick={() => setAdding(false)} style={{ padding: "9px 18px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, background: "#fff", color: theme.textSecondary, fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      <GlassCard
        title="Beneficiaries"
        subtitle={`${bens.length} claim${bens.length !== 1 ? "s" : ""} registered`}
        action={!adding ? <button onClick={() => setAdding(true)} style={{ padding: "7px 14px", borderRadius: theme.radiusSm, border: "none", background: theme.accentGrad, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>+ Add Claim</button> : undefined}
      >
        {loading ? <div style={{ padding: "32px 0", textAlign: "center", color: theme.textMuted, fontSize: 13 }}>Loading…</div>
          : bens.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
              <div style={{ fontSize: 13, color: theme.textMuted }}>No beneficiary claims yet</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.borderLight}` }}>
                  {["Name", "NIC", "Email", "Method", "KYC Status", "Actions"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bens.map(b => (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${theme.borderLight}` }}>
                    <td style={{ padding: "12px 12px", fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{b.name}</td>
                    <td style={{ padding: "12px 12px", fontSize: 12, fontFamily: theme.fontMono, color: theme.textSecondary }}>{b.nic}</td>
                    <td style={{ padding: "12px 12px", fontSize: 12, color: theme.textSecondary }}>{b.email}</td>
                    <td style={{ padding: "12px 12px", fontSize: 12, color: theme.textSecondary }}>{b.transfer_method}</td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: kycBg[b.kyc_status] || theme.bg, color: kycColor[b.kyc_status] || theme.textMuted, border: `1px solid ${kycColor[b.kyc_status] || theme.border}40` }}>
                        {b.kyc_status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      {["ID_VERIFIED", "BIOMETRIC_CONFIRMED"].includes(b.kyc_status) && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => handleApprove(b.id)} style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, border: "none", background: theme.success, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Approve</button>
                          <button onClick={() => handleReject(b.id)} style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, border: "none", background: theme.error, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Reject</button>
                        </div>
                      )}
                      {b.rejection_reason && <span style={{ fontSize: 11, color: theme.error }}>{b.rejection_reason}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </GlassCard>
    </div>
  );
}

// ── Distribution panel ────────────────────────────────────────────────────────
function DistributionPanel({ estateId, showToast, totalRm }: { estateId: string; showToast: (m: string, ok?: boolean) => void; totalRm: number }) {
  const [instructions, setInstructions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try { setInstructions(await estateApi.shareInstructions(estateId)); }
    catch { /* silent */ } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [estateId]);

  const statusColor: Record<string, string> = { PENDING: theme.warn, APPROVED: theme.info, EXECUTING: "#8B5CF6", COMPLETED: theme.success, FAILED: theme.error };
  const statusBg: Record<string, string>    = { PENDING: theme.warnLight, APPROVED: theme.infoLight, EXECUTING: "#EDE9FE", COMPLETED: theme.successLight, FAILED: theme.errorLight };

  const totalAllocated = instructions.reduce((s, i) => s + i.share_rm, 0);

  return (
    <GlassCard title="Share Distribution" subtitle="Computed allocation per beneficiary" accent>
      {loading ? <div style={{ padding: "32px 0", textAlign: "center", color: theme.textMuted, fontSize: 13 }}>Loading…</div>
        : instructions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚖️</div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>No share instructions yet</div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>Go to <strong>Overview → Calculate Share Distribution</strong> after beneficiaries are approved</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total Estate", value: `RM ${Number(totalRm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}`, color: theme.accent },
                { label: "Allocated", value: `RM ${totalAllocated.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`, color: theme.success },
                { label: "Beneficiaries", value: instructions.length, color: "#8B5CF6" },
              ].map(k => (
                <div key={k.label} style={{ padding: "14px 16px", borderRadius: theme.radiusSm, background: theme.bg, border: `1px solid ${theme.borderLight}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.borderLight}` }}>
                  {["Beneficiary", "Share (RM)", "Method", "FX", "Status"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {instructions.map(si => (
                  <tr key={si.id} style={{ borderBottom: `1px solid ${theme.borderLight}` }}>
                    <td style={{ padding: "12px 12px", fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{si.beneficiary_name}</td>
                    <td style={{ padding: "12px 12px", fontSize: 13, fontFamily: theme.fontMono, color: theme.textSecondary }}>
                      RM {Number(si.share_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "12px 12px", fontSize: 12, color: theme.textSecondary }}>{si.transfer_method}</td>
                    <td style={{ padding: "12px 12px", fontSize: 12, color: theme.textSecondary }}>
                      {si.fx_currency ? `${si.fx_currency} ${si.fx_amount ? Number(si.fx_amount).toFixed(2) : "—"}` : "—"}
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: statusBg[si.status] || theme.bg, color: statusColor[si.status] || theme.textMuted, border: `1px solid ${statusColor[si.status] || theme.border}40` }}>
                        {si.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
    </GlassCard>
  );
}

// ── Transfers panel ───────────────────────────────────────────────────────────
function TransfersPanel({ estateId }: { estateId: string }) {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    estateApi.transfers(estateId)
      .then(setTransfers).catch(() => {}).finally(() => setLoading(false));
  }, [estateId]);

  const statusColor: Record<string, string> = { PENDING: theme.warn, EXECUTING: "#8B5CF6", COMPLETED: theme.info, SETTLED: theme.success, FAILED: theme.error };
  const statusBg: Record<string, string>    = { PENDING: theme.warnLight, EXECUTING: "#EDE9FE", COMPLETED: theme.infoLight, SETTLED: theme.successLight, FAILED: theme.errorLight };

  return (
    <GlassCard title="Transfer Log" subtitle="Real-time disbursement status per beneficiary leg">
      {loading ? <div style={{ padding: "32px 0", textAlign: "center", color: theme.textMuted, fontSize: 13 }}>Loading…</div>
        : transfers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💸</div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>No transfers executed yet</div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>Transfers run after legal approval — use <strong>Overview → Execute Transfers</strong></div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.borderLight}` }}>
                {["Beneficiary", "Amount", "Method", "Ref", "Status", "Executed"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${theme.borderLight}` }}>
                  <td style={{ padding: "12px 12px", fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{t.beneficiary_name}</td>
                  <td style={{ padding: "12px 12px", fontSize: 13, fontFamily: theme.fontMono, color: theme.textSecondary }}>
                    RM {Number(t.share_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 12, color: theme.textSecondary }}>{t.method}</td>
                  <td style={{ padding: "12px 12px", fontSize: 11, fontFamily: theme.fontMono, color: theme.textMuted }}>
                    {t.external_ref ? t.external_ref.substring(0, 16) + "…" : "—"}
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: statusBg[t.status] || theme.bg, color: statusColor[t.status] || theme.textMuted, border: `1px solid ${statusColor[t.status] || theme.border}40` }}>
                      {t.status}
                    </span>
                    {t.error_message && <div style={{ fontSize: 11, color: theme.error, marginTop: 3 }}>{t.error_message}</div>}
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 12, color: theme.textMuted }}>
                    {t.executed_at ? new Date(t.executed_at).toLocaleString("en-MY") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </GlassCard>
  );
}

// ── Legal panel (approval queue) ──────────────────────────────────────────────
function LegalPanel({ estate, showToast }: { estate: any; showToast: (m: string, ok?: boolean) => void }) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [advisorEmail, setAdvisorEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    try { setApprovals(await estateApi.legalApprovals(estate.id)); }
    catch { /* silent */ } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [estate.id]);

  async function dispatch() {
    if (!advisorEmail) return showToast("Enter advisor email", false);
    setSending(true);
    try {
      await estateApi.dispatchAdvisor(estate.id, advisorEmail);
      showToast("Advisor notified — approval URL printed to API console");
      setAdvisorEmail("");
      load();
    } catch (err: any) { showToast(err.response?.data?.detail || err.message, false); }
    finally { setSending(false); }
  }

  const statusColor: Record<string, string> = { SENT: theme.warn, REVIEWED: theme.info, SIGNED: theme.success, REJECTED: theme.error };
  const statusBg: Record<string, string>    = { SENT: theme.warnLight, REVIEWED: theme.infoLight, SIGNED: theme.successLight, REJECTED: theme.errorLight };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 3-step explainer */}
      <GlassCard>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {[
            { step: "1", label: "Dispatch", desc: "Send a 72-hour approval email to the legal advisor", color: theme.accent },
            { step: "2", label: "Review", desc: "Advisor reviews computed share distribution via link", color: "#8B5CF6" },
            { step: "3", label: "Sign", desc: "SHA-256 signature hash locked to RDS audit log", color: theme.success },
          ].map(s => (
            <div key={s.step} style={{ padding: "14px", borderRadius: theme.radius, border: `1px solid ${s.color}30`, background: `${s.color}06` }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: s.color, marginBottom: 8 }}>{s.step}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Dispatch form */}
      <GlassCard title="Dispatch Advisor" subtitle="Estate must be in VERIFIED status" accent>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input value={advisorEmail} onChange={e => setAdvisorEmail(e.target.value)}
            placeholder="advisor@lawfirm.com"
            style={{ flex: 1, padding: "9px 12px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 13, fontFamily: "inherit", outline: "none" }}
            onFocus={e => e.target.style.borderColor = theme.accent}
            onBlur={e => e.target.style.borderColor = theme.border}
          />
          <button onClick={dispatch} disabled={sending} style={{ padding: "9px 18px", borderRadius: theme.radiusSm, border: "none", background: theme.accentGrad, color: "#fff", fontWeight: 600, fontSize: 13, cursor: sending ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: sending ? 0.6 : 1, whiteSpace: "nowrap" }}>
            {sending ? "Sending…" : "📨 Send Approval Email"}
          </button>
        </div>
        <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: theme.radiusSm, background: theme.infoLight, border: `1px solid #BAE6FD`, fontSize: 12, color: "#0369A1" }}>
          ℹ️ In dev mode the approval URL prints to the API terminal. Set <code>USE_REAL_SES=true</code> to send actual emails.
        </div>
      </GlassCard>

      {/* Approval queue */}
      <GlassCard title="Approval Queue" subtitle={`${approvals.length} dispatch${approvals.length !== 1 ? "es" : ""}`}>
        {loading ? <div style={{ padding: "24px 0", textAlign: "center", color: theme.textMuted, fontSize: 13 }}>Loading…</div>
          : approvals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔏</div>
              <div style={{ fontSize: 13, color: theme.textMuted }}>No approvals dispatched yet</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.borderLight}` }}>
                  {["Advisor", "Status", "Signed At", "Signature Hash"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approvals.map(a => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${theme.borderLight}` }}>
                    <td style={{ padding: "12px 12px", fontSize: 13, color: theme.textPrimary }}>{a.advisor_email}</td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: statusBg[a.status] || theme.bg, color: statusColor[a.status] || theme.textMuted, border: `1px solid ${statusColor[a.status] || theme.border}40` }}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 12px", fontSize: 12, color: theme.textMuted }}>
                      {a.signed_at ? new Date(a.signed_at).toLocaleString("en-MY") : "—"}
                    </td>
                    <td style={{ padding: "12px 12px", fontSize: 11, fontFamily: theme.fontMono, color: theme.textMuted }}>
                      {a.signature_hash ? a.signature_hash.substring(0, 16) + "…" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </GlassCard>
    </div>
  );
}

// ── Legal info sub-panel ──────────────────────────────────────────────────────
function LegalInfoPanel({ estate }: { estate: any }) {
  return (
    <GlassCard title="Legal Advisor Approval" subtitle="Review and approval gate before any disbursement">
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 18,
      }}>
        {[
          { step: "1", label: "Dispatch",  desc: "Advisor receives a 72-hour approval email",  color: theme.accent },
          { step: "2", label: "Review",    desc: "Advisor reviews the computed distribution",    color: "#8B5CF6" },
          { step: "3", label: "Sign",      desc: "e-Signature hash locked to RDS audit log",    color: theme.success },
        ].map(s => (
          <div key={s.step} style={{
            padding: "16px", borderRadius: theme.radius,
            border: `1px solid ${s.color}40`, background: `${s.color}08`,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6, background: `${s.color}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: s.color, marginBottom: 8,
            }}>{s.step}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>
      <div style={{
        padding: "12px 14px", borderRadius: theme.radiusSm,
        background: theme.infoLight, border: `1px solid #BAE6FD`,
        fontSize: 12, color: "#0369A1",
      }}>
        Estate must be in <StatusBadge status="VERIFIED" small /> status. Use the <strong>Overview → Notify Advisor</strong> action to dispatch.
        Current status: <strong>{estate.status}</strong>
      </div>
    </GlassCard>
  );
}
