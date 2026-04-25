import React from "react";
import { Link } from "react-router-dom";
import { useEstates } from "../hooks/useApi";
import { GlassCard } from "../components/estate/GlassCard";
import { StatusBadge } from "../components/estate/StatusBadge";
import { theme } from "../theme";

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, color, icon,
}: { label: string; value: string | number; sub?: string; color?: string; icon?: string }) {
  const c = color || theme.accent;
  return (
    <div style={{
      background: "#fff",
      borderRadius: theme.radiusLg,
      border: `1px solid ${theme.border}`,
      boxShadow: theme.shadowCard,
      padding: "20px 22px",
      borderLeft: `4px solid ${c}`,
      animation: "fadeInUp 0.35s ease both",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: theme.textMuted,
            textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8,
          }}>{label}</div>
          <div style={{
            fontSize: 26, fontWeight: 800, color: theme.textPrimary,
            letterSpacing: "-0.6px", lineHeight: 1,
          }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 5 }}>{sub}</div>}
        </div>
        {icon && (
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${c}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>{icon}</div>
        )}
      </div>
    </div>
  );
}

// ── Row skeleton ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[160, 100, 110, 60, 80].map((w, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div style={{
            height: 14, width: w, borderRadius: 6,
            background: "linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)",
            backgroundSize: "400% 100%",
            animation: "shimmer 1.4s ease-in-out infinite",
          }} />
        </td>
      ))}
    </tr>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { data: estates, loading } = useEstates();

  const total   = estates.length;
  const active  = estates.filter((e: any) => !["CLOSED", "DISPUTED"].includes(e.status)).length;
  const closed  = estates.filter((e: any) => e.status === "CLOSED").length;
  const totalRm = estates.reduce((s: number, e: any) => s + (e.total_rm || 0), 0);

  return (
    <div style={{ animation: "fadeInUp 0.3s ease" }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 800, color: theme.textPrimary,
          letterSpacing: "-0.5px",
        }}>Probate Dashboard</h1>
        <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
          Real-time overview of all deceased account estate settlements
        </p>
      </div>

      {/* KPI row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16, marginBottom: 28,
      }}>
        <KpiCard label="Total Estates"      value={total}  icon="📋" color={theme.accent} />
        <KpiCard label="Active Cases"       value={active} icon="⚡" color={theme.warn}   sub="In progress" />
        <KpiCard label="Settled Estates"    value={closed} icon="✅" color={theme.success} sub="Fully closed" />
        <KpiCard
          label="Total Estate Value"
          value={`RM ${totalRm.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`}
          icon="💰"
          color="#8B5CF6"
        />
      </div>

      {/* Recent estates table */}
      <GlassCard
        title="Recent Estates"
        subtitle="Latest probate cases across all statuses"
        action={
          <Link to="/estates" style={{
            fontSize: 12, fontWeight: 600, color: theme.accent,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            View all →
          </Link>
        }
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.borderLight}` }}>
                {["Deceased Name", "Status", "Total RM", "Beneficiaries", "Opened"].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "8px 16px",
                    fontSize: 11, fontWeight: 700, color: theme.textMuted,
                    textTransform: "uppercase", letterSpacing: "0.5px",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1, 2, 3].map(i => <SkeletonRow key={i} />)
                : estates.length === 0
                ? (
                  <tr><td colSpan={5} style={{ padding: "40px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                    <div style={{ fontSize: 14, color: theme.textSecondary, fontWeight: 500 }}>No estates yet</div>
                    <Link to="/estates" style={{ fontSize: 13, color: theme.accent, fontWeight: 600 }}>
                      Create your first estate →
                    </Link>
                  </td></tr>
                )
                : estates.slice(0, 10).map((e: any) => (
                  <tr
                    key={e.id}
                    onClick={() => window.location.href = `/estates/${e.id}`}
                    style={{ cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = theme.bg)}
                    onMouseLeave={ev => (ev.currentTarget.style.background = "")}
                  >
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>
                        {e.deceased_name}
                      </div>
                      <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono, marginTop: 2 }}>
                        {e.id.substring(0, 8)}…
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <StatusBadge
                        status={e.status}
                        pulse={["SCANNING", "DISTRIBUTING", "EXECUTING"].includes(e.status)}
                      />
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, fontFamily: theme.fontMono, color: theme.textSecondary }}>
                      RM {Number(e.total_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        background: theme.infoLight, color: theme.info,
                        padding: "2px 8px", borderRadius: 12,
                        border: `1px solid ${theme.accentLight}`,
                      }}>{e.beneficiary_count}</span>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 12, color: theme.textMuted }}>
                      {new Date(e.created_at).toLocaleDateString("en-MY", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Quick-start guide */}
      {!loading && estates.length === 0 && (
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {[
            { step: "1", title: "Open Estate",    desc: "Register deceased account ID and death date.", color: theme.accent },
            { step: "2", title: "Scan Will",       desc: "Upload the will document — ML extracts beneficiaries automatically.", color: "#8B5CF6" },
            { step: "3", title: "Distribute",      desc: "Legal advisor approves, transfers execute automatically.", color: theme.success },
          ].map(s => (
            <GlassCard key={s.step} style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: `${s.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: s.color,
                marginBottom: 10,
              }}>{s.step}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.5 }}>{s.desc}</div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
