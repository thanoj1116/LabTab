import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-surface-2 animate-pulse rounded-control ${className}`}
      aria-hidden="true"
    />
  );
}
