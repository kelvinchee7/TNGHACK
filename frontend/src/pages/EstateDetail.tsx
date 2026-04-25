import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useEstate, estateApi, claimApi, transferApi } from "../hooks/useApi";
import { GlassCard } from "../components/estate/GlassCard";
import { StatusBadge } from "../components/estate/StatusBadge";
import { theme } from "../theme";

const TABS = ["Overview", "Will Scan", "Beneficiaries", "Distribution", "Legal", "Transfers"];

export function EstateDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: estate, loading } = useEstate(id!);
  const [tab, setTab] = useState("Overview");
  const [advisorEmail, setAdvisorEmail] = useState("");
  const [msg, setMsg] = useState("");

  if (loading) return <div style={{ color: theme.textMuted, padding: 40, textAlign: "center" }}>Loading...</div>;
  if (!estate) return <div style={{ color: theme.error, padding: 40 }}>Estate not found</div>;

  async function handleCalculate() {
    try { await estateApi.calculate(estate.id); setMsg("Shares calculated!"); }
    catch (e: any) { setMsg(e.response?.data?.detail || e.message); }
  }

  async function handleDispatch() {
    if (!advisorEmail) return;
    try { await estateApi.dispatchAdvisor(estate.id, advisorEmail); setMsg("Advisor notified — check console for dev URL"); }
    catch (e: any) { setMsg(e.response?.data?.detail || e.message); }
  }

  async function handleExecute() {
    try { const r = await transferApi.execute(estate.id); setMsg(`Transfers executed: ${JSON.stringify(r.results?.length ?? 0)} legs`); }
    catch (e: any) { setMsg(e.response?.data?.detail || e.message); }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: theme.textPrimary }}>{estate.deceased_name}</h1>
          <StatusBadge status={estate.status} pulse={["SCANNING","DISTRIBUTING"].includes(estate.status)} />
        </div>
        <div style={{ fontSize: 12, color: theme.textMuted, fontFamily: "JetBrains Mono, monospace" }}>
          {estate.id} · RM {Number(estate.total_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          · {estate.beneficiary_count} beneficiaries
        </div>
        {msg && (
          <div style={{ marginTop: 10, padding: "8px 14px", borderRadius: 8,
            background: "rgba(0,200,150,0.1)", color: theme.success, fontSize: 13 }}>
            {msg}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: `1px solid ${theme.border}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 16px", background: "none", border: "none",
            borderBottom: tab === t ? `2px solid ${theme.cyan}` : "2px solid transparent",
            color: tab === t ? theme.cyan : theme.textSecondary,
            fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: "pointer",
            transition: "all 0.15s", marginBottom: -1,
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "Overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <GlassCard title="Estate Summary">
            {[
              ["Deceased Name", estate.deceased_name],
              ["Account ID", estate.deceased_account_id],
              ["Death Date", estate.death_date],
              ["Status", estate.status],
              ["Total RM", `RM ${Number(estate.total_rm).toLocaleString("en-MY", { minimumFractionDigits: 2 })}`],
              ["Account Frozen", estate.account_frozen_at ? new Date(estate.account_frozen_at).toLocaleString("en-MY") : "Not frozen"],
              ["Opened", new Date(estate.created_at).toLocaleString("en-MY")],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0",
                borderBottom: `1px solid ${theme.border}`, fontSize: 13 }}>
                <span style={{ color: theme.textSecondary }}>{label}</span>
                <span style={{ color: theme.textPrimary, fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </GlassCard>

          <GlassCard title="Quick Actions">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Btn color={theme.cyan} onClick={handleCalculate}>Calculate Share Distribution</Btn>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={advisorEmail} onChange={e => setAdvisorEmail(e.target.value)}
                  placeholder="Advisor email" style={{ ...inputStyle, flex: 1 }} />
                <Btn color={theme.blue} onClick={handleDispatch}>Notify Advisor</Btn>
              </div>
              <Btn color={theme.gold} onClick={handleExecute}>Execute Transfers</Btn>
            </div>
          </GlassCard>
        </div>
      )}

      {tab === "Will Scan" && <WillScanPanel estateId={estate.id} />}
      {tab === "Legal" && <LegalPanel estate={estate} />}
      {tab !== "Overview" && tab !== "Will Scan" && tab !== "Legal" && (
        <GlassCard>
          <div style={{ color: theme.textMuted, padding: 20, textAlign: "center" }}>
            {tab} panel — connect to `/api/estates/{id}` sub-resources
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function WillScanPanel({ estateId }: { estateId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleScan() {
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("estate_id", estateId);
    fd.append("file", file);
    try {
      const res = await fetch("http://localhost:8001/scan", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <GlassCard title="Will Document Scanner">
      {/* Drop zone */}
      <label style={{
        display: "block", border: `2px dashed ${file ? theme.cyan : theme.border}`,
        borderRadius: 12, padding: 40, textAlign: "center", cursor: "pointer",
        background: file ? "rgba(0,184,230,0.05)" : "transparent",
        transition: "all 0.2s", marginBottom: 16,
      }}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.tiff" style={{ display: "none" }}
          onChange={e => setFile(e.target.files?.[0] || null)} />
        {file ? (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ color: theme.cyan, fontWeight: 600, fontSize: 13 }}>{file.name}</div>
            <div style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
            <div style={{ color: theme.textSecondary, fontSize: 13 }}>Drop will document here or click to select</div>
            <div style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>PDF, JPG, PNG, TIFF · Max 20 MB</div>
          </div>
        )}
      </label>

      <button onClick={handleScan} disabled={!file || uploading} style={{
        padding: "10px 24px", borderRadius: 8, border: "none",
        background: uploading ? theme.border : theme.cyan, color: "#001A47",
        fontWeight: 700, fontSize: 13, cursor: file ? "pointer" : "not-allowed",
      }}>
        {uploading ? "Scanning..." : "Scan Will Document"}
      </button>

      {error && <div style={{ color: theme.error, fontSize: 13, marginTop: 12 }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 20 }}>
          {result.needs_human_review && (
            <div style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(249,178,51,0.12)",
              border: `1px solid rgba(249,178,51,0.3)`, color: theme.gold, fontSize: 13, marginBottom: 12 }}>
              ⚠️ Manual review required — low extraction confidence
            </div>
          )}
          <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Extracted Will Data
          </div>
          <pre style={{
            background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 16,
            fontSize: 12, color: theme.success, overflow: "auto", maxHeight: 300,
            fontFamily: "JetBrains Mono, monospace",
          }}>
            {JSON.stringify(result.will_data, null, 2)}
          </pre>
        </div>
      )}
    </GlassCard>
  );
}

function LegalPanel({ estate }: { estate: any }) {
  return (
    <GlassCard title="Legal Advisor Approval">
      <div style={{ color: theme.textSecondary, fontSize: 13 }}>
        Dispatch the legal advisor from the Overview tab. Once sent, the advisor receives an
        email with a 72-hour approval link. The approval URL prints to the API Gateway console
        in local/dev mode.
      </div>
      <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 8,
        background: "rgba(0,184,230,0.07)", border: `1px solid rgba(0,184,230,0.2)`,
        fontSize: 12, color: theme.cyan }}>
        ℹ️ Estate status must be <strong>VERIFIED</strong> before dispatching advisor.
        Current status: <strong>{estate.status}</strong>
      </div>
    </GlassCard>
  );
}

function Btn({ color, onClick, children }: { color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 16px", borderRadius: 8, border: "none",
      background: color, color: color === theme.gold ? "#001A47" : "#fff",
      fontWeight: 600, fontSize: 13, cursor: "pointer",
    }}>
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px", borderRadius: 8,
  background: "rgba(0,29,71,0.6)", border: `1px solid ${theme.border}`,
  color: theme.textPrimary, fontSize: 13, outline: "none",
};
