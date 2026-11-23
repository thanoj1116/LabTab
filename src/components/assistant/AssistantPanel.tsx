"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Search,
  Layers,
  CalendarCheck,
  BarChart3,
  CheckSquare,
  PlusCircle,
  Clock,
  ArrowRight,
  X,
} from "lucide-react";

export const ASSISTANT_NAME = "LabLink Assistant";

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: "STUDENT" | "FACULTY" | "ADMIN" | null;
}

export function AssistantPanel({
  isOpen,
  onClose,
  userRole = "STUDENT",
}: AssistantPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Esc key closes panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleAction = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleSmartRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    // Navigates to Smart Request page with prefilled query text (no direct AI call in panel)
    const encoded = encodeURIComponent(query.trim());
    router.push(`/student/request?prefill=${encoded}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Solid low-opacity backdrop (no blur) */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        className="relative z-10 w-full max-w-xl bg-surface-1 border border-border-subtle rounded-tile shadow-2xl overflow-hidden text-xs text-primary"
      >
        {/* Header with Title and Assistant Name */}
        <div className="px-4 py-3 bg-surface-2 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-control bg-accent text-accent-text flex items-center justify-center font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 id="assistant-title" className="font-semibold text-primary">
              {ASSISTANT_NAME}
            </h2>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-control bg-surface-3 text-primary-muted">
              {userRole || "Navigation"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-primary-muted">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-3 border border-border-subtle text-[10px]">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1 rounded-control text-primary-muted hover:text-primary"
              aria-label="Close assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Natural Language Prompt Input (For Student) */}
        {userRole === "STUDENT" && (
          <form
            onSubmit={handleSmartRequestSubmit}
            className="p-4 border-b border-border-subtle flex items-center gap-2 bg-surface-1"
          >
            <Search className="w-4 h-4 text-primary-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe what lab gear or slot you need (e.g. FPGA board tomorrow morning)..."
              className="flex-1 bg-transparent text-xs text-primary placeholder:text-primary-muted focus:outline-none"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="px-2.5 py-1 rounded-control bg-accent text-accent-text disabled:opacity-40 font-medium text-[11px] flex items-center gap-1 transition-colors"
            >
              <span>Smart Request</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </form>
        )}

        {/* Quick Role-Scoped Navigation Actions */}
        <div className="p-3 space-y-1">
          <div className="px-2 py-1 text-[11px] uppercase tracking-wider font-semibold text-primary-muted">
            Quick Actions ({userRole || "General"})
          </div>

          {userRole === "STUDENT" && (
            <>
              <button
                type="button"
                onClick={() => handleAction("/student/discover")}
                className="w-full text-left px-3 py-2 rounded-control hover:bg-surface-2 flex items-center justify-between text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-primary-muted" />
                  <span>Discover Federated Equipment Catalog</span>
                </div>
                <span className="text-[11px] text-primary-muted">4 Departments</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction("/student/request")}
                className="w-full text-left px-3 py-2 rounded-control hover:bg-surface-2 flex items-center justify-between text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>Open Smart AI Request Composer</span>
                </div>
                <span className="text-[11px] text-primary-muted">AI Form</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction("/student/requests")}
                className="w-full text-left px-3 py-2 rounded-control hover:bg-surface-2 flex items-center justify-between text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className="w-4 h-4 text-primary-muted" />
                  <span>Track My Booking Status</span>
                </div>
                <span className="text-[11px] text-primary-muted">Timeline</span>
              </button>
            </>
          )}

          {userRole === "FACULTY" && (
            <>
              <button
                type="button"
                onClick={() => handleAction("/faculty/approvals")}
                className="w-full text-left px-3 py-2 rounded-control hover:bg-surface-2 flex items-center justify-between text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4 text-accent" />
                  <span>Review Pending Department Approvals</span>
                </div>
                <span className="text-[11px] text-primary-muted">Queue</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction("/student/discover")}
                className="w-full text-left px-3 py-2 rounded-control hover:bg-surface-2 flex items-center justify-between text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-primary-muted" />
                  <span>Browse Campus Equipment Catalog</span>
                </div>
                <span className="text-[11px] text-primary-muted">All Labs</span>
              </button>
            </>
          )}

          {userRole === "ADMIN" && (
            <>
              <button
                type="button"
                onClick={() => handleAction("/admin/dashboard")}
                className="w-full text-left px-3 py-2 rounded-control hover:bg-surface-2 flex items-center justify-between text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-accent" />
                  <span>Open Campus Utilisation & Analytics</span>
                </div>
                <span className="text-[11px] text-primary-muted">Bento</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction("/student/discover")}
                className="w-full text-left px-3 py-2 rounded-control hover:bg-surface-2 flex items-center justify-between text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-primary-muted" />
                  <span>Manage All Equipment Items</span>
                </div>
                <span className="text-[11px] text-primary-muted">Inventory</span>
              </button>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-surface-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-primary-muted">
          <span>Navigation & shortcut palette only. Data mutations require role verification.</span>
          <span className="tabular-nums">v1.0</span>
        </div>
      </div>
    </div>
  );
}
