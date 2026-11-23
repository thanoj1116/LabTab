"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sun,
  Moon,
  Sparkles,
  Download,
  ChevronDown,
  GraduationCap,
  UserCheck,
  ShieldAlert,
  LogOut,
} from "lucide-react";
import { SegmentedControl } from "../bento/SegmentedControl";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "ADMIN";
  department: string | null;
}

interface TopBarProps {
  user: SessionUser | null;
  onRefreshSession: () => void;
  onOpenAssistant: () => void;
  timeRange: "TODAY" | "WEEK" | "MONTH";
  onTimeRangeChange: (val: "TODAY" | "WEEK" | "MONTH") => void;
  onExportCsv?: () => void;
}

export function TopBar({
  user,
  onRefreshSession,
  onOpenAssistant,
  timeRange,
  onTimeRangeChange,
  onExportCsv,
}: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isDark, setIsDark] = useState(true);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light");
    setIsDark(!isLight);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.add("light");
      setIsDark(false);
    } else {
      document.documentElement.classList.remove("light");
      setIsDark(true);
    }
  };

  const handleRoleSwitch = async (role: "STUDENT" | "FACULTY" | "ADMIN") => {
    setRoleDropdownOpen(false);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        onRefreshSession();
        if (role === "STUDENT") router.push("/student/discover");
        else if (role === "FACULTY") router.push("/faculty/approvals");
        else router.push("/admin/dashboard");
      }
    } catch (e) {
      console.error("Role switch error", e);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/session", { method: "DELETE" });
    onRefreshSession();
    router.push("/");
  };

  // Derive title from pathname
  const getPageMeta = () => {
    if (pathname.startsWith("/admin/dashboard")) {
      return {
        title: "Campus Lab Utilisation",
        subtitle: "Real-time resource allocation and capacity across engineering departments",
      };
    }
    if (pathname.startsWith("/student/discover")) {
      return {
        title: "Federated Catalog",
        subtitle: "Search and reserve specialised FPGA, AI, and test hardware",
      };
    }
    if (pathname.startsWith("/student/request")) {
      return {
        title: "Smart Request",
        subtitle: "Deterministic fair allocation with natural language assistance",
      };
    }
    if (pathname.startsWith("/student/requests")) {
      return {
        title: "My Access Tracker",
        subtitle: "Timeline progression and confirmed lab slot reservations",
      };
    }
    if (pathname.startsWith("/faculty/approvals")) {
      return {
        title: "Department Approvals",
        subtitle: "Review project requests with atomic double-booking prevention",
      };
    }
    return {
      title: "LabLink",
      subtitle: "Autonomous campus laboratory equipment federation",
    };
  };

  const meta = getPageMeta();

  return (
    <header className="h-14 border-b border-border-subtle bg-surface-1 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div className="flex flex-col truncate">
        <h1 className="text-sm font-semibold text-primary leading-tight truncate">
          {meta.title}
        </h1>
        <p className="text-[11px] text-primary-muted leading-tight truncate hidden sm:inline">
          {meta.subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Time-Range Segmented Control */}
        <SegmentedControl
          size="sm"
          value={timeRange}
          onChange={onTimeRangeChange}
          options={[
            { value: "TODAY", label: "Today" },
            { value: "WEEK", label: "This week" },
            { value: "MONTH", label: "This month" },
          ]}
        />

        {/* Client-side CSV Export */}
        {onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="p-1.5 rounded-control border border-border-subtle bg-surface-2 hover:bg-surface-3 text-primary text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Export CSV from loaded data"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Export</span>
          </button>
        )}

        {/* Assistant Trigger Button */}
        <button
          type="button"
          onClick={onOpenAssistant}
          className="px-2.5 py-1 rounded-control bg-surface-2 hover:bg-surface-3 border border-border-subtle text-primary text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Open Assistant (Ctrl/Cmd+K)"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="hidden lg:inline text-[11px]">Assistant</span>
          <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-surface-3 text-[10px] text-primary-muted border border-border-subtle">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded-control border border-border-subtle bg-surface-2 hover:bg-surface-3 text-primary transition-colors"
          title={`Switch to ${isDark ? "Light" : "Dark"} theme`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Demo Mode Role Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-control border border-border-subtle bg-surface-2 hover:bg-surface-3 text-xs font-medium text-primary transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="hidden sm:inline text-primary-muted">Demo:</span>
            <strong className="text-primary font-semibold">
              {user ? user.role : "Role"}
            </strong>
            <ChevronDown className="w-3 h-3 text-primary-muted" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-tile bg-surface-1 border border-border-subtle shadow-2xl py-2 z-50 text-xs">
              <div className="px-3 py-2 border-b border-border-subtle">
                <span className="text-[10px] font-semibold text-primary-muted uppercase tracking-wider block">
                  Demo Role Switcher
                </span>
                <span className="text-[11px] text-primary-secondary">
                  One-click evaluation access
                </span>
              </div>

              <button
                onClick={() => handleRoleSwitch("STUDENT")}
                className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-surface-2 text-primary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary-muted" />
                  <div>
                    <div className="font-semibold text-primary">Student</div>
                    <div className="text-[11px] text-primary-muted">Alex Chen (ECE)</div>
                  </div>
                </div>
                {user?.role === "STUDENT" && (
                  <span className="text-[10px] bg-accent text-accent-text font-semibold px-1.5 py-0.5 rounded-control">
                    Active
                  </span>
                )}
              </button>

              <button
                onClick={() => handleRoleSwitch("FACULTY")}
                className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-surface-2 text-primary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary-muted" />
                  <div>
                    <div className="font-semibold text-primary">Faculty Reviewer</div>
                    <div className="text-[11px] text-primary-muted">Prof. Miller (ECE)</div>
                  </div>
                </div>
                {user?.role === "FACULTY" && (
                  <span className="text-[10px] bg-accent text-accent-text font-semibold px-1.5 py-0.5 rounded-control">
                    Active
                  </span>
                )}
              </button>

              <button
                onClick={() => handleRoleSwitch("ADMIN")}
                className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-surface-2 text-primary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-primary-muted" />
                  <div>
                    <div className="font-semibold text-primary">Campus Lab Admin</div>
                    <div className="text-[11px] text-primary-muted">Global Oversight</div>
                  </div>
                </div>
                {user?.role === "ADMIN" && (
                  <span className="text-[10px] bg-accent text-accent-text font-semibold px-1.5 py-0.5 rounded-control">
                    Active
                  </span>
                )}
              </button>

              {user && (
                <div className="pt-2 mt-1 border-t border-border-subtle px-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-2 py-1.5 rounded-control text-status-rejected hover:bg-status-rejected-bg flex items-center gap-2 transition-colors text-[11px]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Reset Session</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
