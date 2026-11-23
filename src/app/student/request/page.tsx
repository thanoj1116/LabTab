"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Scale,
  Send,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Tile } from "@/components/bento/Tile";
import { ProgressBar } from "@/components/bento/ProgressBar";
import { useToast } from "@/components/bento/Toast";
import { AllocationOption, ParsedRequest } from "@/schemas";

interface EquipmentOption {
  id: string;
  name: string;
  department: string;
  category: string;
  quantity: number;
}

function SmartRequestContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const preselectedEqId = searchParams.get("equipmentId");
  const prefillText = searchParams.get("prefill");

  const [equipments, setEquipments] = useState<EquipmentOption[]>([]);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Natural language prompt state
  const [nlText, setNlText] = useState(
    prefillText ||
      "I need the Xilinx Zynq FPGA for 4 hours tomorrow between 10:00 and 14:00 for real-time ECG wavelet feature extraction before our capstone submission deadline."
  );
  const [parsing, setParsing] = useState(false);
  const [justifying, setJustifying] = useState(false);

  // Structured Form State
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

  // 1-Click presets for evaluators
  const presets = [
    {
      label: "Compete for Scarce FPGA (Conflict Demo)",
      text: "I urgently need the Xilinx Zynq FPGA board tomorrow from 10:00 to 14:00 for 4 hours to verify transformer attention matrix multiplication for my capstone deadline.",
    },
    {
      label: "Dual RTX 4090 Workstation (CSE)",
      text: "Requesting the Dual RTX 4090 Workstation for 6 hours before Dec 1 for training our vision-language diffusion model.",
    },
    {
      label: "Bambu Carbon Fiber 3D Print (Mech)",
      text: "Need Bambu Lab X1-Carbon for 4 hours tomorrow afternoon to print lightweight quadcopter motor arm joints.",
    },
  ];

  useEffect(() => {
    fetchEquipmentList();
    initDates();
  }, []);

  // If prefilled from assistant, run parse once equipments load
  useEffect(() => {
    if (prefillText && equipments.length > 0) {
      handleAIParse(prefillText);
    }
  }, [prefillText, equipments]);

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
          const fpga = data.items.find((e: any) => e.category === "FPGA") || data.items[0];
          setSelectedEquipmentId(fpga.id);
        }
      }
    } catch {
      toast("Error loading equipment", "error");
    }
  };

  const handleAIParse = async (textToParse = nlText) => {
    if (!textToParse.trim()) return;
    setParsing(true);
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToParse }),
      });

      if (res.ok) {
        const data = await res.json();
        const parsed: ParsedRequest = data.parsed;

        setProjectTitle(parsed.projectTitle);
        setProjectDescription(parsed.projectSummary);
        setDurationHours(parsed.durationHours);
        setUrgency(parsed.urgency);

        const match = equipments.find(
          (e) => e.category.toLowerCase() === parsed.equipmentCategory.toLowerCase()
        );
        if (match) {
          setSelectedEquipmentId(match.id);
        }

        setCurrentStep(2);
        toast("Parsed into structured parameters", "success");
        await handleDraftJustification(parsed.projectTitle, parsed.projectSummary);
      } else {
        toast("Parse failed; using fallback schema", "error");
      }
    } catch {
      toast("Network error during request parse", "error");
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
          projectTitle: title || "Laboratory Research Project",
          projectDescription: desc || "Access request for hardware verification",
          equipmentName: eq ? eq.name : "Specialised Laboratory Gear",
          deadline: deadline || new Date().toISOString(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setJustification(data.justification);
      }
    } catch {
      // Graceful fallback
    } finally {
      setJustifying(false);
    }
  };

  const handleCalculateAllocations = async () => {
    if (!selectedEquipmentId) {
      toast("Please select target equipment", "error");
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
        setCurrentStep(3);
        toast("Found feasible allocations", "success");
      } else {
        const err = await res.json();
        toast(err.error || "Failed to calculate allocations", "error");
      }
    } catch {
      toast("Error calculating recommendations", "error");
    } finally {
      setRecommending(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedOptionId) {
      toast("Please select an allocation option", "error");
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
          justification: justification || "Required for scheduled experiment completion.",
          deadline: new Date(deadline).toISOString(),
          durationHours,
          preferredStart: chosenOption.slotStart,
          priorityScore: chosenOption.score,
        }),
      });

      if (res.ok) {
        toast("Request routed to department faculty reviewer", "success");
        setTimeout(() => {
          router.push("/student/requests");
        }, 800);
      } else {
        const err = await res.json();
        toast(err.error || "Failed to submit request", "error");
      }
    } catch {
      toast("Network error during submission", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-8">
      {/* 3-Step Progress Indicator */}
      <Tile className="p-4 bg-surface-1">
        <div className="flex items-center justify-between max-w-lg mx-auto text-xs font-medium">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="flex items-center gap-2 text-left"
          >
            <div
              className={`w-6 h-6 rounded-control flex items-center justify-center text-xs font-bold ${
                currentStep === 1
                  ? "bg-accent text-accent-text"
                  : currentStep > 1
                  ? "bg-surface-3 text-status-approved"
                  : "bg-surface-2 text-primary-muted"
              }`}
            >
              1
            </div>
            <span className={currentStep === 1 ? "text-primary font-semibold" : "text-primary-muted"}>
              Describe Need
            </span>
          </button>

          <div className="h-px flex-1 bg-border-subtle mx-3" />

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="flex items-center gap-2 text-left"
          >
            <div
              className={`w-6 h-6 rounded-control flex items-center justify-center text-xs font-bold ${
                currentStep === 2
                  ? "bg-accent text-accent-text"
                  : currentStep > 2
                  ? "bg-surface-3 text-status-approved"
                  : "bg-surface-2 text-primary-muted"
              }`}
            >
              2
            </div>
            <span className={currentStep === 2 ? "text-primary font-semibold" : "text-primary-muted"}>
              Confirm Details
            </span>
          </button>

          <div className="h-px flex-1 bg-border-subtle mx-3" />

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => allocationOptions.length > 0 && setCurrentStep(3)}
            disabled={allocationOptions.length === 0}
            className="flex items-center gap-2 text-left disabled:opacity-40"
          >
            <div
              className={`w-6 h-6 rounded-control flex items-center justify-center text-xs font-bold ${
                currentStep === 3
                  ? "bg-accent text-accent-text"
                  : "bg-surface-2 text-primary-muted"
              }`}
            >
              3
            </div>
            <span className={currentStep === 3 ? "text-primary font-semibold" : "text-primary-muted"}>
              Choose Slot
            </span>
          </button>
        </div>
      </Tile>

      {/* Evaluator 1-Click Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-muted mr-1">
          Demo Presets:
        </span>
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setNlText(preset.text);
              setCurrentStep(1);
            }}
            className="px-2.5 py-1 rounded-control bg-surface-2 hover:bg-surface-3 border border-border-subtle text-primary text-xs font-medium transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Step 1: Free Text Input */}
      <Tile className="space-y-3">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-primary">
              Step 1: Describe Your Requirements
            </h2>
          </div>
          <span className="text-[11px] text-primary-muted font-mono">
            Gemini 2.5 Flash Server-Side
          </span>
        </div>

        <textarea
          rows={3}
          value={nlText}
          onChange={(e) => setNlText(e.target.value)}
          placeholder="e.g. I need the Xilinx Zynq FPGA for 4 hours tomorrow between 10:00 and 14:00 for real-time ECG wavelet feature extraction..."
          className="w-full p-3 rounded-control bg-surface-2 border border-border-subtle text-primary text-xs leading-relaxed focus:border-accent focus:outline-none"
        />

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => handleAIParse()}
            disabled={parsing || !nlText.trim()}
            className="px-4 py-2 rounded-control bg-accent text-accent-text hover:bg-accent-hover font-medium text-xs flex items-center gap-2 transition-colors disabled:opacity-40 shadow-sm"
          >
            {parsing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Parsing Constraints...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Extract Structured Constraints
              </>
            )}
          </button>
        </div>
      </Tile>

      {/* Step 2: Confirmed Parameters Form */}
      <Tile className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <h2 className="text-sm font-semibold text-primary">
            Step 2: Confirm Structured Parameters
          </h2>
          <span className="text-[10px] uppercase font-semibold text-status-approved px-2 py-0.5 rounded-control bg-status-approved-bg border border-status-approved/30">
            Validated by Zod
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Target Equipment */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-semibold uppercase text-primary-muted">
              Target Equipment *
            </label>
            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              className="w-full p-2.5 rounded-control bg-surface-2 border border-border-subtle text-primary text-xs focus:outline-none"
            >
              {equipments.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  [{eq.department}] {eq.name} ({eq.quantity === 1 ? "1 Scarce Unit" : `${eq.quantity} Units`})
                </option>
              ))}
            </select>
          </div>

          {/* Project Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase text-primary-muted">
              Project Title *
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g. FPGA Real-Time Arrhythmia Detection"
              className="w-full p-2.5 rounded-control bg-surface-2 border border-border-subtle text-primary text-xs focus:border-accent focus:outline-none"
            />
          </div>

          {/* Urgency */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase text-primary-muted">
              Urgency Level *
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              className="w-full p-2.5 rounded-control bg-surface-2 border border-border-subtle text-primary text-xs focus:outline-none"
            >
              <option value="LOW">Low (Coursework / initial exploration)</option>
              <option value="MEDIUM">Medium (Scheduled lab milestone)</option>
              <option value="HIGH">High (Capstone milestone review)</option>
              <option value="CRITICAL">Critical (Impending publication/defense)</option>
            </select>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase text-primary-muted">
              Duration (Hours) *
            </label>
            <input
              type="number"
              min={1}
              max={24}
              value={durationHours}
              onChange={(e) => setDurationHours(parseInt(e.target.value || "1", 10))}
              className="w-full p-2.5 rounded-control bg-surface-2 border border-border-subtle text-primary text-xs focus:border-accent focus:outline-none tabular-nums"
            />
          </div>

          {/* Preferred Start */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase text-primary-muted">
              Preferred Start *
            </label>
            <input
              type="datetime-local"
              value={preferredStart}
              onChange={(e) => setPreferredStart(e.target.value)}
              className="w-full p-2.5 rounded-control bg-surface-2 border border-border-subtle text-primary text-xs focus:border-accent focus:outline-none tabular-nums"
            />
          </div>

          {/* Deadline */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-semibold uppercase text-primary-muted">
              Hard Project Deadline *
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full p-2.5 rounded-control bg-surface-2 border border-border-subtle text-primary text-xs focus:border-accent focus:outline-none tabular-nums"
            />
          </div>

          {/* Editable Faculty Justification */}
          <div className="space-y-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase text-primary-muted">
                Faculty Justification (Editable)
              </label>
              <button
                type="button"
                onClick={() => handleDraftJustification(projectTitle, projectDescription)}
                disabled={justifying}
                className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${justifying ? "animate-spin" : ""}`} />
                Regenerate Justification
              </button>
            </div>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full p-2.5 rounded-control bg-surface-2 border border-border-subtle text-primary text-xs font-mono focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-border-subtle flex justify-end">
          <button
            type="button"
            onClick={handleCalculateAllocations}
            disabled={recommending || !selectedEquipmentId}
            className="px-4 py-2 rounded-control bg-accent text-accent-text hover:bg-accent-hover font-medium text-xs flex items-center gap-2 transition-colors disabled:opacity-40 shadow-sm"
          >
            {recommending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Computing Feasible Allocations...
              </>
            ) : (
              <>
                <Scale className="w-3.5 h-3.5" />
                Compute Fair Feasible Allocations
              </>
            )}
          </button>
        </div>
      </Tile>

      {/* Step 3: Feasible Allocation Options */}
      {allocationOptions.length > 0 && (
        <Tile className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <div>
              <h2 className="text-sm font-semibold text-primary">
                Step 3: Ranked Feasible Allocation Options
              </h2>
              <p className="text-[11px] text-primary-muted mt-0.5">
                Evaluated by: 0.5×Urgency + 0.3×Fairness + 0.2×Need
              </p>
            </div>
          </div>

          {/* High-Contrast Conflict Detection Banner */}
          {conflictDetected && (
            <div className="p-3.5 rounded-control bg-status-pending-bg border border-status-pending/40 text-status-pending text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <AlertTriangle className="w-4 h-4 text-status-pending shrink-0" />
                <span>Scheduling Conflict Detected & Fairly Resolved</span>
              </div>
              <p className="text-primary-secondary text-[11px] leading-relaxed">
                The requested slot on the target equipment is currently contested by another student.
                The deterministic engine evaluated project urgency and fairness, offering feasible alternate and substitute allocations prior to your deadline.
              </p>
            </div>
          )}

          {/* Option Tiles */}
          <div className="space-y-3">
            {allocationOptions.map((opt, idx) => {
              const isSelected = selectedOptionId === opt.id;
              const start = new Date(opt.slotStart);
              const end = new Date(opt.slotEnd);

              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`p-4 rounded-tile border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? "border-accent bg-surface-2"
                      : "border-border-subtle bg-surface-1 hover:border-border-hover"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-control ${
                          opt.type === "REQUESTED"
                            ? "bg-status-approved-bg text-status-approved border border-status-approved/30"
                            : opt.type === "ALTERNATE"
                            ? "bg-surface-3 text-primary"
                            : "bg-surface-3 text-accent border border-accent/30"
                        }`}
                      >
                        Option {idx + 1}: {opt.type}
                      </span>
                      <h3 className="font-semibold text-primary text-xs">{opt.equipmentName}</h3>
                      <span className="text-[11px] text-primary-muted">({opt.department})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-primary-muted uppercase font-semibold block">
                          Score
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-accent">
                          {(opt.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="radio"
                        name="selectedSlot"
                        checked={isSelected}
                        onChange={() => setSelectedOptionId(opt.id)}
                        className="accent-lime"
                      />
                    </div>
                  </div>

                  {/* Slot Details */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-primary-secondary bg-surface-2 p-2 rounded-control">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary-muted" />
                      {start.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="tabular-nums flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary-muted" />
                      {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                      {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Multi-factor Score Progress Bars */}
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <ProgressBar
                      label="Urgency (50%)"
                      sublabel={`${(opt.breakdown.deadlineUrgency * 100).toFixed(0)}%`}
                      value={opt.breakdown.deadlineUrgency * 100}
                    />
                    <ProgressBar
                      label="Fairness (30%)"
                      sublabel={`${(opt.breakdown.fairness * 100).toFixed(0)}%`}
                      value={opt.breakdown.fairness * 100}
                    />
                    <ProgressBar
                      label="Project Need (20%)"
                      sublabel={`${(opt.breakdown.projectNeed * 100).toFixed(0)}%`}
                      value={opt.breakdown.projectNeed * 100}
                    />
                  </div>

                  {/* Plain Language Explanation */}
                  {opt.explanation && (
                    <div className="p-2.5 rounded-control bg-surface-2 border border-border-subtle text-xs text-primary-secondary space-y-1">
                      <span className="text-[10px] font-semibold text-accent uppercase tracking-wider block">
                        Why this option was recommended:
                      </span>
                      <p className="text-[11px] leading-relaxed text-primary">
                        {opt.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submission button */}
          <div className="pt-2 border-t border-border-subtle flex justify-end">
            <button
              type="button"
              onClick={handleSubmitRequest}
              disabled={submitting || !selectedOptionId}
              className="px-5 py-2.5 rounded-control bg-accent text-accent-text hover:bg-accent-hover font-semibold text-xs flex items-center gap-2 transition-colors disabled:opacity-40 shadow-sm"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Routing to Faculty Review...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Request for Faculty Approval
                </>
              )}
            </button>
          </div>
        </Tile>
      )}
    </div>
  );
}

export default function SmartRequestPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-primary-muted">Loading Smart Request...</div>}>
      <SmartRequestContent />
    </Suspense>
  );
}
