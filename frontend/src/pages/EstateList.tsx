import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEstates, estateApi, demoApi } from "../hooks/useApi";
import { GlassCard } from "../components/estate/GlassCard";
import { StatusBadge } from "../components/estate/StatusBadge";
import { theme } from "../theme";

const inputStyle: React.CSSProperties = {
  padding: "9px 12px", borderRadius: theme.radiusSm,
  border: `1px solid ${theme.border}`, background: "#fff",
  color: theme.textPrimary, fontSize: 13, outline: "none",
  width: "100%", transition: "border-color 0.15s", fontFamily: "inherit",
};

const btnPrimary: React.CSSProperties = {
  padding: "9px 18px", borderRadius: theme.radiusSm, border: "none",
  background: theme.accentGrad, color: "#fff",
  fontWeight: 600, fontSize: 13, cursor: "pointer",
  boxShadow: `0 2px 8px ${theme.accentGlow}`, fontFamily: "inherit",
  transition: "opacity 0.15s", whiteSpace: "nowrap",
};

const btnGhost: React.CSSProperties = {
  padding: "9px 18px", borderRadius: theme.radiusSm,
  border: `1px solid ${theme.border}`, background: "#fff",
  color: theme.textSecondary, fontWeight: 500, fontSize: 13,
  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
};

export function EstateList() {
  const { data: estates, loading, refetch } = useEstates();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState({ deceased_account_id: "", deceased_name: "", death_date: "", deceased_nic: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      await estateApi.create(form);
      setCreating(false);
      setForm({ deceased_account_id: "", deceased_name: "", death_date: "", deceased_nic: "" });
      refetch();
    } catch (err: any) { setError(err.response?.data?.detail || err.message); }
    finally { setSubmitting(false); }
  }

  const filtered = estates.filter((e: any) =>
    !filter || e.deceased_name.toLowerCase().includes(filter.toLowerCase()) || e.status === filter
  );

  // Counts for mini KPIs
  const active  = estates.filter((e: any) => !["CLOSED", "DISPUTED"].includes(e.status)).length;
  const closed  = estates.filter((e: any) => e.status === "CLOSED").length;
  const totalRm = estates.reduce((s: number, e: any) => s + (e.total_rm || 0), 0);

  return (
    <div style={{ animation: "fadeInUp 0.3s ease" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.4px" }}>Estates</h1>
          <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 3 }}>
            {estates.length} total estate{estates.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={async () => {
              setSeeding(true);
              try { const r = await demoApi.seed(); refetch(); navigate(`/estates/${r.estate_id}`); }
              catch (e: any) { alert(e.response?.data?.detail || e.message); }
              finally { setSeeding(false); }
            }}
            disabled={seeding}
            style={{ ...btnGhost, opacity: seeding ? 0.6 : 1 }}
          >{seeding ? "Seeding…" : "🤖 Run Demo"}</button>
          <button onClick={() => setCreating(c => !c)} style={btnPrimary}>+ New Estate</button>
        </div>
      </div>

      {/* Mini KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total",        value: estates.length, color: theme.accent  },
          { label: "Active",       value: active,         color: theme.warn    },
          { label: "Closed",       value: closed,         color: theme.success },
          { label: "Total Value",  value: `RM ${totalRm.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`, color: "#8B5CF6" },
        ].map(k => (
          <div key={k.label} style={{
            background: "#fff", borderRadius: theme.radiusSm,
            border: `1px solid ${theme.border}`, padding: "12px 16px",
            borderLeft: `3px solid ${k.color}`, boxShadow: theme.shadowSm,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.textPrimary }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {creating && (
        <GlassCard title="Open New Estate" subtitle="Register a deceased TNG account for probate processing" style={{ marginBottom: 16 }} accent>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 16 }}>
              {[
                { name: "deceased_name",       label: "Full Name",            placeholder: "Ahmad bin Yusof",  required: true },
                { name: "deceased_account_id", label: "TNG Account ID",       placeholder: "acc_deceased_001", required: true },
                { name: "deceased_nic",        label: "IC Number (optional)", placeholder: "900101-14-1234",   required: false },
                { name: "death_date",          label: "Date of Death",        placeholder: "",                 required: true, type: "date" },
              ].map(f => (
                <label key={f.name} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {f.label}{f.required && <span style={{ color: theme.error }}> *</span>}
                  </span>
                  <input type={f.type || "text"} placeholder={f.placeholder}
                    value={(form as any)[f.name]}
                    onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                    required={f.required} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = theme.accent}
                    onBlur={e => e.target.style.borderColor = theme.border}
                  />
                </label>
              ))}
            </div>
            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, background: theme.errorLight, color: "#991B1B", border: `1px solid #FECACA`, fontSize: 13 }}>{error}</div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? "Creating…" : "Create Estate"}
              </button>
              <button type="button" onClick={() => setCreating(false)} style={btnGhost}>Cancel</button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Table — full width */}
      <GlassCard
        action={
          <input value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Filter by name or status…"
            style={{ ...inputStyle, width: 220 }}
          />
        }
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.borderLight}` }}>
                {["Deceased", "Status", "Total RM", "Beneficiaries", "Opened", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 16px", fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>{[160, 100, 120, 60, 90, 60].map((w, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}>
                      <div style={{ height: 14, width: w, borderRadius: 6, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s ease-in-out infinite" }} />
                    </td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "48px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                  <div style={{ fontSize: 14, color: theme.textSecondary }}>No estates found</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>Click <strong>+ New Estate</strong> or <strong>🤖 Run Demo</strong> to get started</div>
                </td></tr>
              ) : filtered.map((e: any) => (
                <tr key={e.id} style={{ transition: "background 0.1s", borderBottom: `1px solid ${theme.borderLight}` }}
                  onMouseEnter={ev => ev.currentTarget.style.background = theme.bg}
                  onMouseLeave={ev => ev.currentTarget.style.background = ""}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{e.deceased_name}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono, marginTop: 2 }}>{e.id.substring(0, 8)}…</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <StatusBadge status={e.status} pulse={["SCANNING", "DISTRIBUTING"].includes(e.status)} />
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontFamily: theme.fontMono, color: theme.textSecondary, whiteSpace: "nowrap" }}>
                    RM {Number(e.total_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: theme.textSecondary }}>{e.beneficiary_count}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: theme.textMuted, whiteSpace: "nowrap" }}>
                    {new Date(e.created_at).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <Link to={`/estates/${e.id}`} style={{ fontSize: 12, fontWeight: 600, color: theme.accent, padding: "5px 12px", borderRadius: 6, border: `1px solid ${theme.accentLight}`, background: theme.accentLight }}>Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
