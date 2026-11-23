"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Cpu,
  Scale,
  CalendarCheck,
} from "lucide-react";
import { Tile } from "@/components/bento/Tile";
import { useToast } from "@/components/bento/Toast";

export default function LandingPage() {
  const router = useRouter();
  const { toast } = useToast();
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
        toast(`Logged in as ${role}`, "success");
        if (role === "STUDENT") {
          router.push("/student/discover");
        } else if (role === "FACULTY") {
          router.push("/faculty/approvals");
        } else {
          router.push("/admin/dashboard");
        }
      } else {
        toast("Session establishment failed", "error");
      }
    } catch {
      toast("Network error establishing session", "error");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="py-8 sm:py-12 max-w-4xl mx-auto space-y-8">
      {/* Header Bento Tile */}
      <Tile className="p-6 sm:p-8 space-y-3 bg-surface-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-control bg-accent text-accent-text flex items-center justify-center font-bold text-xs">
            LL
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-muted">
            Campus Laboratory Federation
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
          LabTab Equipment Sharing Platform
        </h1>

        <p className="text-xs sm:text-sm text-primary-secondary max-w-2xl leading-relaxed">
          Federating specialized hardware, development kits, and workstations across academic departments
          (ECE, CSE, Mechanical, EEE) with deterministic fair slot allocation.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-primary-muted">
          <span className="px-2 py-0.5 rounded-control bg-surface-2 border border-border-subtle">
            Deterministic Engine Decides
          </span>
          <span className="px-2 py-0.5 rounded-control bg-surface-2 border border-border-subtle">
            Gemini Understands & Explains
          </span>
          <span className="px-2 py-0.5 rounded-control bg-surface-2 border border-border-subtle">
            Zero Double-Booking Guarantee
          </span>
        </div>
      </Tile>

      {/* Role Picker Section */}
      <div className="space-y-3">
        <div className="px-1 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-primary-muted">
            Select Role to Enter (One-Click Demo Access)
          </h2>
          <span className="text-[11px] text-primary-muted">No login page • Signed JWT cookies</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Student Tile */}
          <Tile
            onClick={() => selectRole("STUDENT")}
            className="p-5 flex flex-col justify-between hover:border-border-hover cursor-pointer transition-colors space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-control bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-semibold text-primary-muted px-2 py-0.5 rounded-control bg-surface-2">
                  Student Portal
                </span>
              </div>

              <div>
                <span className="text-[10px] text-accent font-semibold block uppercase tracking-wider">
                  Alex Chen (ECE)
                </span>
                <h3 className="font-semibold text-sm text-primary mt-0.5">
                  Student Researcher
                </h3>
                <p className="text-xs text-primary-muted mt-1 leading-relaxed">
                  Discover equipment across 4 departments. Free-text requests with fair conflict resolution.
                </p>
              </div>

              <div className="space-y-1 text-[11px] text-primary-secondary pt-2 border-t border-border-subtle">
                <div className="flex items-center gap-1.5">
                  <span className="text-accent">✓</span> Natural language smart request
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-accent">✓</span> Multi-factor fairness score
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-accent">✓</span> Status progression tracker
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={loadingRole !== null}
              className="w-full py-2 px-3 rounded-control bg-accent text-accent-text hover:bg-accent-hover font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span>{loadingRole === "STUDENT" ? "Entering..." : "Enter as Student"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Tile>

          {/* Faculty Tile */}
          <Tile
            onClick={() => selectRole("FACULTY")}
            className="p-5 flex flex-col justify-between hover:border-border-hover cursor-pointer transition-colors space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-control bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-semibold text-primary-muted px-2 py-0.5 rounded-control bg-surface-2">
                  Faculty Review
                </span>
              </div>

              <div>
                <span className="text-[10px] text-accent font-semibold block uppercase tracking-wider">
                  Prof. David Miller (ECE)
                </span>
                <h3 className="font-semibold text-sm text-primary mt-0.5">
                  Department Faculty
                </h3>
                <p className="text-xs text-primary-muted mt-1 leading-relaxed">
                  Review student access requests scoped to your department with atomic race-condition safety.
                </p>
              </div>

              <div className="space-y-1 text-[11px] text-primary-secondary pt-2 border-t border-border-subtle">
                <div className="flex items-center gap-1.5">
                  <span className="text-accent">✓</span> Scoped department queue
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-accent">✓</span> Project justification review
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-accent">✓</span> Atomic booking guard
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={loadingRole !== null}
              className="w-full py-2 px-3 rounded-control bg-accent text-accent-text hover:bg-accent-hover font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span>{loadingRole === "FACULTY" ? "Entering..." : "Enter as Faculty"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Tile>

          {/* Admin Tile */}
          <Tile
            onClick={() => selectRole("ADMIN")}
            className="p-5 flex flex-col justify-between hover:border-border-hover cursor-pointer transition-colors space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-control bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-semibold text-primary-muted px-2 py-0.5 rounded-control bg-surface-2">
                  Global Oversight
                </span>
              </div>

              <div>
                <span className="text-[10px] text-accent font-semibold block uppercase tracking-wider">
                  Campus Administration
                </span>
                <h3 className="font-semibold text-sm text-primary mt-0.5">
                  Lab Administrator
                </h3>
                <p className="text-xs text-primary-muted mt-1 leading-relaxed">
                  Inspect bento telemetry across all 4 departments, locate idle gear, and audit reservations.
                </p>
              </div>

              <div className="space-y-1 text-[11px] text-primary-secondary pt-2 border-t border-border-subtle">
                <div className="flex items-center gap-1.5">
                  <span className="text-accent">✓</span> Utilisation bento charts
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-accent">✓</span> Idle equipment detector
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-accent">✓</span> Reservation audit log
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={loadingRole !== null}
              className="w-full py-2 px-3 rounded-control bg-accent text-accent-text hover:bg-accent-hover font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span>{loadingRole === "ADMIN" ? "Entering..." : "Enter as Admin"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Tile>
        </div>
      </div>

      {/* Production Architecture Callout */}
      <Tile className="p-4 bg-surface-2 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <Lock className="w-3.5 h-3.5 text-accent" />
          <span>Security & SSO Architecture Note</span>
        </div>
        <p className="text-xs text-primary-muted leading-relaxed">
          Production would replace <code className="bg-surface-3 px-1 py-0.5 rounded text-primary">/api/session</code> with college SAML 2.0 / OAuth SSO. RBAC middleware route protection and server-side data scoping remain completely unchanged.
        </p>
      </Tile>
    </div>
  );
}
