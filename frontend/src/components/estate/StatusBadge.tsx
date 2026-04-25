import React from "react";
import { theme } from "../../theme";

interface Props { status: string; pulse?: boolean; }

export function StatusBadge({ status, pulse }: Props) {
  const s = theme.status[status] ?? { bg: "rgba(160,180,204,0.12)", text: "#A0B4CC", dot: "#A0B4CC" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: s.bg, color: s.text,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.5px",
      whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0,
        ...(pulse ? { animation: "pulse 1.4s ease-in-out infinite" } : {}),
      }} />
      {status}
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }`}</style>
    </span>
  );
}
