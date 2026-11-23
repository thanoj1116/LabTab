import React from "react";
import { Tile } from "./Tile";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <Tile className={`flex flex-col justify-between ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-primary">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-primary-muted mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="w-full flex-1">{children}</div>
    </Tile>
  );
}
