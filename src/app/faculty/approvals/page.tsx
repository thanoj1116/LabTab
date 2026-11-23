"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  UserCheck,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  RefreshCw,
  Scale,
  Eye,
  Filter,
} from "lucide-react";
import { Tile } from "@/components/bento/Tile";
import { KpiTile } from "@/components/bento/KpiTile";
import { DataTable } from "@/components/bento/DataTable";
import { Drawer } from "@/components/bento/Drawer";
import { Skeleton } from "@/components/bento/Skeleton";
import { ProgressBar } from "@/components/bento/ProgressBar";
import { useToast } from "@/components/bento/Toast";

interface PendingRequest {
  id: string;
  projectTitle: string;
  projectDescription: string;
  justification: string;
  deadline: string;
  durationHours: number;
  preferredStart: string;
  priorityScore: number;
  createdAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    department: string | null;
  };
  equipment: {
    id: string;
    name: string;
    department: string;
    category: string;
    location: string;
  };
}

export default function FacultyApprovalsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Side Drawer state for reviewing single request
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/faculty/approvals");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      } else {
        toast("Failed to load department approvals", "error");
      }
    } catch {
      toast("Network error loading queue", "error");
    } finally {
      setLoading(false);
    }
  };

  // Derive Overview Metrics
  const overview = useMemo(() => {
    if (requests.length === 0) {
      return {
        pendingCount: 0,
        oldestWaiting: "None",
        avgPriority: "0%",
      };
    }

    const avg =
      requests.reduce((acc, curr) => acc + curr.priorityScore, 0) / requests.length;

    // Sort by createdAt ascending to find oldest waiting
    const sorted = [...requests].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const oldestDate = new Date(sorted[0].createdAt);
    const now = new Date();
    const diffHours = Math.max(1, Math.round((now.getTime() - oldestDate.getTime()) / (1000 * 3600)));

    return {
      pendingCount: requests.length,
      oldestWaiting: `${diffHours}h ago`,
      avgPriority: `${(avg * 100).toFixed(0)}%`,
    };
  }, [requests]);

  const handleDecision = async (
    requestId: string,
    decision: "APPROVED" | "REJECTED",
    reasonText?: string
  ) => {
    if (decision === "REJECTED" && !reasonText?.trim()) {
      toast("Rejection reason is required", "error");
      return;
    }

    setActionLoadingId(requestId);

    const reason =
      decision === "APPROVED"
        ? reasonText || "Approved by faculty reviewer after project necessity verification."
        : reasonText;

    try {
      const res = await fetch("/api/faculty/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, decision, reason }),
      });

      const data = await res.json();

      if (res.ok) {
        toast(
          decision === "APPROVED"
            ? "Request approved! Atomic booking confirmed."
            : "Request rejected.",
          "success"
        );
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        setSelectedRequest(null);
        setShowRejectInput(false);
        setRejectReason("");
      } else {
        toast(data.error || "Decision failed", "error");
      }
    } catch {
      toast("Network error recording decision", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-8">
      {/* Bento Row 1: Overview Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiTile
          label="Pending Department Requests"
          value={overview.pendingCount}
          delta={{ value: "Queue", isNeutral: true }}
          subtitle="Scoped to your academic department"
          icon={<Clock className="w-4 h-4 text-status-pending" />}
        />
        <KpiTile
          label="Oldest Waiting Request"
          value={overview.oldestWaiting}
          subtitle="FIFO order adjudication target"
          icon={<AlertCircle className="w-4 h-4 text-primary-muted" />}
        />
        <KpiTile
          label="Average Priority Score"
          value={overview.avgPriority}
          subtitle="Deterministic urgency & fairness"
          icon={<Scale className="w-4 h-4 text-accent" />}
        />
      </div>

      {/* Bento Row 2: Approvals Data Table */}
      <Tile className="space-y-3">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div>
            <h2 className="text-sm font-semibold text-primary">
              Department Approval Queue
            </h2>
            <p className="text-xs text-primary-muted mt-0.5">
              Review and authorize student access with atomic double-booking protection
            </p>
          </div>
          <button
            onClick={fetchPendingApprovals}
            className="p-1.5 rounded-control bg-surface-2 hover:bg-surface-3 border border-border-subtle text-primary transition-colors text-xs flex items-center gap-1"
            title="Refresh queue"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Refresh</span>
          </button>
        </div>

        <DataTable
          data={requests}
          keyExtractor={(r) => r.id}
          emptyMessage="No pending requests in your department queue."
          onRowClick={(r) => {
            setSelectedRequest(r);
            setShowRejectInput(false);
            setRejectReason("");
          }}
          columns={[
            {
              header: "Student",
              cell: (r) => (
                <div>
                  <div className="font-semibold text-primary">{r.student.name}</div>
                  <div className="text-[11px] text-primary-muted truncate">{r.student.email}</div>
                </div>
              ),
            },
            {
              header: "Project",
              cell: (r) => (
                <div className="max-w-[220px]">
                  <div className="font-medium text-primary truncate">{r.projectTitle}</div>
                  <div className="text-[11px] text-primary-muted truncate">{r.projectDescription}</div>
                </div>
              ),
            },
            {
              header: "Equipment",
              cell: (r) => (
                <div className="max-w-[160px]">
                  <div className="font-medium text-primary truncate">{r.equipment.name}</div>
                  <div className="text-[11px] text-primary-muted truncate">{r.equipment.location}</div>
                </div>
              ),
            },
            {
              header: "Requested Slot",
              cell: (r) => {
                const start = new Date(r.preferredStart);
                return (
                  <div className="tabular-nums text-[11px]">
                    <div className="font-medium text-primary">
                      {start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                    <div className="text-primary-muted">
                      {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({r.durationHours}h)
                    </div>
                  </div>
                );
              },
            },
            {
              header: "Deadline",
              cell: (r) => {
                const dead = new Date(r.deadline);
                return (
                  <span className="tabular-nums text-primary-secondary text-[11px]">
                    {dead.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                );
              },
            },
            {
              header: "Priority",
              cell: (r) => (
                <span className="tabular-nums font-semibold text-accent text-xs">
                  {(r.priorityScore * 100).toFixed(0)}%
                </span>
              ),
            },
            {
              header: "Action",
              className: "text-right",
              cell: (r) => (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRequest(r);
                    setShowRejectInput(false);
                    setRejectReason("");
                  }}
                  className="px-2.5 py-1 rounded-control bg-surface-3 hover:bg-border-hover text-primary text-xs font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  <span>Review</span>
                </button>
              ),
            },
          ]}
        />
      </Tile>

      {/* Side Drawer: Detailed Inspection & Approval Actions */}
      <Drawer
        isOpen={selectedRequest !== null}
        onClose={() => {
          setSelectedRequest(null);
          setShowRejectInput(false);
          setRejectReason("");
        }}
        title="Review Access Request"
        subtitle={selectedRequest ? `ID: ${selectedRequest.id.slice(0, 12)}` : ""}
      >
        {selectedRequest && (
          <div className="space-y-4">
            {/* Student & Project Details */}
            <div className="p-3.5 rounded-control bg-surface-2 border border-border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-muted">
                  Student Applicant
                </span>
                <span className="text-[11px] font-semibold text-accent tabular-nums">
                  Score: {(selectedRequest.priorityScore * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <p className="font-semibold text-primary text-sm">{selectedRequest.student.name}</p>
                <p className="text-[11px] text-primary-muted">{selectedRequest.student.email}</p>
              </div>
            </div>

            {/* Target Hardware */}
            <div className="p-3.5 rounded-control bg-surface-2 border border-border-subtle space-y-1.5 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-muted block">
                Target Hardware & Laboratory
              </span>
              <p className="font-semibold text-primary">{selectedRequest.equipment.name}</p>
              <p className="text-primary-secondary flex items-center gap-1 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-primary-muted shrink-0" />
                <span>{selectedRequest.equipment.location}</span>
              </p>
            </div>

            {/* Requested Slot */}
            <div className="p-3.5 rounded-control bg-surface-2 border border-border-subtle space-y-1.5 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-muted block">
                Scheduled Slot Window
              </span>
              <div className="flex items-center gap-2 tabular-nums font-medium text-primary">
                <Calendar className="w-3.5 h-3.5 text-primary-muted" />
                <span>
                  {new Date(selectedRequest.preferredStart).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span>
                  ({new Date(selectedRequest.preferredStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}, {selectedRequest.durationHours} hours)
                </span>
              </div>
              <p className="text-[11px] text-primary-muted tabular-nums">
                Hard Project Deadline: {new Date(selectedRequest.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
            </div>

            {/* Project Description */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-muted block">
                Project Methodology & Objectives:
              </span>
              <p className="text-xs text-primary leading-relaxed p-3 rounded-control bg-surface-2 border border-border-subtle">
                {selectedRequest.projectDescription}
              </p>
            </div>

            {/* AI Proposal Justification */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-accent block flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Submitted Justification for Faculty:
              </span>
              <p className="text-xs text-primary-secondary leading-relaxed p-3 rounded-control bg-surface-2 border border-border-subtle font-mono text-[11px]">
                {selectedRequest.justification}
              </p>
            </div>

            {/* Rejection Reason Form (if triggered) */}
            {showRejectInput && (
              <div className="p-3.5 rounded-control bg-status-rejected-bg border border-status-rejected/30 space-y-2 text-xs">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-status-rejected block">
                  Rejection Reason (Required) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide brief reason for student (e.g. equipment scheduled for maintenance, duration exceeds cap)..."
                  className="w-full p-2.5 rounded-control bg-surface-1 border border-border-subtle text-primary text-xs focus:outline-none"
                />
              </div>
            )}

            {/* Actions Footer */}
            <div className="pt-4 border-t border-border-subtle flex items-center justify-between gap-2">
              {!showRejectInput ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(true)}
                    className="px-3 py-2 rounded-control border border-status-rejected/40 text-status-rejected hover:bg-status-rejected-bg text-xs font-medium transition-colors"
                  >
                    Decline Request...
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(selectedRequest.id, "APPROVED")}
                    disabled={actionLoadingId === selectedRequest.id}
                    className="px-4 py-2 rounded-control bg-accent text-accent-text hover:bg-accent-hover font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-40"
                  >
                    {actionLoadingId === selectedRequest.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Validating Transaction...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve & Confirm Slot
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="w-full flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(false)}
                    className="px-3 py-1.5 rounded-control border border-border-subtle text-primary-muted hover:bg-surface-2 text-xs"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(selectedRequest.id, "REJECTED", rejectReason)}
                    disabled={actionLoadingId === selectedRequest.id || !rejectReason.trim()}
                    className="px-3 py-1.5 rounded-control bg-status-rejected text-white hover:opacity-90 font-medium text-xs disabled:opacity-40"
                  >
                    Confirm Rejection
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
