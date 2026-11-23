import React from "react";
import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  onClear?: () => void;
  className?: string;
}

export function FilterChip({
  label,
  active = false,
  onClick,
  onClear,
  className = "",
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-control text-xs font-medium transition-colors border ${
        active
          ? "bg-accent text-accent-text border-accent font-semibold"
          : "bg-surface-2 text-primary-secondary border-border-subtle hover:bg-surface-3 hover:text-primary"
      } ${className}`}
    >
      <span>{label}</span>
      {active && onClear && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="hover:opacity-75 p-0.5"
          role="button"
          aria-label={`Clear ${label} filter`}
        >
          <X className="w-3 h-3" />
        </span>
      )}
    </button>
  );
}
