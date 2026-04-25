import React from "react";
import { theme } from "../../theme";

interface Props { status: string; pulse?: boolean; small?: boolean; }

export function StatusBadge({ status, pulse, small }: Props) {
  const s = theme.status[status] ?? {
    bg: "#F1F5F9", text: "#475569", dot: "#94A3B8", border: "#E2E8F0",
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: small ? "2px 8px" : "4px 10px",
      borderRadius: 20,
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.text,
      fontSize: small ? 10 : 11,
      fontWeight: 600,
      letterSpacing: "0.3px",
      whiteSpace: "nowrap",
    }}>
      <span style={{
        width: small ? 5 : 6, height: small ? 5 : 6,
        borderRadius: "50%", background: s.dot, flexShrink: 0,
        ...(pulse ? { animation: "pulse-dot 1.4s ease-in-out infinite" } : {}),
      }} />
      {status.replace(/_/g, " ")}
    </span>
  );
}
