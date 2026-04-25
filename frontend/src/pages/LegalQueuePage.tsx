import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { globalApi } from "../hooks/useApi";
import { GlassCard } from "../components/estate/GlassCard";
import { theme } from "../theme";

const STATUS_COLOR: Record<string, string> = { SENT: theme.warn, REVIEWED: theme.info, SIGNED: theme.success, REJECTED: theme.error };
const STATUS_BG:    Record<string, string> = { SENT: theme.warnLight, REVIEWED: theme.infoLight, SIGNED: theme.successLight, REJECTED: theme.errorLight };

function SkeletonRow() {
  return (
    <tr>{[180, 100, 120, 160, 80].map((w, i) => (
      <td key={i} style={{ padding: "13px 16px" }}>
        <div style={{ height: 13, width: w, borderRadius: 6, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s ease-in-out infinite" }} />
      </td>
    ))}</tr>
  );
}

export function LegalQueuePage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    globalApi.legalQueue().then(setGroups).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const allApprovals = groups.flatMap(g => g.approvals);
  const pending  = allApprovals.filter(a => a.status === "SENT").length;
  const signed   = allApprovals.filter(a => a.status === "SIGNED").length;
  const rejected = allApprovals.filter(a => a.status === "REJECTED").length;

  const filteredGroups = groups.map(g => ({
    ...g,
    approvals: g.approvals.filter((a: any) => filter === "ALL" || a.status === filter),
  })).filter(g => g.approvals.length > 0);

  return (
    <div style={{ animation: "fadeInUp 0.3s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.5px" }}>Legal Queue</h1>
        <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>Advisor approval pipeline across all estates</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Dispatched", value: allApprovals.length, icon: "📨", color: theme.accent  },
          { label: "Awaiting Review",  value: pending,             icon: "⏳", color: theme.warn    },
          { label: "Signed",           value: signed,              icon: "🔏", color: theme.success },
          { label: "Rejected",         value: rejected,            icon: "🚫", color: theme.error   },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", borderRadius: theme.radiusLg, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, padding: "20px 22px", borderLeft: `4px solid ${k.color}`, animation: "fadeInUp 0.35s ease both" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.6px", lineHeight: 1 }}>{k.value}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${k.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <GlassCard
        title="Approval Queue"
        subtitle="Grouped by estate · advisor sign-off required before disbursement"
        action={
          <div style={{ display: "flex", gap: 6 }}>
            {["ALL", "SENT", "SIGNED", "REJECTED"].map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                padding: "6px 12px", borderRadius: theme.radiusSm, fontSize: 11, fontWeight: 600,
                border: filter === s ? "none" : `1px solid ${theme.border}`,
                background: filter === s ? (STATUS_COLOR[s] || theme.accent) : "#fff",
                color: filter === s ? "#fff" : theme.textSecondary,
                cursor: "pointer", fontFamily: "inherit",
              }}>{s === "ALL" ? "All" : s}</button>
            ))}
          </div>
        }
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.borderLight}` }}>
                {["Estate", "Advisor Email", "Status", "Dispatched", "Signed At", "Signature"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 16px", fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map(i => <SkeletonRow key={i} />)
              ) : filteredGroups.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "56px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⚖️</div>
                  <div style={{ fontSize: 14, color: theme.textSecondary, fontWeight: 500 }}>No legal approvals found</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>Dispatch advisors from an estate's <strong>Legal</strong> tab</div>
                </td></tr>
              ) : (
                filteredGroups.map(group => (
                  <React.Fragment key={group.estate_id}>
                    <tr>
                      <td colSpan={6} style={{ padding: "10px 16px 6px", background: theme.bg }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary }}>{group.deceased_name}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 10, background: theme.accentLight, color: theme.accent }}>{group.estate_status}</span>
                          <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono }}>RM {Number(group.total_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}</span>
                          <Link to={`/estates/${group.estate_id}`} style={{ fontSize: 11, color: theme.accent, fontWeight: 600 }}>View estate →</Link>
                        </div>
                      </td>
                    </tr>
                    {group.approvals.map((a: any) => (
                      <tr key={a.id} style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = theme.bg)}
                        onMouseLeave={e => (e.currentTarget.style.background = "")}>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono }}>{group.estate_id.substring(0, 8)}…</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{a.advisor_email}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: STATUS_BG[a.status] || theme.bg, color: STATUS_COLOR[a.status] || theme.textMuted, border: `1px solid ${STATUS_COLOR[a.status] || theme.border}30`, whiteSpace: "nowrap" }}>
                            {a.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: theme.textMuted, whiteSpace: "nowrap" }}>{new Date(a.created_at).toLocaleString("en-MY")}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: theme.textMuted, whiteSpace: "nowrap" }}>{a.signed_at ? new Date(a.signed_at).toLocaleString("en-MY") : "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 11, fontFamily: theme.fontMono, color: theme.textMuted }}>
                          {a.signature_hash ? a.signature_hash.substring(0, 16) + "…" : "—"}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
