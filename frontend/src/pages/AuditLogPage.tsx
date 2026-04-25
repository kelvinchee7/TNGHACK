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
  KYC_id_upload:        { icon: "🪪", color: theme.info     },
  KYC_biometric:        { icon: "👁", color: "#8B5CF6"      },
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

function actionMeta(action: string) {
  return ACTION_META[action] ?? { icon: "📝", color: theme.textMuted };
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
    const matchSearch = !search ||
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.estate_id?.toLowerCase().includes(search.toLowerCase()) ||
      e.actor_id?.toLowerCase().includes(search.toLowerCase());
    const matchAction = !actionFilter || e.action === actionFilter;
    return matchSearch && matchAction;
  });

  // Group by date
  const grouped: Record<string, any[]> = {};
  for (const ev of filtered) {
    const date = new Date(ev.created_at).toLocaleDateString("en-MY", { day: "2-digit", month: "long", year: "numeric" });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(ev);
  }

  return (
    <div style={{ animation: "fadeInUp 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.4px" }}>System Audit Log</h1>
        <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 3 }}>
          Immutable record of all platform actions — {events.length} events
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search action, estate ID, actor…"
          style={{ padding: "8px 12px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", flex: 1, minWidth: 200 }}
          onFocus={e => e.target.style.borderColor = theme.accent}
          onBlur={e => e.target.style.borderColor = theme.border}
        />
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{
          padding: "8px 12px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`,
          fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", color: theme.textPrimary,
        }}>
          <option value="">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? (
        <GlassCard><div style={{ padding: "48px 0", textAlign: "center", color: theme.textMuted }}>Loading…</div></GlassCard>
      ) : Object.keys(grouped).length === 0 ? (
        <GlassCard>
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 14, color: theme.textMuted }}>No audit events yet</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>
              Run the demo seed from an estate page to populate the log
            </div>
          </div>
        </GlassCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {Object.entries(grouped).map(([date, evs]) => (
            <div key={date}>
              {/* Date separator */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
              }}>
                <div style={{ flex: 1, height: 1, background: theme.borderLight }} />
                <span style={{
                  fontSize: 11, fontWeight: 700, color: theme.textMuted,
                  textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap",
                  padding: "3px 10px", borderRadius: 12,
                  background: theme.bg, border: `1px solid ${theme.border}`,
                }}>{date}</span>
                <div style={{ flex: 1, height: 1, background: theme.borderLight }} />
              </div>

              {/* Timeline */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {evs.map((ev, idx) => {
                  const meta = actionMeta(ev.action);
                  const isLast = idx === evs.length - 1;
                  return (
                    <div key={ev.id} style={{ display: "flex", gap: 14 }}>
                      {/* Timeline line + dot */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: `${meta.color}15`,
                          border: `2px solid ${meta.color}40`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, flexShrink: 0, zIndex: 1,
                        }}>{meta.icon}</div>
                        {!isLast && <div style={{ width: 2, flex: 1, background: theme.borderLight, minHeight: 12 }} />}
                      </div>

                      {/* Event card */}
                      <div style={{
                        flex: 1, background: "#fff",
                        border: `1px solid ${theme.borderLight}`,
                        borderRadius: theme.radiusSm,
                        padding: "10px 14px",
                        marginBottom: isLast ? 0 : 8,
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <div>
                            <span style={{
                              fontSize: 12, fontWeight: 700,
                              color: meta.color,
                              fontFamily: theme.fontMono,
                            }}>{ev.action}</span>
                            {ev.actor_id && (
                              <span style={{ fontSize: 11, color: theme.textMuted, marginLeft: 8 }}>
                                by {ev.actor_id}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: theme.textMuted, whiteSpace: "nowrap" }}>
                            {new Date(ev.created_at).toLocaleTimeString("en-MY")}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                          {ev.estate_id && (
                            <Link to={`/estates/${ev.estate_id}`} style={{
                              fontSize: 10, fontFamily: theme.fontMono,
                              color: theme.accent, fontWeight: 600,
                            }}>
                              {ev.estate_id.substring(0, 8)}…
                            </Link>
                          )}
                          {ev.actor_ip && (
                            <span style={{ fontSize: 10, color: theme.textMuted, fontFamily: theme.fontMono }}>
                              {ev.actor_ip}
                            </span>
                          )}
                        </div>

                        {ev.payload && Object.keys(ev.payload).length > 0 && (
                          <div style={{
                            marginTop: 6, padding: "6px 8px", borderRadius: 6,
                            background: theme.bg, border: `1px solid ${theme.borderLight}`,
                            display: "flex", flexWrap: "wrap", gap: 8,
                          }}>
                            {Object.entries(ev.payload).map(([k, v]) => (
                              <span key={k} style={{ fontSize: 10, color: theme.textSecondary }}>
                                <span style={{ color: theme.textMuted }}>{k}:</span>{" "}
                                <span style={{ fontFamily: theme.fontMono, fontWeight: 500 }}>
                                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
