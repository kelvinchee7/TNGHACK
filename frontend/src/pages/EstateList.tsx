import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useEstates, estateApi } from "../hooks/useApi";
import { GlassCard } from "../components/estate/GlassCard";
import { StatusBadge } from "../components/estate/StatusBadge";
import { theme } from "../theme";

export function EstateList() {
  const { data: estates, loading, refetch } = useEstates();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    deceased_account_id: "", deceased_name: "", death_date: "", deceased_nic: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await estateApi.create(form);
      setCreating(false);
      setForm({ deceased_account_id: "", deceased_name: "", death_date: "", deceased_nic: "" });
      refetch();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary }}>Estates</h1>
          <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>All deceased account probate cases</p>
        </div>
        <button onClick={() => setCreating(c => !c)} style={btnStyle(theme.blue)}>
          + New Estate
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <GlassCard title="Open New Estate" style={{ marginBottom: 20 }}>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              {[
                { name: "deceased_name",       label: "Full Name",             placeholder: "Ahmad bin Yusof" },
                { name: "deceased_account_id", label: "TNG Account ID",        placeholder: "acc_deceased_001" },
                { name: "deceased_nic",         label: "IC Number (optional)",  placeholder: "900101-14-1234" },
                { name: "death_date",           label: "Date of Death",         placeholder: "", type: "date" },
              ].map(f => (
                <label key={f.name} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {f.label}
                  </span>
                  <input
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={(form as any)[f.name]}
                    onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                    required={f.name !== "deceased_nic"}
                    style={inputStyle}
                  />
                </label>
              ))}
            </div>
            {error && <div style={{ color: theme.error, fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={submitting} style={btnStyle(theme.cyan)}>
                {submitting ? "Creating..." : "Create Estate"}
              </button>
              <button type="button" onClick={() => setCreating(false)} style={btnStyle(theme.surface)}>
                Cancel
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      <GlassCard>
        {loading ? (
          <div style={{ color: theme.textMuted, padding: 20, textAlign: "center" }}>Loading estates...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Deceased", "Status", "Total RM", "Beneficiaries", "Created", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: theme.textMuted,
                    textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${theme.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {estates.map((e: any) => (
                <tr key={e.id}>
                  <td style={{ padding: "14px 12px", fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>
                    {e.deceased_name}
                    <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>
                      {e.id.substring(0, 8)}...
                    </div>
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <StatusBadge status={e.status} pulse={["SCANNING","DISTRIBUTING"].includes(e.status)} />
                  </td>
                  <td style={{ padding: "14px 12px", fontSize: 13, color: theme.textSecondary, fontFamily: "JetBrains Mono, monospace" }}>
                    RM {Number(e.total_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "14px 12px", fontSize: 13, color: theme.textSecondary }}>
                    {e.beneficiary_count}
                  </td>
                  <td style={{ padding: "14px 12px", fontSize: 12, color: theme.textMuted }}>
                    {new Date(e.created_at).toLocaleDateString("en-MY")}
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <Link to={`/estates/${e.id}`} style={{ fontSize: 12, color: theme.cyan, textDecoration: "none", fontWeight: 600 }}>
                      Open →
                    </Link>
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

const btnStyle = (bg: string): React.CSSProperties => ({
  padding: "10px 20px", borderRadius: 8, border: "none",
  background: bg, color: "#fff", fontWeight: 600, fontSize: 13,
  cursor: "pointer", letterSpacing: "-0.2px",
});

const inputStyle: React.CSSProperties = {
  padding: "10px 12px", borderRadius: 8,
  background: "rgba(0,29,71,0.6)", border: `1px solid ${theme.border}`,
  color: theme.textPrimary, fontSize: 13, outline: "none", width: "100%",
};
