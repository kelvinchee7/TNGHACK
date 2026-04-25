import React from "react";
import { theme, card } from "../../theme";

interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  accent?: boolean;
  padding?: number | string;
}

export function GlassCard({ children, style, title, subtitle, action, accent, padding = 24 }: Props) {
  return (
    <div style={{
      ...card,
      padding,
      borderTop: accent ? `3px solid ${theme.accent}` : undefined,
      ...style,
    }}>
      {(title || action) && (
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", marginBottom: 18,
          gap: 12,
        }}>
          <div>
            {title && (
              <h3 style={{
                fontSize: 14, fontWeight: 700,
                color: theme.textPrimary, letterSpacing: "-0.2px",
                lineHeight: 1.3,
              }}>{title}</h3>
            )}
            {subtitle && (
              <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>{subtitle}</p>
            )}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
