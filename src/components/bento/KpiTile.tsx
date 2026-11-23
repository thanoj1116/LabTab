import React from "react";
import { Tile } from "./Tile";

interface KpiTileProps {
  label: string;
  value: string | number;
  delta?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  subtitle?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function KpiTile({
  label,
  value,
  delta,
  subtitle,
  className = "",
  icon,
}: KpiTileProps) {
  return (
    <Tile className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between text-xs text-primary-muted font-medium mb-3">
        <span className="uppercase tracking-wider text-[11px] font-semibold">{label}</span>
        {icon && <span className="text-primary-secondary">{icon}</span>}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-semibold tabular-nums text-primary tracking-tight">
          {value}
        </span>
        {delta && (
          <span
            className={`text-xs px-2 py-0.5 rounded-control font-medium tabular-nums ${
              delta.isNeutral
                ? "bg-surface-3 text-primary-secondary"
                : delta.isPositive
                ? "bg-status-approved-bg text-status-approved border border-status-approved/20"
                : "bg-status-rejected-bg text-status-rejected border border-status-rejected/20"
            }`}
          >
            {delta.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-primary-muted mt-2 pt-2 border-t border-border-subtle">
          {subtitle}
        </p>
      )}
    </Tile>
  );
}
