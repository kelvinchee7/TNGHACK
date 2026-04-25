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

function KycBadge({ status }: { status: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
      background: KYC_BG[status] || theme.bg,
      color: KYC_COLOR[status] || theme.textMuted,
      border: `1px solid ${KYC_COLOR[status] || theme.border}30`,
      whiteSpace: "nowrap",
    }}>
      {status.replace(/_/g, " ")}
    </span>
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

  const allStatuses = ["ALL", "PENDING", "ID_VERIFIED", "BIOMETRIC_CONFIRMED", "APPROVED", "REJECTED"];

  const filtered = groups.map(g => ({
    ...g,
    beneficiaries: g.beneficiaries.filter((b: any) => {
      const matchSearch = !search ||
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.email.toLowerCase().includes(search.toLowerCase());
      const matchKyc = kycFilter === "ALL" || b.kyc_status === kycFilter;
      return matchSearch && matchKyc;
    }),
  })).filter(g => g.beneficiaries.length > 0);

  const totalBens = groups.reduce((s, g) => s + g.beneficiaries.length, 0);
  const totalApproved = groups.reduce((s, g) => s + g.beneficiaries.filter((b: any) => b.kyc_status === "APPROVED").length, 0);
  const totalPending = groups.reduce((s, g) => s + g.beneficiaries.filter((b: any) => b.kyc_status === "PENDING").length, 0);

  return (
    <div style={{ animation: "fadeInUp 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.4px" }}>
          Beneficiaries
        </h1>
        <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 3 }}>
          All claimants grouped by estate
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Claimants", value: totalBens,    color: theme.accent  },
          { label: "KYC Approved",    value: totalApproved, color: theme.success },
          { label: "Pending Review",  value: totalPending,  color: theme.warn    },
        ].map(k => (
          <div key={k.label} style={{
            background: "#fff", borderRadius: theme.radiusLg,
            border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard,
            padding: "18px 20px", borderLeft: `4px solid ${k.color}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: theme.textPrimary }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          style={{ padding: "8px 12px", borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", minWidth: 220, flex: 1 }}
          onFocus={e => e.target.style.borderColor = theme.accent}
          onBlur={e => e.target.style.borderColor = theme.border}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {allStatuses.map(s => (
            <button key={s} onClick={() => setKycFilter(s)} style={{
              padding: "7px 12px", borderRadius: theme.radiusSm, fontSize: 11, fontWeight: 600,
              border: kycFilter === s ? "none" : `1px solid ${theme.border}`,
              background: kycFilter === s ? theme.accent : "#fff",
              color: kycFilter === s ? "#fff" : theme.textSecondary,
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
            }}>{s === "ALL" ? "All" : s.replace(/_/g, " ")}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <GlassCard><div style={{ padding: "48px 0", textAlign: "center", color: theme.textMuted }}>Loading…</div></GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard>
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
            <div style={{ fontSize: 14, color: theme.textMuted }}>No beneficiaries found</div>
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
                    width: 38, height: 38, borderRadius: 10, background: theme.accentLight,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
                  }}>👤</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>{group.deceased_name}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono }}>{group.estate_id.substring(0, 8)}…</div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                    background: theme.infoLight, color: theme.info,
                    border: `1px solid ${theme.info}30`,
                  }}>{group.estate_status}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: theme.textMuted }}>{group.beneficiaries.length} claimant{group.beneficiaries.length !== 1 ? "s" : ""}</span>
                  <Link to={`/estates/${group.estate_id}`} style={{
                    fontSize: 12, fontWeight: 600, color: theme.accent,
                    padding: "5px 12px", borderRadius: 6,
                    border: `1px solid ${theme.accentLight}`, background: theme.accentLight,
                  }}>View Estate →</Link>
                </div>
              </div>

              {/* Beneficiary rows */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Name", "NIC", "Email", "Transfer", "Share (RM)", "KYC Status"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.beneficiaries.map((b: any) => (
                      <tr key={b.id} style={{ borderTop: `1px solid ${theme.borderLight}` }}>
                        <td style={{ padding: "10px 10px", fontSize: 13, fontWeight: 600, color: theme.textPrimary, whiteSpace: "nowrap" }}>{b.name}</td>
                        <td style={{ padding: "10px 10px", fontSize: 12, fontFamily: theme.fontMono, color: theme.textSecondary }}>{b.nic}</td>
                        <td style={{ padding: "10px 10px", fontSize: 12, color: theme.textSecondary }}>{b.email}</td>
                        <td style={{ padding: "10px 10px", fontSize: 12, color: theme.textSecondary }}>{b.transfer_method}{b.fx_currency ? ` (${b.fx_currency})` : ""}</td>
                        <td style={{ padding: "10px 10px", fontSize: 13, fontFamily: theme.fontMono, color: theme.textSecondary }}>
                          {b.share_rm ? `RM ${Number(b.share_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}` : "—"}
                        </td>
                        <td style={{ padding: "10px 10px" }}><KycBadge status={b.kyc_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
