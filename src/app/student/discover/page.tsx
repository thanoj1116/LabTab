"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Cpu,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
      }
    } catch (e) {
      console.error("Failed to load equipment", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEquipment();
  };

  const parseSpecsObject = (specsStr: string) => {
    try {
      return JSON.parse(specsStr);
    } catch {
      return { details: specsStr };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            Federated Equipment Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Discover and reserve specialized development kits, hardware testbeds, and workstations across 4 engineering departments.
          </p>
        </div>

        <Link
          href="/student/request"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
        >
          <Sparkles className="w-4 h-4" />
          Smart AI Request
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by equipment name, specifications (e.g. FPGA, RTX 4090, 50kN), or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition-colors"
          >
            Search
          </button>
        </form>

        {/* Department Tabs & Category Pills */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Dept:
            </span>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedDept === dept
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-slate-800 text-white"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Equipment List Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Scanning campus laboratory catalog...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-semibold text-slate-900 text-sm">No equipment found matching criteria</h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search terms, department filters, or category selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((eq) => {
            const specs = parseSpecsObject(eq.specs);
            const isScarce = eq.quantity === 1;
            const activeBookingsCount = eq.bookings?.length || 0;
            const isExpanded = expandedSlotsId === eq.id;

            return (
              <div
                key={eq.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Department & Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        eq.department === "ECE"
                          ? "bg-blue-100 text-blue-800"
                          : eq.department === "CSE"
                          ? "bg-indigo-100 text-indigo-800"
                          : eq.department === "Mechanical"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {eq.department}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isScarce ? (
                        <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          1 Unit (Scarce)
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          {eq.quantity} Units Available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Category */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                      {eq.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{eq.category}</p>
                  </div>

                  {/* Specifications Card */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Hardware Specifications
                    </span>
                    <div className="space-y-1 text-slate-600 max-h-24 overflow-y-auto">
                      {Object.entries(specs).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-2 text-[11px]">
                          <span className="font-medium text-slate-500 capitalize">{key}:</span>
                          <span className="font-semibold text-slate-800 text-right truncate">
                            {Array.isArray(value) ? value.join(", ") : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Location & Open Hours */}
                  <div className="space-y-1 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{eq.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Daily Access: {eq.openHoursStart} – {eq.openHoursEnd}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Slot Grid Expand & Action */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExpandedSlotsId(isExpanded ? null : eq.id)}
                      className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{activeBookingsCount} Active Bookings</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <Link
                      href={`/student/request?equipmentId=${eq.id}`}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Request Slot
                    </Link>
                  </div>

                  {/* Expandable Slot Schedule */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-200/60 text-xs space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>Upcoming Confirmed Bookings</span>
                        <span className="text-[10px] text-slate-400">Time window</span>
                      </div>

                      {eq.bookings.length === 0 ? (
                        <p className="text-[11px] text-emerald-600 font-medium py-1">
                          No active bookings. All slots during open hours are free!
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {eq.bookings.map((b) => {
                            const start = new Date(b.start);
                            const end = new Date(b.end);
                            return (
                              <div
                                key={b.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]"
                              >
                                <span className="font-semibold">
                                  {start.toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
