"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Calendar,
  Layers,
} from "lucide-react";

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
      }
    } catch (e) {
      console.error("Requests fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-600" />
            My Access Requests & Booking Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track status progression from faculty review to confirmed laboratory workstation reservations.
          </p>
        </div>

        <Link
          href="/student/request"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          New Smart Request
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading your requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-semibold text-slate-900 text-sm">No Access Requests Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven&apos;t submitted any equipment reservations. Use our Smart Request engine to reserve gear across campus.
          </p>
          <Link
            href="/student/request"
            className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium"
          >
            Create Your First Request
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
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
              >
                {/* Header & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Request ID: {req.id.slice(0, 12)}...
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{req.projectTitle}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 ${
                        req.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : req.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {req.status === "APPROVED" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Approved & Booked
                        </>
                      ) : req.status === "PENDING" ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending Faculty Review
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Declined
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Progress Tracker Timeline */}
                <div className="py-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 max-w-lg mx-auto">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        1
                      </div>
                      <span className="text-[11px] font-semibold text-blue-700">Submitted</span>
                    </div>

                    <div className={`h-0.5 flex-1 mx-2 ${req.status !== "CANCELLED" ? "bg-blue-600" : "bg-slate-200"}`} />

                    {/* Step 2 */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          req.status === "PENDING"
                            ? "bg-amber-500 text-white animate-pulse"
                            : req.status === "APPROVED"
                            ? "bg-blue-600 text-white"
                            : "bg-rose-500 text-white"
                        }`}
                      >
                        2
                      </div>
                      <span
                        className={`text-[11px] font-semibold ${
                          req.status === "PENDING"
                            ? "text-amber-700"
                            : req.status === "APPROVED"
                            ? "text-blue-700"
                            : "text-rose-700"
                        }`}
                      >
                        Faculty Review
                      </span>
                    </div>

                    <div className={`h-0.5 flex-1 mx-2 ${req.status === "APPROVED" ? "bg-emerald-600" : "bg-slate-200"}`} />

                    {/* Step 3 */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          req.status === "APPROVED"
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        3
                      </div>
                      <span
                        className={`text-[11px] font-semibold ${
                          req.status === "APPROVED" ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        Confirmed Slot
                      </span>
                    </div>
                  </div>
                </div>

                {/* Equipment & Slot Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Equipment & Location
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {req.equipment.name}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        ({req.equipment.department})
                      </span>
                    </p>
                    <p className="text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {req.equipment.location}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Scheduled Slot Window
                    </span>
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {start.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({req.durationHours} hours)
                    </p>
                  </div>
                </div>

                {/* Decision Reason or Justification */}
                {req.decisionReason && (
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs space-y-1">
                    <span className="font-semibold text-blue-900 block text-[11px]">
                      Faculty Feedback / Decision Note:
                    </span>
                    <p className="text-blue-950 text-[11px]">{req.decisionReason}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
