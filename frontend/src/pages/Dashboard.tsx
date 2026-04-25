import React from "react";
import { Link } from "react-router-dom";
import { useEstates } from "../hooks/useApi";
import { GlassCard } from "../components/estate/GlassCard";
import { StatusBadge } from "../components/estate/StatusBadge";
import { theme } from "../theme";

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      ...theme.glassCard, padding: "20px 24px",
      borderTop: `3px solid ${color || theme.cyan}`,
    }}>
      <div style={{ fontSize: 11, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || theme.textPrimary, letterSpacing: "-0.5px" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function Dashboard() {
  const { data: estates, loading } = useEstates();

  const total    = estates.length;
  const open     = estates.filter(e => !["CLOSED", "DISPUTED"].includes(e.status)).length;
  const closed   = estates.filter(e => e.status === "CLOSED").length;
  const totalRm  = estates.reduce((s: number, e: any) => s + (e.total_rm || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.5px" }}>
          Probate Dashboard
        </h1>
        <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
          Touch 'n Go eWallet · Deceased Account Settlement Portal
        </p>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Estates" value={total} color={theme.cyan} />
        <KpiCard label="Active" value={open} color={theme.gold} sub="In progress" />
        <KpiCard label="Settled" value={closed} color={theme.success} sub="Fully closed" />
        <KpiCard label="Total Estate Value" value={`RM ${totalRm.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`} color={theme.blue} />
      </div>

      {/* Recent estates */}
      <GlassCard
        title="Recent Estates"
        action={
          <Link to="/estates" style={{ fontSize: 12, color: theme.cyan, textDecoration: "none", fontWeight: 600 }}>
            View all →
          </Link>
        }
      >
        {loading ? (
          <SkeletonRows />
        ) : estates.length === 0 ? (
          <EmptyState />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Deceased", "Status", "Total RM", "Beneficiaries", "Updated"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: theme.textMuted,
                    textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${theme.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {estates.slice(0, 8).map((e: any) => (
                <tr key={e.id} style={{ cursor: "pointer" }}
                  onClick={() => window.location.href = `/estates/${e.id}`}>
                  <td style={{ padding: "12px", fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>
                    {e.deceased_name}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <StatusBadge status={e.status} pulse={["SCANNING","DISTRIBUTING"].includes(e.status)} />
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.textSecondary, fontFamily: "JetBrains Mono, monospace" }}>
                    RM {Number(e.total_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.textSecondary }}>
                    {e.beneficiary_count}
                  </td>
                  <td style={{ padding: "12px", fontSize: 12, color: theme.textMuted }}>
                    {new Date(e.updated_at).toLocaleDateString("en-MY")}
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

function SkeletonRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 44, borderRadius: 8,
          background: `linear-gradient(90deg, ${theme.surface} 25%, rgba(0,184,230,0.05) 50%, ${theme.surface} 75%)`,
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }} />
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: theme.textMuted }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
      <div style={{ fontSize: 14, color: theme.textSecondary }}>No estates yet</div>
      <Link to="/estates" style={{ fontSize: 13, color: theme.cyan, textDecoration: "none" }}>
        Create first estate →
      </Link>
    </div>
  );
}
