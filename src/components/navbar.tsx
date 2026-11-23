"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FlaskConical,
  User,
  GraduationCap,
  ShieldAlert,
  ChevronDown,
  Layers,
  CalendarCheck,
  BarChart3,
  LogOut,
  Sparkles,
} from "lucide-react";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "ADMIN";
  department: string | null;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/session");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error("Failed to load session in navbar", e);
    }
  };

  const handleRoleSwitch = async (role: "STUDENT" | "FACULTY" | "ADMIN") => {
    setSwitching(true);
    setIsDropdownOpen(false);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (role === "STUDENT") router.push("/student/discover");
        else if (role === "FACULTY") router.push("/faculty/approvals");
        else router.push("/admin/dashboard");
      }
    } catch (e) {
      console.error("Role switch error", e);
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/session", { method: "DELETE" });
    setUser(null);
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 flex items-center gap-1.5">
                  LabLink
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    MVP
                  </span>
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Campus Lab Resource Sharing
                </span>
              </div>
            </Link>

            {/* Navigation Links based on role */}
            {user && (
              <div className="hidden md:flex items-center gap-1 text-sm font-medium">
                {user.role === "STUDENT" && (
                  <>
                    <Link
                      href="/student/discover"
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                        pathname === "/student/discover"
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      Discover Equipment
                    </Link>
                    <Link
                      href="/student/request"
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                        pathname === "/student/request"
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Smart Request
                    </Link>
                    <Link
                      href="/student/requests"
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                        pathname === "/student/requests"
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <CalendarCheck className="w-4 h-4" />
                      My Access Tracker
                    </Link>
                  </>
                )}

                {user.role === "FACULTY" && (
                  <>
                    <Link
                      href="/faculty/approvals"
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                        pathname === "/faculty/approvals"
                          ? "bg-amber-50 text-amber-800 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <CalendarCheck className="w-4 h-4 text-amber-600" />
                      Department Approval Queue
                    </Link>
                    <Link
                      href="/student/discover"
                      className="px-3 py-1.5 rounded-lg transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <Layers className="w-4 h-4" />
                      Browse Catalog
                    </Link>
                  </>
                )}

                {user.role === "ADMIN" && (
                  <>
                    <Link
                      href="/admin/dashboard"
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                        pathname === "/admin/dashboard"
                          ? "bg-purple-50 text-purple-700 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                      Lab Utilisation Analytics
                    </Link>
                    <Link
                      href="/student/discover"
                      className="px-3 py-1.5 rounded-lg transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <Layers className="w-4 h-4" />
                      All Equipment
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Action: Demo Role Switcher Badge */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-expanded={isDropdownOpen}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Demo Mode:{" "}
                  <strong className="text-slate-900 font-semibold">
                    {user ? user.role : "Select Role"}
                  </strong>
                </span>
                {user?.department && (
                  <span className="text-slate-400 font-normal">({user.department})</span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      One-Click Role Switcher
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Instantly test RBAC access paths for evaluators.
                    </p>
                  </div>

                  <button
                    onClick={() => handleRoleSwitch("STUDENT")}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-blue-700">
                          Student
                        </div>
                        <div className="text-[11px] text-slate-500">Alex Chen (ECE)</div>
                      </div>
                    </div>
                    {user?.role === "STUDENT" && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                        Active
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleRoleSwitch("FACULTY")}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50 group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-amber-800">
                          Faculty Reviewer
                        </div>
                        <div className="text-[11px] text-slate-500">Prof. Miller (ECE)</div>
                      </div>
                    </div>
                    {user?.role === "FACULTY" && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                        Active
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleRoleSwitch("ADMIN")}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-purple-50 group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-purple-800">
                          Lab Admin
                        </div>
                        <div className="text-[11px] text-slate-500">All Departments</div>
                      </div>
                    </div>
                    {user?.role === "ADMIN" && (
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium">
                        Active
                      </span>
                    )}
                  </button>

                  {user && (
                    <div className="pt-2 mt-1 border-t border-slate-100 px-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Clear Demo Session
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
