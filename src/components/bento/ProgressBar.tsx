import React from "react";

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  sublabel?: string;
  color?: "accent" | "approved" | "pending" | "rejected";
  className?: string;
}

export function ProgressBar({
  value,
  label,
  sublabel,
  color = "accent",
  className = "",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const fillColor =
    color === "approved"
      ? "bg-status-approved"
      : color === "pending"
      ? "bg-status-pending"
      : color === "rejected"
      ? "bg-status-rejected"
      : "bg-accent";

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || sublabel) && (
        <div className="flex items-center justify-between text-xs text-primary font-medium">
          {label && <span className="truncate">{label}</span>}
          {sublabel && (
            <span className="tabular-nums text-primary-muted font-normal ml-2">
              {sublabel}
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden">
        <div
          className={`h-full ${fillColor} transition-all duration-300 rounded-full`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
