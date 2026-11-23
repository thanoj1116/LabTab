"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Layers,
  CalendarCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Cpu,
  RefreshCw,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AdminStats {
  summary: {
    totalEquipment: number;
    totalRequests: number;
    totalBookings: number;
    pendingApprovals: number;
  };
  deptStats: Array<{
    department: string;
    equipmentCount: number;
    activeBookings: number;
    totalRequests: number;
    utilizationRate: number;
  }>;
  idleEquipments: Array<{
    id: string;
    name: string;
    department: string;
    category: string;
    location: string;
  }>;
  recentBookings: Array<{
    id: string;
    start: string;
    end: string;
    status: string;
    equipment: {
      name: string;
      department: string;
    };
    request: {
      student: {
        name: string;
        email: string;
      };
    };
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to load admin stats", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            Campus Lab Utilisation & Federation Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global administrative analytics across ECE, CSE, Mechanical, and EEE laboratories.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Aggregating cross-department telemetry...</p>
        </div>
      ) : !stats ? (
        <div className="text-center py-12 text-slate-500 text-xs">Failed to load analytics.</div>
      ) : (
        <>
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Federated Gear
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900">
                  {stats.summary.totalEquipment}
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> 4 Depts
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Across 10+ campus labs</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Bookings
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-blue-600">
                  {stats.summary.totalBookings}
                </span>
                <span className="text-xs text-blue-600 font-semibold">Confirmed</span>
              </div>
              <p className="text-[11px] text-slate-500">Zero double-booking guarantee</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Requests
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900">
                  {stats.summary.totalRequests}
                </span>
                <span className="text-xs text-indigo-600 font-semibold">AI Handled</span>
              </div>
              <p className="text-[11px] text-slate-500">Natural language parsed</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pending Approvals
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-amber-600">
                  {stats.summary.pendingApprovals}
                </span>
                <span className="text-xs text-amber-600 font-semibold">In Review</span>
              </div>
              <p className="text-[11px] text-slate-500">Department faculty queues</p>
            </div>
          </div>

          {/* Department Utilization Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recharts Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  Department Equipment & Booking Density
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparing federated inventory against active student bookings.
                </p>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.deptStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="department" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Bar dataKey="equipmentCount" name="Total Equipment" fill="#9333ea" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="activeBookings" name="Active Bookings" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Idle Equipment Alert List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-slate-900 text-sm">Under-Utilised / Idle Gear</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Equipment with zero active bookings. Recommended for inter-department promotion.
                </p>

                <div className="space-y-3 mt-4">
                  {stats.idleEquipments.map((eq) => (
                    <div
                      key={eq.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate">{eq.name}</span>
                        <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          {eq.department}
                        </span>
                      </div>
                      <div className="text-slate-500 flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{eq.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 text-purple-900 text-[11px] leading-relaxed">
                💡 <strong>Admin Action:</strong> Campus scheduler promotes these items as cross-department substitutes to balance peak laboratory loads.
              </div>
            </div>
          </div>

          {/* Recent Bookings Audit Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                Cross-Department Reservation Audit Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live confirmed bookings across all campus departments.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Equipment</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Time Window</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentBookings.map((b) => {
                    const start = new Date(b.start);
                    const end = new Date(b.end);

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {b.equipment.name}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {b.equipment.department}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {b.request?.student?.name}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}{" "}
                          ({start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Confirmed
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
