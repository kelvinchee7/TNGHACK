import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { globalApi } from "../hooks/useApi";
import { GlassCard } from "../components/estate/GlassCard";
import { theme } from "../theme";

const STATUS_COLOR: Record<string, string> = { PENDING: theme.warn, EXECUTING: "#8B5CF6", COMPLETED: theme.info, SETTLED: theme.success, FAILED: theme.error };
const STATUS_BG:    Record<string, string> = { PENDING: theme.warnLight, EXECUTING: "#EDE9FE", COMPLETED: theme.infoLight, SETTLED: theme.successLight, FAILED: theme.errorLight };

export function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    globalApi.transfers().then(setTransfers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statuses = ["ALL", "PENDING", "EXECUTING", "COMPLETED", "SETTLED", "FAILED"];

  const filtered = transfers.filter(t => {
    const matchStatus = filter === "ALL" || t.status === filter;
    const matchSearch = !search ||
      t.deceased_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.beneficiary_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.external_ref?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const settled  = transfers.filter(t => t.status === "SETTLED").length;
  const failed   = transfers.filter(t => t.status === "FAILED").length;
  const pending  = transfers.filter(t => ["PENDING", "EXECUTING"].includes(t.status)).length;
  const totalRm  = transfers.filter(t => t.status === "SETTLED").reduce((s, t) => s + t.share_rm, 0);

  return (
    <div style={{ animation: "fadeInUp 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.4px" }}>Transfers</h1>
        <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 3 }}>All disbursement legs across all estates</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Legs",    value: transfers.length, color: theme.accent  },
          { label: "Settled",       value: settled,          color: theme.success },
          { label: "In Progress",   value: pending,          color: "#8B5CF6"     },
          { label: "Failed",        value: failed,           color: theme.error   },
        ].map(k => (
          <div key={k.label} style={{
            background: "#fff", borderRadius: theme.radiusLg,
            border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard,
            padding: "18px 20px", borderLeft: `4px solid ${k.color}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: theme.textPrimary }}>{k.value}</div>
          </div>
        ))}
      </div>

      {totalRm > 0 && (
        <div style={{
          padding: "14px 18px", borderRadius: theme.radiusLg, marginBottom: 20,
          background: theme.successLight, border: `1px solid #A7F3D0`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>💰</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#065F46" }}>
              RM {totalRm.toLocaleString("en-MY", { minimumFractionDigits: 2 })} settled
            </div>
            <div style={{ fontSize: 11, color: "#047857" }}>Total disbursed across all completed transfers</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, estate or reference…"
          style={{ padding: "8px 12px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", flex: 1, minWidth: 200 }}
          onFocus={e => e.target.style.borderColor = theme.accent}
          onBlur={e => e.target.style.borderColor = theme.border}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: "7px 12px", borderRadius: theme.radiusSm, fontSize: 11, fontWeight: 600,
              border: filter === s ? "none" : `1px solid ${theme.border}`,
              background: filter === s ? (STATUS_COLOR[s] || theme.accent) : "#fff",
              color: filter === s ? "#fff" : theme.textSecondary,
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
            }}>{s === "ALL" ? "All" : s}</button>
          ))}
        </div>
      </div>

      <GlassCard>
        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: theme.textMuted }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💸</div>
            <div style={{ fontSize: 14, color: theme.textMuted }}>No transfers found</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>Run demo seed or execute transfers from an estate</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.borderLight}` }}>
                  {["Estate", "Beneficiary", "Amount", "Method", "Reference", "Status", "Settled At"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = theme.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}>
                    <td style={{ padding: "11px 12px" }}>
                      <Link to={`/estates/${t.estate_id}`} style={{ fontSize: 12, fontWeight: 600, color: theme.accent }}>
                        {t.deceased_name}
                      </Link>
                    </td>
                    <td style={{ padding: "11px 12px", fontSize: 13, color: theme.textPrimary, fontWeight: 500 }}>{t.beneficiary_name}</td>
                    <td style={{ padding: "11px 12px", fontSize: 13, fontFamily: theme.fontMono, color: theme.textSecondary, whiteSpace: "nowrap" }}>
                      RM {Number(t.share_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                      {t.fx_currency && <span style={{ fontSize: 10, color: theme.textMuted, marginLeft: 4 }}>({t.fx_currency})</span>}
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                        background: t.method === "WISE" ? "#EDE9FE" : theme.accentLight,
                        color: t.method === "WISE" ? "#6D28D9" : theme.accent,
                      }}>{t.method}</span>
                    </td>
                    <td style={{ padding: "11px 12px", fontSize: 11, fontFamily: theme.fontMono, color: theme.textMuted }}>
                      {t.external_ref ? t.external_ref.substring(0, 18) + (t.external_ref.length > 18 ? "…" : "") : "—"}
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                        background: STATUS_BG[t.status] || theme.bg,
                        color: STATUS_COLOR[t.status] || theme.textMuted,
                        border: `1px solid ${STATUS_COLOR[t.status] || theme.border}30`,
                        whiteSpace: "nowrap",
                      }}>{t.status}</span>
                      {t.error_message && <div style={{ fontSize: 10, color: theme.error, marginTop: 3 }}>{t.error_message}</div>}
                    </td>
                    <td style={{ padding: "11px 12px", fontSize: 11, color: theme.textMuted, whiteSpace: "nowrap" }}>
                      {t.settled_at ? new Date(t.settled_at).toLocaleString("en-MY") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
