import { describe, it, expect } from "vitest";
import {
  isWithinOpenHours,
  countOverlappingBookings,
  isSlotAvailable,
  findFreeSlots,
  computeScore,
  recommendAllocations,
  WEIGHT_DEADLINE_URGENCY,
  WEIGHT_FAIRNESS,
  WEIGHT_PROJECT_NEED,
} from "../src/lib/scheduler/index";
import { EquipmentItem, ExistingBooking, TimeSlot, SchedulingRequestInput } from "../src/lib/scheduler/types";
import { createBookingWithGuard } from "../src/lib/scheduler/booking-guard";
import { prisma } from "../src/lib/db";

describe("Scheduling Engine — Deterministic Logic", () => {
  const baseEquipment: EquipmentItem = {
    id: "eq-fpga-1",
    name: "Xilinx Zynq UltraScale+ FPGA",
    department: "ECE",
    category: "FPGA",
    specs: JSON.stringify({ clock: "1.2GHz", logicCells: "504K" }),
    quantity: 1, // Single scarce unit
    location: "ECE Embedded Lab - Room 302",
    openHoursStart: "08:00",
    openHoursEnd: "20:00",
    isActive: true,
  };

  const substituteEquipment: EquipmentItem = {
    id: "eq-fpga-2",
    name: "Intel Altera Cyclone V FPGA",
    department: "CSE",
    category: "FPGA",
    specs: JSON.stringify({ logicElements: "110K", dspBlocks: "112" }),
    quantity: 2,
    location: "CSE Hardware Lab - Room 104",
    openHoursStart: "08:00",
    openHoursEnd: "20:00",
    isActive: true,
  };

  it("enforces equipment open hours (08:00 to 20:00)", () => {
    // 09:00 to 12:00 within open hours
    const validSlot: TimeSlot = {
      start: new Date(2026, 10, 24, 9, 0, 0),
      end: new Date(2026, 10, 24, 12, 0, 0),
    };
    expect(isWithinOpenHours(validSlot, baseEquipment)).toBe(true);

    // 07:00 to 09:00 before open hours (08:00)
    const earlySlot: TimeSlot = {
      start: new Date(2026, 10, 24, 7, 0, 0),
      end: new Date(2026, 10, 24, 9, 0, 0),
    };
    expect(isWithinOpenHours(earlySlot, baseEquipment)).toBe(false);

    // 19:00 to 21:00 extends past open hours (20:00)
    const lateSlot: TimeSlot = {
      start: new Date(2026, 10, 24, 19, 0, 0),
      end: new Date(2026, 10, 24, 21, 0, 0),
    };
    expect(isWithinOpenHours(lateSlot, baseEquipment)).toBe(false);

    // Spanning multiple days
    const multiDaySlot: TimeSlot = {
      start: new Date(2026, 10, 24, 18, 0, 0),
      end: new Date(2026, 10, 25, 10, 0, 0),
    };
    expect(isWithinOpenHours(multiDaySlot, baseEquipment)).toBe(false);
  });

  it("accurately detects overlapping bookings and respects quantity", () => {
    const existingBookings: ExistingBooking[] = [
      {
        id: "b1",
        equipmentId: "eq-fpga-1",
        start: new Date(2026, 10, 24, 10, 0, 0),
        end: new Date(2026, 10, 24, 13, 0, 0),
        status: "CONFIRMED",
      },
    ];

    // Overlapping slot (11:00 to 14:00) on quantity=1 equipment
    const conflictSlot: TimeSlot = {
      start: new Date(2026, 10, 24, 11, 0, 0),
      end: new Date(2026, 10, 24, 14, 0, 0),
    };
    expect(countOverlappingBookings("eq-fpga-1", conflictSlot, existingBookings)).toBe(1);
    expect(isSlotAvailable(baseEquipment, conflictSlot, existingBookings)).toBe(false);

    // Non-overlapping slot after 13:00
    const nonConflictSlot: TimeSlot = {
      start: new Date(2026, 10, 24, 13, 0, 0),
      end: new Date(2026, 10, 24, 16, 0, 0),
    };
    expect(countOverlappingBookings("eq-fpga-1", nonConflictSlot, existingBookings)).toBe(0);
    expect(isSlotAvailable(baseEquipment, nonConflictSlot, existingBookings)).toBe(true);

    // Multi-quantity equipment (quantity = 2) allows 1 overlapping booking
    expect(isSlotAvailable(substituteEquipment, conflictSlot, existingBookings)).toBe(true);

    // When 2 bookings overlap for quantity = 2, it becomes unavailable
    const multiBookings: ExistingBooking[] = [
      ...existingBookings,
      {
        id: "b2",
        equipmentId: "eq-fpga-2",
        start: new Date(2026, 10, 24, 10, 0, 0),
        end: new Date(2026, 10, 24, 13, 0, 0),
        status: "CONFIRMED",
      },
      {
        id: "b3",
        equipmentId: "eq-fpga-2",
        start: new Date(2026, 10, 24, 11, 0, 0),
        end: new Date(2026, 10, 24, 14, 0, 0),
        status: "CONFIRMED",
      },
    ];
    expect(isSlotAvailable(substituteEquipment, conflictSlot, multiBookings)).toBe(false);
  });

  it("ignores cancelled bookings when calculating availability", () => {
    const cancelledBookings: ExistingBooking[] = [
      {
        id: "b-cancelled",
        equipmentId: "eq-fpga-1",
        start: new Date(2026, 10, 24, 10, 0, 0),
        end: new Date(2026, 10, 24, 13, 0, 0),
        status: "CANCELLED",
      },
    ];

    const slot: TimeSlot = {
      start: new Date(2026, 10, 24, 10, 0, 0),
      end: new Date(2026, 10, 24, 13, 0, 0),
    };
    expect(countOverlappingBookings("eq-fpga-1", slot, cancelledBookings)).toBe(0);
    expect(isSlotAvailable(baseEquipment, slot, cancelledBookings)).toBe(true);
  });

  it("strictly enforces deadlines when finding free slots", () => {
    const deadline = new Date(2026, 10, 24, 14, 0, 0); // 2:00 PM deadline
    const windowStart = new Date(2026, 10, 24, 8, 0, 0);

    const slots = findFreeSlots(baseEquipment, 3, windowStart, deadline, []);
    for (const s of slots) {
      expect(s.end.getTime()).toBeLessThanOrEqual(deadline.getTime());
      expect(s.start.getHours()).toBeGreaterThanOrEqual(8);
      expect(s.end.getHours()).toBeLessThanOrEqual(20);
    }
  });

  it("calculates multi-factor priority scores and breaks ties fairly", () => {
    const now = new Date(2026, 10, 24, 8, 0, 0);
    const deadlineUrgent = new Date(2026, 10, 24, 20, 0, 0); // 12 hours away

    const inputStudentA: SchedulingRequestInput = {
      equipmentId: "eq-fpga-1",
      durationHours: 3,
      deadline: deadlineUrgent,
      preferredStart: new Date(2026, 10, 24, 10, 0, 0),
      studentId: "student-1",
      studentRecentBookingCount: 0, // 0 prior bookings => 1.0 fairness
      urgencyLevel: "CRITICAL",
      isCoreRequirement: true,
    };

    const slot: TimeSlot = {
      start: new Date(2026, 10, 24, 10, 0, 0),
      end: new Date(2026, 10, 24, 13, 0, 0),
    };

    const scoreA = computeScore(inputStudentA, slot, now);
    expect(scoreA.deadlineUrgency).toBeGreaterThan(0.7);
    expect(scoreA.fairness).toBe(1.0);
    expect(scoreA.projectNeed).toBe(1.0);

    // Verify exact formula breakdown
    expect(scoreA.totalScore).toBeCloseTo(
      WEIGHT_DEADLINE_URGENCY * scoreA.deadlineUrgency +
      WEIGHT_FAIRNESS * scoreA.fairness +
      WEIGHT_PROJECT_NEED * scoreA.projectNeed,
      2
    );

    // Tie-breaker: Student B with equal urgency but 4 prior bookings
    const inputStudentB: SchedulingRequestInput = {
      equipmentId: "eq-fpga-1",
      durationHours: 3,
      deadline: deadlineUrgent,
      preferredStart: new Date(2026, 10, 24, 10, 0, 0),
      studentId: "student-2",
      studentRecentBookingCount: 4, // Student B has used equipment frequently
      urgencyLevel: "CRITICAL",
      isCoreRequirement: true,
    };

    const scoreB = computeScore(inputStudentB, slot, now);
    expect(scoreB.fairness).toBeLessThan(scoreA.fairness);
    expect(scoreA.totalScore).toBeGreaterThan(scoreB.totalScore); // Fair allocation to student with fewer bookings
  });

  it("recommends top-3 feasible options including alternate slot and cross-department substitute", () => {
    const existingBookings: ExistingBooking[] = [
      {
        id: "b-busy",
        equipmentId: "eq-fpga-1",
        start: new Date(2026, 10, 24, 10, 0, 0),
        end: new Date(2026, 10, 24, 14, 0, 0), // Blocks requested slot 10-13
        status: "CONFIRMED",
      },
    ];

    const input: SchedulingRequestInput = {
      equipmentId: "eq-fpga-1",
      durationHours: 3,
      deadline: new Date(2026, 10, 25, 18, 0, 0),
      preferredStart: new Date(2026, 10, 24, 10, 0, 0), // Blocked
      studentId: "student-alex",
      studentRecentBookingCount: 1,
      urgencyLevel: "MEDIUM",
      isCoreRequirement: true,
    };

    const recommendations = recommendAllocations(
      input,
      baseEquipment,
      [baseEquipment, substituteEquipment],
      existingBookings,
      new Date(2026, 10, 24, 8, 0, 0)
    );

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeLessThanOrEqual(3);

    const types = recommendations.map((r) => r.type);
    expect(types.some((t) => t === "ALTERNATE" || t === "SUBSTITUTE")).toBe(true);

    const substituteRec = recommendations.find((r) => r.type === "SUBSTITUTE");
    if (substituteRec) {
      expect(substituteRec.equipment.department).toBe("CSE");
      expect(substituteRec.feasible).toBe(true);
    }
  });

  it("database transaction guard prevents double booking race conditions", async () => {
    // Look up the seeded scarce FPGA
    const fpga = await prisma.equipment.findFirst({
      where: { id: "eq-ece-fpga-zynq" },
    });
    expect(fpga).toBeDefined();

    // Look up the pre-existing booking for Alex
    const existingBooking = await prisma.booking.findFirst({
      where: { equipmentId: fpga!.id, status: "CONFIRMED" },
    });
    expect(existingBooking).toBeDefined();

    // Look up Priya's competing request
    const competingReq = await prisma.request.findFirst({
      where: { id: "req-priya-conflict-fpga" },
    });
    expect(competingReq).toBeDefined();

    // Attempting to book the EXACT conflicting slot for Priya must be rejected by the transaction guard!
    const result = await createBookingWithGuard({
      requestId: competingReq!.id,
      equipmentId: fpga!.id,
      start: existingBooking!.start,
      end: existingBooking!.end,
      facultyId: "usr-faculty-miller",
      approvalReason: "Simulating concurrent approval race condition",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("SLOT_DOUBLE_BOOKED_CONFLICT");
  });
});
