"use client";

import { useEffect, useState } from "react";
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
  ShieldCheck,
} from "lucide-react";

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
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      }
    } catch (e) {
      console.error("Failed to load approvals", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (requestId: string, decision: "APPROVED" | "REJECTED") => {
    setActionLoadingId(requestId);
    setFeedbackMessage(null);

    const reason = decision === "APPROVED"
      ? "Approved by faculty after project feasibility review."
      : "Declined due to lab capacity constraints.";

    try {
      const res = await fetch("/api/faculty/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, decision, reason }),
      });

      const data = await res.json();

      if (res.ok) {
        setFeedbackMessage({
          type: "success",
          text: decision === "APPROVED"
            ? "Request approved! Confirmed laboratory booking created atomically."
            : "Request rejected.",
        });
        // Remove from pending list
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        setFeedbackMessage({
          type: "error",
          text: data.error || "Decision failed to process.",
        });
      }
    } catch (e) {
      console.error("Decision error", e);
      setFeedbackMessage({
        type: "error",
        text: "Network or server error during decision submission.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-amber-600" />
          Faculty Approval Queue
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review student project access requests scoped to your department. Approvals run in atomic database transactions to guarantee zero double bookings.
        </p>
      </div>

      {/* Real-time Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 font-medium ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Scanning pending department requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-semibold text-slate-900 text-sm">Approval Queue Clear</h3>
          <p className="text-xs text-slate-500">
            All student resource requests in your department have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => {
            const start = new Date(req.preferredStart);
            const deadline = new Date(req.deadline);
            const isProcessing = actionLoadingId === req.id;

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 shadow-sm p-6 space-y-5 transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {req.student.department || "Campus"} Student
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {req.student.name} ({req.student.email})
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {req.projectTitle}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      Computed Priority
                    </span>
                    <span className="text-sm font-extrabold text-blue-600">
                      {(req.priorityScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Description & Justification */}
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider text-slate-400">
                      Project Description:
                    </span>
                    <p className="text-slate-800 mt-0.5 leading-relaxed">
                      {req.projectDescription}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-950 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-amber-800 text-[11px]">
                      <Sparkles className="w-3 h-3" />
                      Student & Gemini Laboratory Justification:
                    </span>
                    <p className="text-[11px] leading-relaxed text-amber-900">
                      {req.justification}
                    </p>
                  </div>
                </div>

                {/* Slot Details Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Target Equipment
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {req.equipment.name}
                    </p>
                    <p className="text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {req.equipment.location}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Requested Slot & Deadline
                    </span>
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {start.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      {" "}({start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}, {req.durationHours} hrs)
                    </p>
                    <p className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Deadline: {deadline.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleDecision(req.id, "REJECTED")}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-rose-700 font-medium text-xs transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Decline Request
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision(req.id, "APPROVED")}
                    disabled={isProcessing}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Validating Transaction...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve & Confirm Booking
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
