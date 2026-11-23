"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Cpu,
} from "lucide-react";
import { Tile } from "@/components/bento/Tile";
import { KpiTile } from "@/components/bento/KpiTile";
import { StatusTag } from "@/components/bento/StatusTag";
import { Skeleton } from "@/components/bento/Skeleton";
import { useToast } from "@/components/bento/Toast";

interface RequestItem {
  id: string;
  projectTitle: string;
  projectDescription: string;
  justification: string;
  deadline: string;
  durationHours: number;
  preferredStart: string;
  priorityScore: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  decisionReason: string | null;
  createdAt: string;
  equipment: {
    id: string;
    name: string;
    department: string;
    category: string;
    location: string;
  };
  booking: {
    id: string;
    start: string;
    end: string;
    status: string;
  } | null;
  approvals: Array<{
    id: string;
    decision: string;
    reason: string | null;
    decidedAt: string;
    faculty: {
      name: string;
    };
  }>;
}

export default function StudentRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      } else {
        toast("Failed to load requests", "error");
      }
    } catch {
      toast("Network error loading requests", "error");
    } finally {
      setLoading(false);
    }
  };

  // Derive counts & next booking from loaded data
  const metrics = useMemo(() => {
    const approved = requests.filter((r) => r.status === "APPROVED");
    const pending = requests.filter((r) => r.status === "PENDING");
    const rejected = requests.filter((r) => r.status === "REJECTED");

    // Upcoming approved bookings sorted chronologically
    const upcomingBookings = approved
      .filter((r) => r.booking && new Date(r.booking.end) >= new Date())
      .sort((a, b) => new Date(a.booking!.start).getTime() - new Date(b.booking!.start).getTime());

    const nextBooking = upcomingBookings[0] || approved[0] || null;

    return {
      total: requests.length,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      nextBooking,
      allApproved: approved,
    };
  }, [requests]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-44" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-8">
      {/* Bento Row 1: Status Overview Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Confirmed Slots"
          value={metrics.approvedCount}
          delta={{ value: "Active", isPositive: true }}
          subtitle="Ready for laboratory check-in"
          icon={<CheckCircle2 className="w-4 h-4 text-status-approved" />}
        />
        <KpiTile
          label="In Review"
          value={metrics.pendingCount}
          delta={{ value: "Queue", isNeutral: true }}
          subtitle="Department faculty evaluation"
          icon={<Clock className="w-4 h-4 text-status-pending" />}
        />
        <KpiTile
          label="Total Requests"
          value={metrics.total}
          subtitle="Cumulative access history"
          icon={<CalendarCheck className="w-4 h-4" />}
        />
        <Tile className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-primary-muted font-medium mb-2">
            <span className="uppercase tracking-wider text-[11px] font-semibold">
              New Reservation
            </span>
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <p className="text-xs text-primary-secondary leading-snug">
            Need more compute or testing hardware?
          </p>
          <div className="pt-2 border-t border-border-subtle mt-2">
            <Link
              href="/student/request"
              className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold"
            >
              Start Smart Request <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Tile>
      </div>

      {/* Bento Row 2: "My Bookings" Stacked Card Widget */}
      {metrics.allApproved.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-muted">
              My Bookings (Stacked Cards)
            </span>
            <span className="text-[11px] text-primary-muted">Active laboratory passes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.allApproved.map((req, idx) => {
              const isPrimaryNext = idx === 0;
              const start = new Date(req.booking ? req.booking.start : req.preferredStart);
              const end = new Date(req.booking ? req.booking.end : req.preferredStart);

              return (
                <Tile
                  key={req.id}
                  variant={isPrimaryNext ? "accent" : "surface2"}
                  className="p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold uppercase tracking-wider">
                        {isPrimaryNext ? "Next Confirmed Slot" : `Booking #${idx + 1}`}
                      </span>
                      <span className="font-medium">
                        [{req.equipment.department}]
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm leading-snug">
                      {req.equipment.name}
                    </h3>

                    <div className="text-xs space-y-1 pt-1 opacity-90">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {start.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 tabular-nums">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{req.equipment.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-current/20 flex items-center justify-between text-[11px]">
                    <span className="font-medium truncate max-w-[150px]">
                      {req.projectTitle}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {req.durationHours}h Pass
                    </span>
                  </div>
                </Tile>
              );
            })}
          </div>
        </div>
      )}

      {/* Bento Row 3: Full Request Timeline List */}
      <Tile className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div>
            <h3 className="text-sm font-semibold text-primary">Request Timeline & Log</h3>
            <p className="text-xs text-primary-muted mt-0.5">
              Track status from proposal submission to faculty authorization
            </p>
          </div>
          <span className="text-xs font-semibold tabular-nums text-primary-secondary">
            {requests.length} Total Records
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-primary-muted mx-auto" />
            <h4 className="font-semibold text-primary text-xs">No Access Requests Submitted</h4>
            <p className="text-[11px] text-primary-muted max-w-xs mx-auto">
              You haven&apos;t reserved any laboratory equipment yet. Use Smart Request to find open slots.
            </p>
            <Link
              href="/student/request"
              className="px-3 py-1.5 rounded-control bg-accent text-accent-text text-xs font-medium inline-block mt-2"
            >
              Start First Request
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const start = new Date(req.preferredStart);
              const deadline = new Date(req.deadline);

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-tile border border-border-subtle bg-surface-2 space-y-4"
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-muted">
                          ID: {req.id.slice(0, 10)}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-control bg-surface-3 text-primary-secondary">
                          {req.equipment.department}
                        </span>
                      </div>
                      <h4 className="font-semibold text-primary text-sm mt-0.5">
                        {req.projectTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-primary-muted block uppercase font-semibold">
                          Priority
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-accent">
                          {(req.priorityScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <StatusTag status={req.status} />
                    </div>
                  </div>

                  {/* 4-Step Progress Indicator per Request */}
                  <div className="py-1">
                    <div className="flex items-center justify-between max-w-md mx-auto text-xs font-medium">
                      {/* Step 1: Submitted */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-5 h-5 rounded-control bg-surface-3 text-status-approved flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                        <span className="text-[10px] text-primary-secondary font-medium">
                          Submitted
                        </span>
                      </div>

                      <div className="h-px flex-1 bg-border-subtle mx-2" />

                      {/* Step 2: Under Review */}
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-5 h-5 rounded-control flex items-center justify-center text-[10px] font-bold ${
                            req.status === "PENDING"
                              ? "bg-status-pending-bg text-status-pending border border-status-pending/40"
                              : "bg-surface-3 text-status-approved"
                          }`}
                        >
                          {req.status === "PENDING" ? "2" : "✓"}
                        </div>
                        <span
                          className={`text-[10px] font-medium ${
                            req.status === "PENDING" ? "text-status-pending" : "text-primary-secondary"
                          }`}
                        >
                          Review
                        </span>
                      </div>

                      <div className="h-px flex-1 bg-border-subtle mx-2" />

                      {/* Step 3: Approved / Decision */}
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-5 h-5 rounded-control flex items-center justify-center text-[10px] font-bold ${
                            req.status === "APPROVED"
                              ? "bg-status-approved-bg text-status-approved border border-status-approved/40"
                              : req.status === "REJECTED"
                              ? "bg-status-rejected-bg text-status-rejected"
                              : "bg-surface-3 text-primary-muted"
                          }`}
                        >
                          {req.status === "APPROVED"
                            ? "✓"
                            : req.status === "REJECTED"
                            ? "✕"
                            : "3"}
                        </div>
                        <span
                          className={`text-[10px] font-medium ${
                            req.status === "APPROVED"
                              ? "text-status-approved"
                              : req.status === "REJECTED"
                              ? "text-status-rejected"
                              : "text-primary-muted"
                          }`}
                        >
                          Decision
                        </span>
                      </div>

                      <div className="h-px flex-1 bg-border-subtle mx-2" />

                      {/* Step 4: Booked */}
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-5 h-5 rounded-control flex items-center justify-center text-[10px] font-bold ${
                            req.status === "APPROVED"
                              ? "bg-accent text-accent-text"
                              : "bg-surface-3 text-primary-muted"
                          }`}
                        >
                          4
                        </div>
                        <span
                          className={`text-[10px] font-medium ${
                            req.status === "APPROVED" ? "text-primary font-semibold" : "text-primary-muted"
                          }`}
                        >
                          Booked
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-surface-1 p-3 rounded-control border border-border-subtle">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold uppercase text-primary-muted">
                        Equipment & Location
                      </span>
                      <p className="font-semibold text-primary">{req.equipment.name}</p>
                      <p className="text-[11px] text-primary-secondary flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary-muted" />
                        {req.equipment.location}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold uppercase text-primary-muted">
                        Time Window & Deadline
                      </span>
                      <p className="font-medium text-primary flex items-center gap-1.5 tabular-nums">
                        <Calendar className="w-3 h-3 text-primary-muted" />
                        {start.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        ({start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}, {req.durationHours}h)
                      </p>
                      <p className="text-[11px] text-primary-muted flex items-center gap-1 tabular-nums">
                        <Clock className="w-3 h-3 text-primary-muted" />
                        Deadline: {deadline.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Faculty Decision Reason */}
                  {req.decisionReason && (
                    <div className="p-2.5 rounded-control bg-surface-1 border border-border-subtle text-xs space-y-0.5">
                      <span className="text-[10px] font-semibold uppercase text-primary-muted block">
                        Faculty Review Note:
                      </span>
                      <p className="text-[11px] text-primary">{req.decisionReason}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Tile>
    </div>
  );
}
