import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { globalApi } from "../hooks/useApi";
import { GlassCard } from "../components/estate/GlassCard";
import { theme } from "../theme";

const KYC_COLOR: Record<string, string> = {
  PENDING: theme.warn, ID_VERIFIED: theme.info,
  BIOMETRIC_CONFIRMED: "#8B5CF6", APPROVED: theme.success, REJECTED: theme.error,
};
const KYC_BG: Record<string, string> = {
  PENDING: theme.warnLight, ID_VERIFIED: theme.infoLight,
  BIOMETRIC_CONFIRMED: "#EDE9FE", APPROVED: theme.successLight, REJECTED: theme.errorLight,
};

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>{Array.from({ length: cols }).map((_, i) => (
      <td key={i} style={{ padding: "13px 16px" }}>
        <div style={{ height: 13, width: i === 0 ? 140 : 80, borderRadius: 6, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s ease-in-out infinite" }} />
      </td>
    ))}</tr>
  );
}

export function BeneficiariesPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("ALL");

  useEffect(() => {
    globalApi.beneficiaries().then(setGroups).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const allBens   = groups.flatMap(g => g.beneficiaries);
  const approved  = allBens.filter(b => b.kyc_status === "APPROVED").length;
  const pending   = allBens.filter(b => b.kyc_status === "PENDING").length;
  const rejected  = allBens.filter(b => b.kyc_status === "REJECTED").length;

  // Flatten into rows for a single table (grouped by estate via a divider row)
  const filteredGroups = groups.map(g => ({
    ...g,
    beneficiaries: g.beneficiaries.filter((b: any) => {
      const ms = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.email.toLowerCase().includes(search.toLowerCase());
      const mk = kycFilter === "ALL" || b.kyc_status === kycFilter;
      return ms && mk;
    }),
  })).filter(g => g.beneficiaries.length > 0);

  const KYC_STATUSES = ["ALL", "PENDING", "ID_VERIFIED", "BIOMETRIC_CONFIRMED", "APPROVED", "REJECTED"];

  return (
    <div style={{ animation: "fadeInUp 0.3s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.5px" }}>Beneficiaries</h1>
        <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>All estate claimants and their KYC verification status</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Claimants", value: allBens.length, icon: "👥", color: theme.accent   },
          { label: "KYC Approved",    value: approved,       icon: "✅", color: theme.success  },
          { label: "Pending Review",  value: pending,        icon: "⏳", color: theme.warn     },
          { label: "Rejected",        value: rejected,       icon: "❌", color: theme.error    },
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
        title="All Beneficiaries"
        subtitle="Grouped by estate — click estate link to open full record"
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
              style={{ padding: "7px 11px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 12, fontFamily: "inherit", outline: "none", width: 180 }}
              onFocus={e => e.target.style.borderColor = theme.accent}
              onBlur={e => e.target.style.borderColor = theme.border}
            />
            <select value={kycFilter} onChange={e => setKycFilter(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 12, fontFamily: "inherit", outline: "none", background: "#fff", color: theme.textPrimary }}>
              {KYC_STATUSES.map(s => <option key={s} value={s}>{s === "ALL" ? "All KYC" : s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
        }
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.borderLight}` }}>
                {["Name", "IC", "Email", "Estate", "Transfer", "Share (RM)", "KYC Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 16px", fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4].map(i => <SkeletonRow key={i} cols={7} />)
              ) : filteredGroups.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "56px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                  <div style={{ fontSize: 14, color: theme.textSecondary, fontWeight: 500 }}>No beneficiaries found</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>Run <strong>🤖 Run Demo</strong> from the Estates page to seed sample data</div>
                </td></tr>
              ) : (
                filteredGroups.map(group => (
                  <React.Fragment key={group.estate_id}>
                    {/* Estate group header row */}
                    <tr>
                      <td colSpan={7} style={{ padding: "10px 16px 6px", background: theme.bg }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary }}>{group.deceased_name}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 10, background: theme.accentLight, color: theme.accent }}>{group.estate_status}</span>
                          <Link to={`/estates/${group.estate_id}`} style={{ fontSize: 11, color: theme.accent, fontWeight: 600 }}>View estate →</Link>
                        </div>
                      </td>
                    </tr>
                    {group.beneficiaries.map((b: any) => (
                      <tr key={b.id} style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = theme.bg)}
                        onMouseLeave={e => (e.currentTarget.style.background = "")}>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{b.name}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: theme.fontMono, color: theme.textSecondary }}>{b.nic}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: theme.textSecondary }}>{b.email}</td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono }}>{group.estate_id.substring(0, 8)}…</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: theme.textSecondary }}>{b.transfer_method}{b.fx_currency ? ` / ${b.fx_currency}` : ""}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: theme.fontMono, color: theme.textSecondary }}>
                          {b.share_rm ? `RM ${Number(b.share_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: KYC_BG[b.kyc_status] || theme.bg, color: KYC_COLOR[b.kyc_status] || theme.textMuted, border: `1px solid ${KYC_COLOR[b.kyc_status] || theme.border}30`, whiteSpace: "nowrap" }}>
                            {b.kyc_status.replace(/_/g, " ")}
                          </span>
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
