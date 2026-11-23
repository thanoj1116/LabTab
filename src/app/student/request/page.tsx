"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles,
  Cpu,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Scale,
  ShieldCheck,
  Send,
} from "lucide-react";
import { AllocationOption, ParsedRequest } from "@/schemas";

interface EquipmentOption {
  id: string;
  name: string;
  department: string;
  category: string;
  quantity: number;
}

function SmartRequestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const preselectedEqId = searchParams.get("equipmentId");

  const [equipments, setEquipments] = useState<EquipmentOption[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(true);

  // Natural language prompt state
  const [nlText, setNlText] = useState(
    "I need the Xilinx Zynq FPGA for 4 hours tomorrow between 10:00 and 14:00 for real-time ECG wavelet feature extraction before our capstone submission deadline."
  );
  const [parsing, setParsing] = useState(false);
  const [justifying, setJustifying] = useState(false);

  // Structured Form State (Confirmed by user)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [durationHours, setDurationHours] = useState<number>(4);
  const [deadline, setDeadline] = useState<string>("");
  const [preferredStart, setPreferredStart] = useState<string>("");
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [justification, setJustification] = useState<string>("");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");

  // Scheduling Recommendations State
  const [recommending, setRecommending] = useState(false);
  const [allocationOptions, setAllocationOptions] = useState<AllocationOption[]>([]);
  const [conflictDetected, setConflictDetected] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Presets for Hackathon Evaluator 1-Click Demo
  const presets = [
    {
      label: "Compete for Scarce FPGA (Conflict Demo)",
      text: "I urgently need the Xilinx Zynq FPGA board tomorrow from 10:00 to 14:00 for 4 hours to verify transformer attention matrix multiplication for my capstone deadline.",
      category: "FPGA",
    },
    {
      label: "Deep Learning Workstation (CSE)",
      text: "Requesting the Dual RTX 4090 Workstation for 6 hours before Dec 1 for training our vision-language diffusion model.",
      category: "Workstation",
    },
    {
      label: "Carbon Fiber 3D Print (Mechanical)",
      text: "Need Bambu Lab X1-Carbon for 4 hours tomorrow afternoon to print lightweight quadcopter motor arm joints.",
      category: "3D Printer",
    },
  ];

  useEffect(() => {
    fetchEquipmentList();
    initDates();
  }, []);

  const initDates = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const start = new Date(tomorrow);
    start.setHours(10, 0, 0, 0);

    const dead = new Date(tomorrow);
    dead.setDate(dead.getDate() + 2);
    dead.setHours(18, 0, 0, 0);

    setPreferredStart(formatDateTimeLocal(start));
    setDeadline(formatDateTimeLocal(dead));
  };

  const formatDateTimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fetchEquipmentList = async () => {
    try {
      const res = await fetch("/api/equipment");
      if (res.ok) {
        const data = await res.json();
        setEquipments(data.items);
        if (preselectedEqId) {
          setSelectedEquipmentId(preselectedEqId);
        } else if (data.items.length > 0) {
          // Default to scarce FPGA
          const fpga = data.items.find((e: any) => e.category === "FPGA") || data.items[0];
          setSelectedEquipmentId(fpga.id);
        }
      }
    } catch (e) {
      console.error("Equipment fetch error", e);
    } finally {
      setLoadingEquipments(false);
    }
  };

  const handleAIParse = async () => {
    if (!nlText.trim()) return;
    setParsing(true);
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nlText }),
      });

      if (res.ok) {
        const data = await res.json();
        const parsed: ParsedRequest = data.parsed;

        setProjectTitle(parsed.projectTitle);
        setProjectDescription(parsed.projectSummary);
        setDurationHours(parsed.durationHours);
        setUrgency(parsed.urgency);

        // Find matching equipment by parsed category if not pre-locked
        const match = equipments.find(
          (e) => e.category.toLowerCase() === parsed.equipmentCategory.toLowerCase()
        );
        if (match) {
          setSelectedEquipmentId(match.id);
        }

        // Draft justification automatically
        await handleDraftJustification(parsed.projectTitle, parsed.projectSummary);
      }
    } catch (e) {
      console.error("Parse error", e);
    } finally {
      setParsing(false);
    }
  };

  const handleDraftJustification = async (title: string, desc: string) => {
    const eq = equipments.find((e) => e.id === selectedEquipmentId);
    setJustifying(true);
    try {
      const res = await fetch("/api/ai/draft-justification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: title || "Laboratory Capstone Project",
          projectDescription: desc || "Validation and testing of research deliverables",
          equipmentName: eq ? eq.name : "Specialised Lab Equipment",
          deadline: deadline || new Date().toISOString(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setJustification(data.justification);
      }
    } catch (e) {
      console.error("Justification error", e);
    } finally {
      setJustifying(false);
    }
  };

  const handleCalculateAllocations = async () => {
    if (!selectedEquipmentId) {
      alert("Please select target equipment first.");
      return;
    }

    setRecommending(true);
    setAllocationOptions([]);
    setConflictDetected(false);

    try {
      const res = await fetch("/api/scheduler/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: selectedEquipmentId,
          durationHours,
          deadline: new Date(deadline).toISOString(),
          preferredStart: new Date(preferredStart).toISOString(),
          urgency,
          isCoreRequirement: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAllocationOptions(data.options);
        setConflictDetected(data.conflictDetected);
        if (data.options.length > 0) {
          setSelectedOptionId(data.options[0].id);
        }
      } else {
        const err = await res.json();
        alert(err.error || "Failed to calculate recommendations.");
      }
    } catch (e) {
      console.error("Recommendation error", e);
    } finally {
      setRecommending(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedOptionId) {
      alert("Please select one of the recommended allocation options.");
      return;
    }

    const chosenOption = allocationOptions.find((o) => o.id === selectedOptionId);
    if (!chosenOption) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: chosenOption.equipmentId,
          projectTitle: projectTitle || "Research Project Access",
          projectDescription: projectDescription || "Access request for hardware benchmarking.",
          justification: justification || "Required for capstone experiment completion.",
          deadline: new Date(deadline).toISOString(),
          durationHours,
          preferredStart: chosenOption.slotStart,
          priorityScore: chosenOption.score,
        }),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          router.push("/student/requests");
        }, 1200);
      } else {
        const err = await res.json();
        alert(err.error || "Submission failed.");
      }
    } catch (e) {
      console.error("Submit request error", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          Smart Request & Fair Allocation Engine
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Input your requirements in free text. Gemini converts it to structured constraints, while our deterministic scheduler finds the fairest feasible slots and explains why.
        </p>
      </div>

      {/* 1-Click Demo Presets */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Evaluator Quick-Fill Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setNlText(preset.text);
              }}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-xs font-medium text-slate-700 hover:text-indigo-700 shadow-sm transition-all text-left"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Natural Language Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">
              1
            </span>
            Describe What You Need in Plain Language
          </label>
          <span className="text-[11px] text-slate-400">Server-Side Gemini 2.5 Flash</span>
        </div>

        <textarea
          rows={3}
          value={nlText}
          onChange={(e) => setNlText(e.target.value)}
          placeholder="e.g. I need the Xilinx Zynq FPGA for 4 hours tomorrow between 10:00 and 14:00 for real-time ECG wavelet feature extraction..."
          className="w-full p-3.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 leading-relaxed"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAIParse}
            disabled={parsing || !nlText.trim()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            {parsing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Parsing with Gemini...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Parse Free-Text to Structured Form
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Confirmed Structured Parameters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
              2
            </span>
            Confirm Parsed Request Details
          </label>
          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
            Validated by Zod
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Target Equipment */}
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-slate-700">Target Equipment</label>
            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
            >
              {equipments.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  [{eq.department}] {eq.name} — ({eq.quantity === 1 ? "1 Scarce Unit" : `${eq.quantity} Units`})
                </option>
              ))}
            </select>
          </div>

          {/* Project Title */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Project Title</label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g. Ultra-Low Latency FPGA ECG Feature Extraction"
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            />
          </div>

          {/* Urgency */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Urgency Level</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            >
              <option value="LOW">Low (Exploratory / Initial prototyping)</option>
              <option value="MEDIUM">Medium (Regular coursework / lab assignment)</option>
              <option value="HIGH">High (Capstone milestone / upcoming review)</option>
              <option value="CRITICAL">Critical (Immediate symposium / publication deadline)</option>
            </select>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Duration (Hours)</label>
            <input
              type="number"
              min={1}
              max={24}
              value={durationHours}
              onChange={(e) => setDurationHours(parseInt(e.target.value || "1", 10))}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            />
          </div>

          {/* Preferred Start */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Preferred Start Window</label>
            <input
              type="datetime-local"
              value={preferredStart}
              onChange={(e) => setPreferredStart(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            />
          </div>

          {/* Hard Deadline */}
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-slate-700">Hard Project Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            />
          </div>

          {/* Project Summary */}
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-slate-700">Project Description</label>
            <textarea
              rows={2}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Brief summary of research methodology and objectives..."
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            />
          </div>

          {/* Faculty Justification */}
          <div className="space-y-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                AI-Drafted Faculty Justification
              </label>
              <button
                type="button"
                onClick={() => handleDraftJustification(projectTitle, projectDescription)}
                disabled={justifying}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${justifying ? "animate-spin" : ""}`} />
                Regenerate Justification
              </button>
            </div>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Faculty justification..."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-mono text-[11px]"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={handleCalculateAllocations}
            disabled={recommending || !selectedEquipmentId}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
          >
            {recommending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Computing Deterministic Allocations...
              </>
            ) : (
              <>
                <Scale className="w-4 h-4" />
                Compute Fair Feasible Allocations
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 3: Feasible Allocation Options & Conflict Resolution */}
      {allocationOptions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">
                  3
                </span>
                Recommended Fair Allocations (Top 3 Feasible)
              </h2>
              <p className="text-xs text-slate-500">
                Formula: <code className="bg-slate-100 px-1 py-0.5 rounded">0.5 * Deadline + 0.3 * Fairness + 0.2 * Need</code>
              </p>
            </div>
          </div>

          {/* Conflict Detected Alert */}
          {conflictDetected && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-semibold block text-amber-950">
                  Scheduling Conflict Detected & Fairly Resolved
                </strong>
                <p className="leading-relaxed">
                  The exact slot requested is contested by another confirmed student booking. The deterministic engine has scored competing requirements and identified optimal alternate and cross-department substitute options before your deadline.
                </p>
              </div>
            </div>
          )}

          {/* Options Cards */}
          <div className="grid grid-cols-1 gap-4">
            {allocationOptions.map((opt, idx) => {
              const isSelected = selectedOptionId === opt.id;
              const start = new Date(opt.slotStart);
              const end = new Date(opt.slotEnd);

              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white space-y-4 ${
                    isSelected
                      ? "border-blue-600 shadow-md ring-2 ring-blue-500/10"
                      : "border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          opt.type === "REQUESTED"
                            ? "bg-emerald-100 text-emerald-800"
                            : opt.type === "ALTERNATE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        Option {idx + 1}: {opt.type}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{opt.equipmentName}</h3>
                      <span className="text-xs text-slate-400">({opt.department})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                          Match Score
                        </span>
                        <span className="text-sm font-extrabold text-blue-600">
                          {(opt.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="radio"
                        name="allocationOption"
                        checked={isSelected}
                        onChange={() => setSelectedOptionId(opt.id)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Slot Details */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {start.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                        {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Factor Score Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                        Urgency (50%)
                      </span>
                      <strong className="text-slate-800">
                        {(opt.breakdown.deadlineUrgency * 100).toFixed(0)}%
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                        Fairness (30%)
                      </span>
                      <strong className="text-slate-800">
                        {(opt.breakdown.fairness * 100).toFixed(0)}%
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                        Project Need (20%)
                      </span>
                      <strong className="text-slate-800">
                        {(opt.breakdown.projectNeed * 100).toFixed(0)}%
                      </strong>
                    </div>
                  </div>

                  {/* Gemini Plain-Language Explanation Box */}
                  {opt.explanation && (
                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-950 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-[11px]">
                        <Sparkles className="w-3 h-3" />
                        Why This Allocation is Recommended (Gemini Plain-Language Explanation):
                      </div>
                      <p className="leading-relaxed text-[11px] text-indigo-900">
                        {opt.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submission Action */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSubmitRequest}
              disabled={submitting || !selectedOptionId}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Routing to Faculty Review...
                </>
              ) : submitSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Request Submitted!
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Request for Faculty Approval
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SmartRequestPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Smart Request...</div>}>
      <SmartRequestContent />
    </Suspense>
  );
}
