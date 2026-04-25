import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { theme } from "../../theme";

const NAV = [
  { path: "/",            label: "Dashboard",    icon: "⬛" },
  { path: "/estates",     label: "Estates",      icon: "📋" },
  { path: "/beneficiaries", label: "Beneficiaries", icon: "👤" },
  { path: "/legal",       label: "Legal Queue",  icon: "⚖️" },
  { path: "/transfers",   label: "Transfers",    icon: "💸" },
  { path: "/audit",       label: "Audit Log",    icon: "🔒" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const w = collapsed ? theme.sidebarCollapsed : theme.sidebarWidth;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.navy }}>
      {/* Sidebar */}
      <aside style={{
        width: w, minWidth: w, background: "rgba(0,26,71,0.97)",
        borderRight: `1px solid ${theme.border}`,
        display: "flex", flexDirection: "column",
        transition: "width 0.2s ease",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{
          height: theme.headerHeight, display: "flex", alignItems: "center",
          padding: collapsed ? "0 20px" : "0 20px",
          borderBottom: `1px solid ${theme.border}`,
          gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: `linear-gradient(135deg, ${theme.blue}, ${theme.cyan})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff",
          }}>iW</div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: theme.textPrimary, letterSpacing: "-0.3px" }}>
                iwantmoney
              </div>
              <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 1 }}>Probate Platform</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {NAV.map(({ path, label, icon }) => {
            const active = pathname === path || (path !== "/" && pathname.startsWith(path));
            return (
              <Link key={path} to={path} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: collapsed ? "10px 12px" : "10px 12px",
                  borderRadius: theme.radiusSm,
                  margin: "2px 0",
                  background: active
                    ? `linear-gradient(90deg, rgba(0,61,165,0.5), rgba(0,184,230,0.12))`
                    : "transparent",
                  borderLeft: active ? `3px solid ${theme.cyan}` : "3px solid transparent",
                  color: active ? theme.cyan : theme.textSecondary,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                  cursor: "pointer",
                  whiteSpace: "nowrap", overflow: "hidden",
                }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
                  {!collapsed && <span>{label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: "12px 8px", borderTop: `1px solid ${theme.border}` }}>
          <button onClick={() => setCollapsed(c => !c)} style={{
            width: "100%", padding: "8px", borderRadius: theme.radiusSm,
            background: "transparent", border: `1px solid ${theme.border}`,
            color: theme.textSecondary, cursor: "pointer", fontSize: 12,
          }}>
            {collapsed ? "→" : "← Collapse"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <header style={{
          height: theme.headerHeight, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 24px",
          borderBottom: `1px solid ${theme.border}`,
          background: "rgba(0,26,71,0.8)", backdropFilter: "blur(8px)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ fontSize: 13, color: theme.textMuted }}>
            Touch 'n Go eWallet · Probate Management Portal
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: `linear-gradient(135deg, ${theme.blue}, ${theme.cyan})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer",
          }}>OP</div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
