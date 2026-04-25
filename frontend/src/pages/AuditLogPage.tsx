import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { globalApi } from "../hooks/useApi";
import { GlassCard } from "../components/estate/GlassCard";
import { theme } from "../theme";

const ACTION_META: Record<string, { icon: string; color: string }> = {
  ESTATE_CREATED:       { icon: "📋", color: theme.accent   },
  ACCOUNT_FROZEN:       { icon: "🔒", color: "#8B5CF6"      },
  ASSET_DISCOVERY_DONE: { icon: "🔍", color: theme.info     },
  DOCUMENT_UPLOADED:    { icon: "📎", color: theme.info     },
  DOCUMENT_APPROVD:     { icon: "✅", color: theme.success  },
  CLAIM_SUBMITTED:      { icon: "👤", color: theme.accent   },
  WILL_SCANNED:         { icon: "🤖", color: "#8B5CF6"      },
  KYC_APPROVED:         { icon: "✅", color: theme.success  },
  KYC_REJECTED:         { icon: "❌", color: theme.error    },
  SHARES_CALCULATED:    { icon: "⚖️", color: theme.warn     },
  ADVISOR_DISPATCHED:   { icon: "📨", color: theme.warn     },
  LEGAL_APPROVED:       { icon: "🔏", color: theme.success  },
  LEGAL_REJECTED:       { icon: "🚫", color: theme.error    },
  TRANSFER_INITIATED:   { icon: "💸", color: "#8B5CF6"      },
  TRANSFER_SETTLED:     { icon: "💰", color: theme.success  },
  ESTATE_CLOSED:        { icon: "🏁", color: theme.success  },
  FRAUD_VELOCITY_BLOCK: { icon: "⚠️", color: theme.error    },
};

function SkeletonRow() {
  return (
    <tr>{[60, 180, 120, 100, 200].map((w, i) => (
      <td key={i} style={{ padding: "13px 16px" }}>
        <div style={{ height: 13, width: w, borderRadius: 6, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s ease-in-out infinite" }} />
      </td>
    ))}</tr>
  );
}

export function AuditLogPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    globalApi.audit(500).then(setEvents).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const uniqueActions = Array.from(new Set(events.map(e => e.action))).sort();

  const filtered = events.filter(e => {
    const ms = !search || e.action.toLowerCase().includes(search.toLowerCase()) || e.estate_id?.toLowerCase().includes(search.toLowerCase()) || e.actor_id?.toLowerCase().includes(search.toLowerCase());
    const ma = !actionFilter || e.action === actionFilter;
    return ms && ma;
  });

  // Summary counts
  const estateCount    = new Set(events.map(e => e.estate_id).filter(Boolean)).size;
  const fraudEvents    = events.filter(e => e.action === "FRAUD_VELOCITY_BLOCK").length;
  const transferEvents = events.filter(e => e.action.startsWith("TRANSFER")).length;

  return (
    <div style={{ animation: "fadeInUp 0.3s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.5px" }}>Audit Log</h1>
        <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
          Immutable record of every platform action — {events.length} events across {estateCount} estate{estateCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Events",    value: events.length,  icon: "📝", color: theme.accent  },
          { label: "Estates Covered", value: estateCount,    icon: "📋", color: "#8B5CF6"     },
          { label: "Transfer Events", value: transferEvents, icon: "💸", color: theme.success },
          { label: "Fraud Alerts",    value: fraudEvents,    icon: "⚠️", color: theme.error   },
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

      {/* Events table */}
      <GlassCard
        title="Event Timeline"
        subtitle="Most recent first — click estate ID to open record"
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search action or actor…"
              style={{ padding: "7px 11px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 12, fontFamily: "inherit", outline: "none", width: 180 }}
              onFocus={e => e.target.style.borderColor = theme.accent}
              onBlur={e => e.target.style.borderColor = theme.border}
            />
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 12, fontFamily: "inherit", outline: "none", background: "#fff", color: theme.textPrimary }}>
              <option value="">All Actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        }
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.borderLight}` }}>
                {["Time", "Action", "Actor", "Estate", "Payload"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 16px", fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "56px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: 14, color: theme.textSecondary, fontWeight: 500 }}>No audit events found</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>Run <strong>🤖 Run Demo</strong> from the Estates page to seed the log</div>
                </td></tr>
              ) : (
                filtered.map(ev => {
                  const meta = ACTION_META[ev.action] ?? { icon: "📝", color: theme.textMuted };
                  return (
                    <tr key={ev.id} style={{ borderBottom: `1px solid ${theme.borderLight}`, transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = theme.bg)}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: theme.textMuted, whiteSpace: "nowrap" }}>
                        <div>{new Date(ev.created_at).toLocaleDateString("en-MY", { day: "2-digit", month: "short" })}</div>
                        <div style={{ fontFamily: theme.fontMono }}>{new Date(ev.created_at).toLocaleTimeString("en-MY")}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontSize: 14 }}>{meta.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, fontFamily: theme.fontMono }}>{ev.action}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: theme.textSecondary }}>{ev.actor_id || <span style={{ color: theme.textMuted }}>system</span>}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {ev.estate_id ? (
                          <Link to={`/estates/${ev.estate_id}`} style={{ fontSize: 11, fontFamily: theme.fontMono, color: theme.accent, fontWeight: 600 }}>
                            {ev.estate_id.substring(0, 8)}…
                          </Link>
                        ) : <span style={{ color: theme.textMuted, fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {ev.payload && Object.keys(ev.payload).length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {Object.entries(ev.payload).slice(0, 3).map(([k, v]) => (
                              <span key={k} style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: theme.bg, border: `1px solid ${theme.borderLight}`, color: theme.textSecondary, whiteSpace: "nowrap" }}>
                                <span style={{ color: theme.textMuted }}>{k}:</span> <span style={{ fontFamily: theme.fontMono }}>{String(v).substring(0, 30)}</span>
                              </span>
                            ))}
                          </div>
                        ) : <span style={{ color: theme.textMuted, fontSize: 11 }}>—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
