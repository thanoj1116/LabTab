import React from "react";
import { CheckCircle2, Clock, XCircle, Ban, AlertCircle } from "lucide-react";

export type StatusType = "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED" | "CONFIRMED";

interface StatusTagProps {
  status: StatusType | string;
  className?: string;
}

export function StatusTag({ status, className = "" }: StatusTagProps) {
  const normalized = status.toUpperCase();

  if (normalized === "APPROVED" || normalized === "CONFIRMED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-control text-xs font-medium text-status-approved bg-status-approved-bg border border-status-approved/30 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{normalized === "CONFIRMED" ? "Confirmed" : "Approved"}</span>
      </span>
    );
  }

  if (normalized === "PENDING") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-control text-xs font-medium text-status-pending bg-status-pending-bg border border-status-pending/30 ${className}`}
      >
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>Pending Review</span>
      </span>
    );
  }

  if (normalized === "REJECTED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-control text-xs font-medium text-status-rejected bg-status-rejected-bg border border-status-rejected/30 ${className}`}
      >
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Rejected</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-control text-xs font-medium text-status-cancelled bg-status-cancelled-bg border border-status-cancelled/30 ${className}`}
    >
      <Ban className="w-3.5 h-3.5 shrink-0" />
      <span>Cancelled</span>
    </span>
  );
}
