import React from "react";

// ── iwantmoney Design System ──────────────────────────────────────────────────
// Light-mode EDIC-style layout with TNG Digital accent palette.
// Background is soft white/slate, not navy. Accents are vivid but sparing.

export const theme = {
  // ── Surface
  bg:           "#F5F7FA",       // page background — cool off-white
  bgCard:       "#FFFFFF",       // card surface
  bgCardHover:  "#FAFBFD",
  bgSidebar:    "#16213E",       // sidebar — deep indigo-slate (not navy-black)
  bgSidebarHov: "#1E2D50",
  bgHeader:     "rgba(255,255,255,0.92)",

  // ── TNG Digital accent (primary)
  accent:       "#0077C8",       // TNG signature blue — used sparingly on light bg
  accentBright: "#0EA5E9",       // sky blue — hover states, active rings
  accentLight:  "#E0F2FE",       // tinted bg for active pill / badge fill
  accentGlow:   "rgba(0,119,200,0.14)",
  accentGrad:   "linear-gradient(135deg, #0077C8 0%, #0EA5E9 100%)",

  // ── Secondary accent (warm, for CTAs + highlights)
  gold:         "#F59E0B",
  goldLight:    "#FEF3C7",
  goldGrad:     "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",

  // ── Semantic
  success:      "#10B981",
  successLight: "#D1FAE5",
  error:        "#EF4444",
  errorLight:   "#FEE2E2",
  warn:         "#F59E0B",
  warnLight:    "#FEF3C7",
  info:         "#0EA5E9",
  infoLight:    "#E0F2FE",

  // ── Text
  textPrimary:   "#0F172A",      // near-black on light bg
  textSecondary: "#475569",      // slate-600
  textMuted:     "#94A3B8",      // slate-400
  textOnDark:    "#E2E8F0",      // on sidebar
  textOnAccent:  "#FFFFFF",

  // ── Border
  border:        "#E2E8F0",      // slate-200
  borderLight:   "#F1F5F9",      // slate-100

  // ── Shadows
  shadowSm:   "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
  shadowMd:   "0 2px 8px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)",
  shadowCard: "0 1px 3px rgba(15,23,42,0.05), 0 4px 12px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,1)",
  shadowLg:   "0 8px 32px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.05)",

  // ── Shape
  radius:   12,
  radiusLg: 16,
  radiusSm: 8,
  radiusXs: 6,

  // ── Layout
  sidebarWidth:     240,
  sidebarCollapsed: 64,
  headerHeight:     60,

  // ── Typography
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  fontMono:   "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",

  // ── Status chips (for estate/kyc/transfer status)
  status: {
    PENDING:             { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", border: "#FDE68A" },
    SCANNING:            { bg: "#E0F2FE", text: "#0369A1", dot: "#0EA5E9", border: "#BAE6FD" },
    VERIFIED:            { bg: "#D1FAE5", text: "#065F46", dot: "#10B981", border: "#A7F3D0" },
    DISTRIBUTING:        { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", border: "#FDE68A" },
    CLOSED:              { bg: "#DCFCE7", text: "#166534", dot: "#22C55E", border: "#BBF7D0" },
    DISPUTED:            { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444", border: "#FECACA" },
    SCAN_FAILED:         { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444", border: "#FECACA" },
    APPROVED:            { bg: "#D1FAE5", text: "#065F46", dot: "#10B981", border: "#A7F3D0" },
    REJECTED:            { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444", border: "#FECACA" },
    COMPLETED:           { bg: "#DCFCE7", text: "#166534", dot: "#22C55E", border: "#BBF7D0" },
    SETTLED:             { bg: "#DCFCE7", text: "#166534", dot: "#22C55E", border: "#BBF7D0" },
    FAILED:              { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444", border: "#FECACA" },
    EXECUTING:           { bg: "#E0F2FE", text: "#0369A1", dot: "#0EA5E9", border: "#BAE6FD" },
    PENDING_KYC:         { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", border: "#FDE68A" },
    ID_VERIFIED:         { bg: "#E0F2FE", text: "#0369A1", dot: "#0EA5E9", border: "#BAE6FD" },
    BIOMETRIC_CONFIRMED: { bg: "#EDE9FE", text: "#5B21B6", dot: "#8B5CF6", border: "#DDD6FE" },
  } as Record<string, { bg: string; text: string; dot: string; border: string }>,
} as const;

// ── Reusable style objects ────────────────────────────────────────────────────

export const card: React.CSSProperties = {
  background:   theme.bgCard,
  borderRadius:  theme.radiusLg,
  border:       `1px solid ${theme.border}`,
  boxShadow:     theme.shadowCard,
};

export const cardHover: React.CSSProperties = {
  ...card,
  background: theme.bgCardHover,
};

export const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900&family=JetBrains+Mono:wght@400;500&display=swap";

export const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: ${theme.fontFamily};
    background: ${theme.bg};
    color: ${theme.textPrimary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: ${theme.textMuted}; }
  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
