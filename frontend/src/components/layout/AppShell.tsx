import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { theme, GLOBAL_CSS } from "../../theme";

const NAV = [
  { path: "/",              label: "Dashboard",     icon: "▦"  },
  { path: "/estates",       label: "Estates",       icon: "📋" },
  { path: "/beneficiaries", label: "Beneficiaries", icon: "👥" },
  { path: "/legal",         label: "Legal Queue",   icon: "⚖️" },
  { path: "/transfers",     label: "Transfers",     icon: "💸" },
  { path: "/audit",         label: "Audit Log",     icon: "🔍" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { pathname } = useLocation();

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const sw = collapsed ? theme.sidebarCollapsed : theme.sidebarWidth;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{
        height: theme.headerHeight, display: "flex", alignItems: "center",
        padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        gap: 10, overflow: "hidden", flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: theme.accentGrad,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 2px 10px ${theme.accentGlow}`,
          fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px",
        }}>iW</div>
        {(!collapsed || isMobile) && (
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#F1F5F9", letterSpacing: "-0.4px", lineHeight: 1.1, whiteSpace: "nowrap" }}>
              iwantmoney
            </div>
            <div style={{ fontSize: 10, color: "#64748B", marginTop: 2, whiteSpace: "nowrap" }}>Probate Platform</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {(!collapsed || isMobile) && (
          <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 10px 8px" }}>
            Navigation
          </div>
        )}
        {NAV.map(({ path, label, icon }) => {
          const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
          return (
            <Link key={path} to={path} style={{ display: "block", textDecoration: "none", marginBottom: 2 }}>
              <div style={{
                display: "flex", alignItems: "center",
                gap: 10, padding: "9px 10px",
                borderRadius: theme.radiusSm,
                background: active ? "linear-gradient(90deg, rgba(0,119,200,0.22) 0%, rgba(14,165,233,0.10) 100%)" : "transparent",
                border: active ? "1px solid rgba(0,119,200,0.25)" : "1px solid transparent",
                color: active ? "#93C5FD" : "#94A3B8",
                fontSize: 13, fontWeight: active ? 600 : 400,
                transition: "all 0.14s", overflow: "hidden", whiteSpace: "nowrap",
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span style={{ fontSize: 14, flexShrink: 0, opacity: active ? 1 : 0.7 }}>{icon}</span>
                {(!collapsed || isMobile) && <span style={{ flex: 1 }}>{label}</span>}
                {(!collapsed || isMobile) && active && (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0EA5E9", flexShrink: 0, animation: "pulse-dot 2s ease-in-out infinite" }} />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        {(!collapsed || isMobile) && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", marginBottom: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: theme.success, flexShrink: 0, animation: "pulse-dot 2.5s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, color: "#64748B" }}>System operational</span>
          </div>
        )}
        {!isMobile && (
          <button onClick={() => setCollapsed(c => !c)} style={{
            width: "100%", padding: "8px 10px", borderRadius: theme.radiusSm,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#64748B", cursor: "pointer", fontSize: 11,
            display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
            gap: 6, transition: "all 0.14s",
          }}>
            <span style={{ fontSize: 13 }}>{collapsed ? "→" : "←"}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <style>{`
        @media (max-width: 767px) {
          .main-content { padding: 16px !important; }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", width: "100%", background: theme.bg }}>

        {/* ── Desktop sidebar ─────────────────────────────────── */}
        {!isMobile && (
          <aside style={{
            width: sw, minWidth: sw, flexShrink: 0,
            background: `linear-gradient(180deg, ${theme.bgSidebar} 0%, #111827 100%)`,
            display: "flex", flexDirection: "column",
            transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
            position: "sticky", top: 0, height: "100vh",
            boxShadow: "4px 0 20px rgba(0,0,0,0.12)",
          }}>
            {sidebarContent}
          </aside>
        )}

        {/* ── Mobile drawer overlay ───────────────────────────── */}
        {isMobile && mobileOpen && (
          <>
            <div onClick={() => setMobileOpen(false)} style={{
              position: "fixed", inset: 0, zIndex: 40,
              background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)",
            }} />
            <aside style={{
              position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
              width: 260,
              background: `linear-gradient(180deg, ${theme.bgSidebar} 0%, #111827 100%)`,
              display: "flex", flexDirection: "column",
              boxShadow: "8px 0 32px rgba(0,0,0,0.3)",
              animation: "slideInLeft 0.2s ease",
            }}>
              {sidebarContent}
            </aside>
          </>
        )}

        {/* ── Main area ───────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Header */}
          <header style={{
            height: theme.headerHeight, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 20px",
            background: theme.bgHeader,
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${theme.border}`,
            position: "sticky", top: 0, zIndex: 10,
            gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              {/* Hamburger (mobile) */}
              {isMobile && (
                <button onClick={() => setMobileOpen(o => !o)} style={{
                  width: 36, height: 36, borderRadius: 8, border: `1px solid ${theme.border}`,
                  background: "#fff", cursor: "pointer", fontSize: 16,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>☰</button>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  TNG eWallet · Probate Portal
                </div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>
                  Deceased account estate settlement
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 10px", borderRadius: 20,
                background: theme.successLight, border: `1px solid #A7F3D0`,
                fontSize: 11, fontWeight: 600, color: "#065F46",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: theme.success, animation: "pulse-dot 2s ease-in-out infinite" }} />
                <span style={{ display: isMobile ? "none" : "inline" }}>Live</span>
              </div>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: theme.accentGrad,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff",
                boxShadow: `0 2px 6px ${theme.accentGlow}`, cursor: "pointer", flexShrink: 0,
              }}>OP</div>
            </div>
          </header>

          {/* Page content */}
          <main className="main-content" style={{ flex: 1, padding: 28, overflowY: "auto", minWidth: 0, width: "100%", boxSizing: "border-box" }}>
            <div style={{ width: "100%", minWidth: 0 }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
