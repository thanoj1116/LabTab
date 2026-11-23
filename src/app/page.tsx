"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Cpu,
  Clock,
  Layers,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const selectRole = async (role: "STUDENT" | "FACULTY" | "ADMIN") => {
    setLoadingRole(role);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        if (role === "STUDENT") {
          router.push("/student/discover");
        } else if (role === "FACULTY") {
          router.push("/faculty/approvals");
        } else {
          router.push("/admin/dashboard");
        }
      } else {
        alert("Session error. Please ensure database seed has run.");
      }
    } catch (e) {
      console.error("Role login error:", e);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="py-8 sm:py-12 max-w-5xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Autonomous Cross-Department Laboratory Resource Sharing
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Unlock Specialised Lab Gear Across Campus
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          LabLink bridges departmental silos in ECE, CSE, Mechanical, and EEE. Discover scarce FPGA boards,
          AI compute clusters, 3D printers, and testing rigs with intelligent, fair scheduling.
        </p>
      </div>

      {/* Role Picker Section */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900">
            Select Your Role to Enter (One-Click Demo Access)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Evaluator instant entry without credentials. Sessions are securely signed with <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">jose</code> JWT cookies and guarded by RBAC middleware.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Student Card */}
          <div
            onClick={() => selectRole("STUDENT")}
            className="group relative bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Demo User: Alex Chen
                </span>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Student Portal
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Search equipment across 4 departments. Make free-text requests translated by Gemini into structured slots, with fair conflict resolution.
                </p>
              </div>

              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Natural language smart booking
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Multi-factor fairness score
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Real-time status tracking
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button
                type="button"
                disabled={loadingRole !== null}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {loadingRole === "STUDENT" ? "Signing In..." : "Enter as Student"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Faculty Card */}
          <div
            onClick={() => selectRole("FACULTY")}
            className="group relative bg-white rounded-2xl border-2 border-slate-200 hover:border-amber-500 p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Demo User: Prof. David Miller
                </span>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Faculty Reviewer
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Review project access requests scoped to your department. Review AI-drafted student justifications and approve slots with atomic safety.
                </p>
              </div>

              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Department-scoped access queue
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> AI justification inspection
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Race-condition double-booking guard
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button
                type="button"
                disabled={loadingRole !== null}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 group-hover:bg-amber-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {loadingRole === "FACULTY" ? "Signing In..." : "Enter as Faculty"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Admin Card */}
          <div
            onClick={() => selectRole("ADMIN")}
            className="group relative bg-white rounded-2xl border-2 border-slate-200 hover:border-purple-500 p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  Demo User: Lab Administration
                </span>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Campus Lab Admin
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Global campus oversight. Inspect utilization across all 4 engineering departments, discover idle equipment, and audit all bookings.
                </p>
              </div>

              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> Recharts lab utilization charts
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> Under-utilized idle gear locator
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> Cross-department override control
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button
                type="button"
                disabled={loadingRole !== null}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 group-hover:bg-purple-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {loadingRole === "ADMIN" ? "Signing In..." : "Enter as Admin"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture & Security Highlights Callout */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
          <Lock className="w-4 h-4 text-emerald-600" />
          Enterprise Security & Core Architectural Principles
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="font-semibold text-slate-800 block">Deterministic Engine Decides</span>
            <span>All scheduling, free slots, and conflict resolution are computed in pure TypeScript. No hallucinatory schedules.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="font-semibold text-slate-800 block">Gemini 2.5 Flash Server-Side</span>
            <span>Used strictly for structured parsing, plain-language fairness explanations, and proposal drafting behind rate limiters.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="font-semibold text-slate-800 block">SSO Architecture Note</span>
            <span>Production would replace <code className="bg-slate-200 px-1 py-0.2 rounded">/api/session</code> with college SAML/OAuth. RBAC middleware & API data scoping remain identical.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
