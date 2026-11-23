"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Calendar,
  Cpu,
  X,
} from "lucide-react";
import { Tile } from "@/components/bento/Tile";
import { FilterChip } from "@/components/bento/FilterChip";
import { Skeleton } from "@/components/bento/Skeleton";
import { useToast } from "@/components/bento/Toast";

interface EquipmentBooking {
  id: string;
  start: string;
  end: string;
}

interface Equipment {
  id: string;
  name: string;
  department: string;
  category: string;
  specs: string;
  quantity: number;
  location: string;
  openHoursStart: string;
  openHoursEnd: string;
  isActive: boolean;
  bookings: EquipmentBooking[];
}

export default function DiscoverPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSlotsId, setExpandedSlotsId] = useState<string | null>(null);

  const departments = ["ALL", "ECE", "CSE", "Mechanical", "EEE"];
  const categories = [
    "ALL",
    "FPGA",
    "Workstation",
    "Oscilloscope",
    "3D Printer",
    "Sensor Kit",
    "Microcontroller",
  ];

  useEffect(() => {
    fetchEquipment();
  }, [selectedDept, selectedCategory]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDept !== "ALL") params.set("department", selectedDept);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/equipment?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      } else {
        toast("Failed to load catalog", "error");
      }
    } catch {
      toast("Network error loading catalog", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEquipment();
  };

  const clearAllFilters = () => {
    setSelectedDept("ALL");
    setSelectedCategory("ALL");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedDept !== "ALL" || selectedCategory !== "ALL" || searchQuery.trim().length > 0;

  const parseSpecsObject = (specsStr: string) => {
    try {
      return JSON.parse(specsStr);
    } catch {
      return { details: specsStr };
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Tile */}
      <Tile className="space-y-4">
        {/* Search Input Row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-primary-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search equipment by name, category, or specifications (e.g. FPGA, RTX 4090, 50kN)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-control bg-surface-2 border border-border-subtle text-primary placeholder:text-primary-muted focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-control bg-surface-3 hover:bg-border-hover border border-border-subtle text-primary text-xs font-medium transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter Chips: Department & Category */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-border-subtle">
          {/* Department Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-primary-muted uppercase tracking-wider mr-2">
              Department:
            </span>
            {departments.map((dept) => (
              <FilterChip
                key={dept}
                label={dept}
                active={selectedDept === dept}
                onClick={() => setSelectedDept(dept)}
              />
            ))}
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-primary-muted uppercase tracking-wider mr-2">
              Category:
            </span>
            {categories.map((cat) => (
              <FilterChip
                key={cat}
                label={cat}
                active={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              />
            ))}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-auto text-[11px] text-primary-muted hover:text-accent font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </Tile>

      {/* Result Count Row */}
      <div className="flex items-center justify-between text-xs text-primary-muted px-1">
        <span>
          Showing <strong className="text-primary tabular-nums">{items.length}</strong> equipment items
        </span>
        <span className="text-[11px]">Direct reservation & AI slot pairing</span>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Tile className="p-12 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-primary-muted mx-auto" />
          <h3 className="font-semibold text-primary text-sm">No equipment matches current criteria</h3>
          <p className="text-xs text-primary-muted max-w-sm mx-auto">
            Try adjusting your search terms or clearing your department and category filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-3 py-1.5 rounded-control bg-accent text-accent-text text-xs font-medium inline-block mt-2"
          >
            Reset Filters
          </button>
        </Tile>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((eq) => {
            const specs = parseSpecsObject(eq.specs);
            const isScarce = eq.quantity === 1;
            const activeBookingsCount = eq.bookings?.length || 0;
            const isExpanded = expandedSlotsId === eq.id;

            return (
              <Tile
                key={eq.id}
                className="flex flex-col justify-between hover:border-border-hover transition-colors"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-control bg-surface-3 text-primary">
                      {eq.department}
                    </span>

                    {isScarce ? (
                      <span className="text-[10px] font-semibold bg-status-rejected-bg text-status-rejected border border-status-rejected/30 px-2 py-0.5 rounded-control tabular-nums">
                        1 Unit (Scarce)
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-surface-2 text-primary-secondary px-2 py-0.5 rounded-control tabular-nums">
                        {eq.quantity} Units
                      </span>
                    )}
                  </div>

                  {/* Name and Category */}
                  <div>
                    <h3 className="font-semibold text-primary text-sm leading-snug line-clamp-1">
                      {eq.name}
                    </h3>
                    <p className="text-[11px] text-primary-muted mt-0.5">{eq.category}</p>
                  </div>

                  {/* Specs Box */}
                  <div className="p-3 rounded-control bg-surface-2 border border-border-subtle text-xs space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-muted block">
                      Specifications
                    </span>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {Object.entries(specs).slice(0, 3).map(([key, val]) => (
                        <div key={key} className="flex justify-between gap-2 text-[11px]">
                          <span className="text-primary-muted capitalize truncate">{key}:</span>
                          <span className="font-medium text-primary text-right truncate">
                            {Array.isArray(val) ? val.join(", ") : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Location & Open Hours */}
                  <div className="space-y-1 text-xs text-primary-muted pt-1 border-t border-border-subtle">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-primary-muted" />
                      <span className="truncate">{eq.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-primary-muted" />
                      <span className="tabular-nums">
                        {eq.openHoursStart} – {eq.openHoursEnd}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions and Live Slots Expander */}
                <div className="pt-3 mt-3 border-t border-border-subtle space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedSlotsId(isExpanded ? null : eq.id)}
                      className="text-xs text-primary-secondary hover:text-primary flex items-center gap-1 font-medium"
                    >
                      <Calendar className="w-3.5 h-3.5 text-primary-muted" />
                      <span className="tabular-nums">{activeBookingsCount} Booked</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    <Link
                      href={`/student/request?equipmentId=${eq.id}`}
                      className="px-3 py-1.5 rounded-control bg-accent text-accent-text hover:bg-accent-hover font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Sparkles className="w-3 h-3" />
                      Request
                    </Link>
                  </div>

                  {/* Expandable Live Slot Schedule */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-border-subtle text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-primary-muted uppercase">
                        <span>Scheduled Slots</span>
                        <span>Window</span>
                      </div>

                      {eq.bookings.length === 0 ? (
                        <p className="text-[11px] text-status-approved font-medium py-1">
                          No active bookings. All open hours free.
                        </p>
                      ) : (
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {eq.bookings.map((b) => {
                            const start = new Date(b.start);
                            const end = new Date(b.end);
                            return (
                              <div
                                key={b.id}
                                className="flex items-center justify-between p-2 rounded-control bg-surface-2 border border-border-subtle text-[11px]"
                              >
                                <span className="font-medium text-primary">
                                  {start.toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span className="tabular-nums text-primary-secondary">
                                  {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                                  {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Tile>
            );
          })}
        </div>
      )}
    </div>
  );
}
