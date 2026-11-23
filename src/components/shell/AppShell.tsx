"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AssistantPanel } from "../assistant/AssistantPanel";
import { ToastProvider } from "../bento/Toast";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "ADMIN";
  department: string | null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [timeRange, setTimeRange] = useState<"TODAY" | "WEEK" | "MONTH">("WEEK");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  // Global Ctrl/Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsAssistantOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/session");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error("Session check error in AppShell", e);
    }
  };

  const handleExportCsv = () => {
    // Client-side CSV export trigger
    window.dispatchEvent(new CustomEvent("lablink:export-csv"));
  };

  const isLandingPage = pathname === "/";

  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-canvas text-primary font-sans antialiased selection:bg-accent selection:text-accent-text">
        {/* Sidebar (shown on all authenticated routes, hidden on landing) */}
        {!isLandingPage && <Sidebar role={user?.role || null} />}

        {/* Main Application Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!isLandingPage && (
            <TopBar
              user={user}
              onRefreshSession={fetchSession}
              onOpenAssistant={() => setIsAssistantOpen(true)}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              onExportCsv={handleExportCsv}
            />
          )}

          <main className="flex-1 w-full max-w-[1280px] mx-auto p-4 sm:p-6">
            {children}
          </main>
        </div>

        {/* Integrated AI Assistant */}
        <AssistantPanel
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          userRole={user?.role || null}
        />
      </div>
    </ToastProvider>
  );
}
