import React from "react";
import { theme } from "../../theme";

interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
  action?: React.ReactNode;
}

export function GlassCard({ children, style, title, action }: Props) {
  return (
    <div style={{ ...theme.glassCard, padding: 24, ...style }}>
      {(title || action) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {title && (
            <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary, letterSpacing: "-0.2px" }}>
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
