export const theme = {
  // TNG Digital brand palette
  navy:    "#001A47",
  blue:    "#003DA5",
  cyan:    "#00B8E6",
  gold:    "#F9B233",
  surface: "#0D2151",
  border:  "#1A3A6B",
  textPrimary:   "#FFFFFF",
  textSecondary: "#A0B4CC",
  textMuted:     "#6B89A8",
  success: "#00C896",
  error:   "#FF4D6D",
  warn:    "#F9B233",

  // Glassmorphism card
  glassCard: {
    background: "rgba(13, 33, 81, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(0, 184, 230, 0.18)",
    borderRadius: 16,
    boxShadow: "0 8px 32px rgba(0, 29, 71, 0.45), inset 0 1px 0 rgba(0,184,230,0.08)",
  } as React.CSSProperties,

  // Status chips
  status: {
    PENDING:      { bg: "rgba(249,178,51,0.15)",  text: "#F9B233", dot: "#F9B233" },
    SCANNING:     { bg: "rgba(0,184,230,0.15)",   text: "#00B8E6", dot: "#00B8E6" },
    VERIFIED:     { bg: "rgba(0,61,165,0.25)",    text: "#5CA3FF", dot: "#5CA3FF" },
    DISTRIBUTING: { bg: "rgba(249,178,51,0.15)",  text: "#F9B233", dot: "#F9B233" },
    CLOSED:       { bg: "rgba(0,200,150,0.15)",   text: "#00C896", dot: "#00C896" },
    DISPUTED:     { bg: "rgba(255,77,109,0.15)",  text: "#FF4D6D", dot: "#FF4D6D" },
    SCAN_FAILED:  { bg: "rgba(255,77,109,0.15)",  text: "#FF4D6D", dot: "#FF4D6D" },
    APPROVED:     { bg: "rgba(0,200,150,0.15)",   text: "#00C896", dot: "#00C896" },
    REJECTED:     { bg: "rgba(255,77,109,0.15)",  text: "#FF4D6D", dot: "#FF4D6D" },
    COMPLETED:    { bg: "rgba(0,200,150,0.15)",   text: "#00C896", dot: "#00C896" },
    FAILED:       { bg: "rgba(255,77,109,0.15)",  text: "#FF4D6D", dot: "#FF4D6D" },
    EXECUTING:    { bg: "rgba(0,184,230,0.15)",   text: "#00B8E6", dot: "#00B8E6" },
  } as Record<string, { bg: string; text: string; dot: string }>,

  radius: 12,
  radiusLg: 16,
  radiusSm: 8,
  sidebarWidth: 240,
  sidebarCollapsed: 64,
  headerHeight: 64,
} as const;

import React from "react";
export type Theme = typeof theme;
