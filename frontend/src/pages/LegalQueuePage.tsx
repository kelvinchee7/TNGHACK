import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { globalApi } from "../hooks/useApi";
import { GlassCard } from "../components/estate/GlassCard";
import { theme } from "../theme";

const STATUS_COLOR: Record<string, string> = { SENT: theme.warn, REVIEWED: theme.info, SIGNED: theme.success, REJECTED: theme.error };
const STATUS_BG:    Record<string, string> = { SENT: theme.warnLight, REVIEWED: theme.infoLight, SIGNED: theme.successLight, REJECTED: theme.errorLight };

function ApprovalBadge({ status }: { status: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 12,
      background: STATUS_BG[status] || theme.bg,
      color: STATUS_COLOR[status] || theme.textMuted,
      border: `1px solid ${STATUS_COLOR[status] || theme.border}30`,
      whiteSpace: "nowrap",
    }}>{status}</span>
  );
}

export function LegalQueuePage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    globalApi.legalQueue().then(setGroups).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const allStatuses = ["ALL", "SENT", "REVIEWED", "SIGNED", "REJECTED"];

  const filtered = groups.map(g => ({
    ...g,
    approvals: g.approvals.filter((a: any) => filter === "ALL" || a.status === filter),
  })).filter(g => g.approvals.length > 0);

  const total    = groups.reduce((s, g) => s + g.approvals.length, 0);
  const pending  = groups.reduce((s, g) => s + g.approvals.filter((a: any) => a.status === "SENT").length, 0);
  const signed   = groups.reduce((s, g) => s + g.approvals.filter((a: any) => a.status === "SIGNED").length, 0);
  const rejected = groups.reduce((s, g) => s + g.approvals.filter((a: any) => a.status === "REJECTED").length, 0);

  return (
    <div style={{ animation: "fadeInUp 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.4px" }}>Legal Queue</h1>
        <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 3 }}>Advisor approval pipeline across all estates</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Dispatched", value: total,    color: theme.accent   },
          { label: "Awaiting Review",  value: pending,  color: theme.warn     },
          { label: "Signed",           value: signed,   color: theme.success  },
          { label: "Rejected",         value: rejected, color: theme.error    },
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

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {allStatuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "7px 14px", borderRadius: theme.radiusSm, fontSize: 12, fontWeight: 600,
            border: filter === s ? "none" : `1px solid ${theme.border}`,
            background: filter === s ? theme.accent : "#fff",
            color: filter === s ? "#fff" : theme.textSecondary,
            cursor: "pointer", fontFamily: "inherit",
          }}>{s === "ALL" ? "All Statuses" : s}</button>
        ))}
      </div>

      {loading ? (
        <GlassCard><div style={{ padding: "48px 0", textAlign: "center", color: theme.textMuted }}>Loading…</div></GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard>
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⚖️</div>
            <div style={{ fontSize: 14, color: theme.textMuted }}>No legal approvals found</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>Dispatch advisors from an estate's Legal tab</div>
          </div>
        </GlassCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map(group => (
            <GlassCard key={group.estate_id}>
              {/* Estate header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${theme.borderLight}`,
                flexWrap: "wrap", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, background: "#EDE9FE",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                  }}>⚖️</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>{group.deceased_name}</div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>
                      RM {Number(group.total_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })} · {group.estate_status}
                    </div>
                  </div>
                </div>
                <Link to={`/estates/${group.estate_id}`} style={{
                  fontSize: 12, fontWeight: 600, color: theme.accent,
                  padding: "5px 12px", borderRadius: 6,
                  border: `1px solid ${theme.accentLight}`, background: theme.accentLight,
                }}>View Estate →</Link>
              </div>

              {/* Approval rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {group.approvals.map((a: any) => (
                  <div key={a.id} style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: theme.radiusSm,
                    background: STATUS_BG[a.status] ? `${STATUS_BG[a.status]}60` : theme.bg,
                    border: `1px solid ${STATUS_COLOR[a.status] || theme.border}25`,
                    flexWrap: "wrap", gap: 10,
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>
                          {a.advisor_email}
                        </span>
                        <ApprovalBadge status={a.status} />
                      </div>
                      <div style={{ fontSize: 11, color: theme.textMuted }}>
                        Dispatched {new Date(a.created_at).toLocaleString("en-MY")}
                        {a.signed_at && ` · Signed ${new Date(a.signed_at).toLocaleString("en-MY")}`}
                      </div>
                      {a.signature_hash && (
                        <div style={{ fontSize: 10, fontFamily: theme.fontMono, color: theme.textMuted, marginTop: 4 }}>
                          Sig: {a.signature_hash.substring(0, 24)}…
                        </div>
                      )}
                      {a.rejection_reason && (
                        <div style={{ fontSize: 11, color: theme.error, marginTop: 4 }}>
                          Reason: {a.rejection_reason}
                        </div>
                      )}
                    </div>
                    {a.status === "SIGNED" && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "4px 10px", borderRadius: 20,
                        background: theme.successLight, border: `1px solid #A7F3D0`,
                        fontSize: 11, fontWeight: 600, color: "#065F46",
                      }}>
                        ✓ Cryptographically signed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
