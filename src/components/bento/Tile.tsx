import React from "react";

interface TileProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface1" | "surface2" | "accent";
  className?: string;
  children: React.ReactNode;
}

export function Tile({
  variant = "surface1",
  className = "",
  children,
  ...props
}: TileProps) {
  const bgClass =
    variant === "surface2"
      ? "bg-surface-2"
      : variant === "accent"
      ? "bg-accent text-accent-text border-accent"
      : "bg-surface-1";

  return (
    <div
      className={`rounded-tile border border-border-subtle p-4 sm:p-5 transition-colors ${bgClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
