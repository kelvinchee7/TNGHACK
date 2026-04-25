import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { globalApi } from "../hooks/useApi";
import { GlassCard } from "../components/estate/GlassCard";
import { theme } from "../theme";

const STATUS_COLOR: Record<string, string> = { PENDING: theme.warn, EXECUTING: "#8B5CF6", COMPLETED: theme.info, SETTLED: theme.success, FAILED: theme.error };
const STATUS_BG:    Record<string, string> = { PENDING: theme.warnLight, EXECUTING: "#EDE9FE", COMPLETED: theme.infoLight, SETTLED: theme.successLight, FAILED: theme.errorLight };

function SkeletonRow() {
  return (
    <tr>{[140, 120, 100, 60, 140, 80, 120].map((w, i) => (
      <td key={i} style={{ padding: "13px 16px" }}>
        <div style={{ height: 13, width: w, borderRadius: 6, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s ease-in-out infinite" }} />
      </td>
    ))}</tr>
  );
}

export function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    globalApi.transfers().then(setTransfers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const settled  = transfers.filter(t => t.status === "SETTLED").length;
  const inProg   = transfers.filter(t => ["PENDING", "EXECUTING"].includes(t.status)).length;
  const failed   = transfers.filter(t => t.status === "FAILED").length;
  const totalRm  = transfers.filter(t => t.status === "SETTLED").reduce((s, t) => s + t.share_rm, 0);

  const filtered = transfers.filter(t => {
    const ms = !search || t.deceased_name?.toLowerCase().includes(search.toLowerCase()) || t.beneficiary_name?.toLowerCase().includes(search.toLowerCase()) || t.external_ref?.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "ALL" || t.status === filter;
    return ms && mf;
  });

  return (
    <div style={{ animation: "fadeInUp 0.3s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.5px" }}>Transfers</h1>
        <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>All disbursement legs across every estate</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Legs",       value: transfers.length, icon: "💸", color: theme.accent  },
          { label: "Settled",          value: settled,          icon: "✅", color: theme.success },
          { label: "In Progress",      value: inProg,           icon: "⚡", color: "#8B5CF6"     },
          { label: "Total Disbursed",  value: `RM ${totalRm.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`, icon: "💰", color: theme.warn },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", borderRadius: theme.radiusLg, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, padding: "20px 22px", borderLeft: `4px solid ${k.color}`, animation: "fadeInUp 0.35s ease both" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: k.label === "Total Disbursed" ? 18 : 26, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.6px", lineHeight: 1 }}>{k.value}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${k.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <GlassCard
        title="Transfer Log"
        subtitle="Real-time disbursement status per beneficiary leg"
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or reference…"
              style={{ padding: "7px 11px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 12, fontFamily: "inherit", outline: "none", width: 200 }}
              onFocus={e => e.target.style.borderColor = theme.accent}
              onBlur={e => e.target.style.borderColor = theme.border}
            />
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 12, fontFamily: "inherit", outline: "none", background: "#fff", color: theme.textPrimary }}>
              {["ALL", "PENDING", "EXECUTING", "COMPLETED", "SETTLED", "FAILED"].map(s => (
                <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</option>
              ))}
            </select>
          </div>
        }
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.borderLight}` }}>
                {["Estate", "Beneficiary", "Amount", "Method", "Reference", "Status", "Settled At"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 16px", fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "56px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💸</div>
                  <div style={{ fontSize: 14, color: theme.textSecondary, fontWeight: 500 }}>No transfers found</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>Run <strong>🤖 Run Demo</strong> from the Estates page, then execute transfers from an estate</div>
                </td></tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${theme.borderLight}`, transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = theme.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}>
                    <td style={{ padding: "13px 16px" }}>
                      <Link to={`/estates/${t.estate_id}`} style={{ fontSize: 13, fontWeight: 600, color: theme.accent }}>{t.deceased_name}</Link>
                      <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono, marginTop: 2 }}>{t.estate_id.substring(0, 8)}…</div>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 500, color: theme.textPrimary }}>{t.beneficiary_name}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, fontFamily: theme.fontMono, color: theme.textSecondary, whiteSpace: "nowrap" }}>
                      RM {Number(t.share_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                      {t.fx_currency && <span style={{ fontSize: 10, color: theme.textMuted, marginLeft: 4 }}>({t.fx_currency})</span>}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: t.method === "WISE" ? "#EDE9FE" : theme.accentLight, color: t.method === "WISE" ? "#6D28D9" : theme.accent }}>{t.method}</span>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 11, fontFamily: theme.fontMono, color: theme.textMuted }}>
                      {t.external_ref ? t.external_ref.substring(0, 18) + (t.external_ref.length > 18 ? "…" : "") : "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: STATUS_BG[t.status] || theme.bg, color: STATUS_COLOR[t.status] || theme.textMuted, border: `1px solid ${STATUS_COLOR[t.status] || theme.border}30`, whiteSpace: "nowrap" }}>
                        {t.status}
                      </span>
                      {t.error_message && <div style={{ fontSize: 10, color: theme.error, marginTop: 3 }}>{t.error_message}</div>}
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 12, color: theme.textMuted, whiteSpace: "nowrap" }}>
                      {t.settled_at ? new Date(t.settled_at).toLocaleString("en-MY") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
