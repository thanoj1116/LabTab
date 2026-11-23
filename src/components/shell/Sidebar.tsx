"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  Sparkles,
  CalendarCheck,
  CheckSquare,
  BarChart3,
  Cpu,
  FlaskConical,
} from "lucide-react";

interface SidebarProps {
  role: "STUDENT" | "FACULTY" | "ADMIN" | null;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  // Navigation items scoped per role
  const getNavItems = () => {
    if (role === "STUDENT") {
      return [
        {
          label: "Discover",
          href: "/student/discover",
          icon: <Layers className="w-4 h-4" />,
        },
        {
          label: "Smart Request",
          href: "/student/request",
          icon: <Sparkles className="w-4 h-4" />,
        },
        {
          label: "My Requests",
          href: "/student/requests",
          icon: <CalendarCheck className="w-4 h-4" />,
        },
      ];
    }
    if (role === "FACULTY") {
      return [
        {
          label: "Approvals",
          href: "/faculty/approvals",
          icon: <CheckSquare className="w-4 h-4" />,
        },
        {
          label: "Catalog",
          href: "/student/discover",
          icon: <Layers className="w-4 h-4" />,
        },
      ];
    }
    if (role === "ADMIN") {
      return [
        {
          label: "Utilisation",
          href: "/admin/dashboard",
          icon: <BarChart3 className="w-4 h-4" />,
        },
        {
          label: "All Equipment",
          href: "/student/discover",
          icon: <Layers className="w-4 h-4" />,
        },
      ];
    }
    return [
      {
        label: "Role Picker",
        href: "/",
        icon: <FlaskConical className="w-4 h-4" />,
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-16 md:w-56 shrink-0 border-r border-border-subtle bg-surface-1 flex flex-col justify-between py-4 select-none">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="px-3 md:px-5 flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-control bg-accent text-accent-text flex items-center justify-center font-bold">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="font-semibold text-sm leading-tight text-primary">
                LabLink
              </span>
              <span className="text-[10px] text-primary-muted font-medium">
                Campus Federation
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-control text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-text font-semibold shadow-sm"
                    : "text-primary-secondary hover:text-primary hover:bg-surface-2"
                }`}
                title={item.label}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="hidden md:inline truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Role Pill at footer */}
      {role && (
        <div className="px-3 md:px-4 pt-4 border-t border-border-subtle">
          <div className="hidden md:block text-[11px] text-primary-muted truncate">
            Active Mode:
          </div>
          <div className="text-[11px] font-semibold text-primary truncate capitalize">
            {role.toLowerCase()}
          </div>
        </div>
      )}
    </aside>
  );
}
