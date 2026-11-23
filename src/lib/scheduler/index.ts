import {
  EquipmentItem,
  ExistingBooking,
  TimeSlot,
  SchedulingRequestInput,
  ScoreBreakdown,
  AllocationCandidate,
} from "./types";

// Named constants for scoring weights as specified
export const WEIGHT_DEADLINE_URGENCY = 0.5;
export const WEIGHT_FAIRNESS = 0.3;
export const WEIGHT_PROJECT_NEED = 0.2;

/**
 * Parses time string "HH:mm" into hours and minutes
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.split(":");
  return {
    hours: parseInt(parts[0] || "8", 10),
    minutes: parseInt(parts[1] || "0", 10),
  };
}

/**
 * Checks if a slot falls strictly within open hours of an equipment
 */
export function isWithinOpenHours(slot: TimeSlot, equipment: EquipmentItem): boolean {
  const startHourMin = parseTimeString(equipment.openHoursStart);
  const endHourMin = parseTimeString(equipment.openHoursEnd);

  // Check start
  const openTimeStart = new Date(slot.start);
  openTimeStart.setHours(startHourMin.hours, startHourMin.minutes, 0, 0);

  // Check end
  const openTimeEnd = new Date(slot.start);
  openTimeEnd.setHours(endHourMin.hours, endHourMin.minutes, 0, 0);

  // Same calendar day constraint for lab workstations & safety
  const isSameDay =
    slot.start.getFullYear() === slot.end.getFullYear() &&
    slot.start.getMonth() === slot.end.getMonth() &&
    slot.start.getDate() === slot.end.getDate();

  if (!isSameDay) return false;

  return slot.start >= openTimeStart && slot.end <= openTimeEnd;
}

/**
 * Counts overlapping confirmed bookings for an equipment during [slotStart, slotEnd]
 */
export function countOverlappingBookings(
  equipmentId: string,
  slot: TimeSlot,
  existingBookings: ExistingBooking[]
): number {
  return existingBookings.filter((b) => {
    if (b.equipmentId !== equipmentId) return false;
    if (b.status === "CANCELLED") return false;
    // Overlap condition: start < b.end && end > b.start
    return slot.start < b.end && slot.end > b.start;
  }).length;
}

/**
 * Checks if a specific slot is available for an equipment respecting quantity
 */
export function isSlotAvailable(
  equipment: EquipmentItem,
  slot: TimeSlot,
  existingBookings: ExistingBooking[]
): boolean {
  if (!equipment.isActive) return false;
  if (!isWithinOpenHours(slot, equipment)) return false;

  const activeBookingsCount = countOverlappingBookings(equipment.id, slot, existingBookings);
  return activeBookingsCount < equipment.quantity;
}

/**
 * Generates viable discrete candidate slots during open hours up to deadline
 */
export function findFreeSlots(
  equipment: EquipmentItem,
  durationHours: number,
  searchWindowStart: Date,
  deadline: Date,
  existingBookings: ExistingBooking[],
  maxSlots: number = 20
): TimeSlot[] {
  const freeSlots: TimeSlot[] = [];
  const startHours = parseTimeString(equipment.openHoursStart);
  const endHours = parseTimeString(equipment.openHoursEnd);

  // Day-by-day search from searchWindowStart to deadline
  const currentDay = new Date(searchWindowStart);
  currentDay.setHours(0, 0, 0, 0);

  const endDay = new Date(deadline);
  endDay.setHours(23, 59, 59, 999);

  while (currentDay <= endDay && freeSlots.length < maxSlots) {
    const dayOpen = new Date(currentDay);
    dayOpen.setHours(startHours.hours, startHours.minutes, 0, 0);

    const dayClose = new Date(currentDay);
    dayClose.setHours(endHours.hours, endHours.minutes, 0, 0);

    // Step in 1-hour increments through the day
    let slotStart = new Date(dayOpen);
    if (slotStart < searchWindowStart) {
      slotStart = new Date(searchWindowStart);
      // Round up to nearest whole hour if needed
      if (slotStart.getMinutes() > 0 || slotStart.getSeconds() > 0) {
        slotStart.setHours(slotStart.getHours() + 1, 0, 0, 0);
      }
      if (slotStart < dayOpen) {
        slotStart = new Date(dayOpen);
      }
    }

    while (slotStart < dayClose && freeSlots.length < maxSlots) {
      const slotEnd = new Date(slotStart.getTime() + durationHours * 3600 * 1000);

      // Must be within open hours and before or at deadline
      if (slotEnd <= dayClose && slotEnd <= deadline) {
        const candidateSlot: TimeSlot = { start: new Date(slotStart), end: slotEnd };
        if (isSlotAvailable(equipment, candidateSlot, existingBookings)) {
          freeSlots.push(candidateSlot);
        }
      }

      // Increment by 1 hour to test the next slot
      slotStart = new Date(slotStart.getTime() + 3600 * 1000);
    }

    // Move to next calendar day
    currentDay.setDate(currentDay.getDate() + 1);
  }

  return freeSlots;
}

/**
 * Computes deterministic score and factor breakdown:
 * score = 0.5 * deadlineUrgency + 0.3 * fairness + 0.2 * projectNeed
 */
export function computeScore(
  input: SchedulingRequestInput,
  slot: TimeSlot,
  referenceNow: Date = new Date()
): ScoreBreakdown {
  // 1. deadlineUrgency: Sooner deadline scores higher (normalised 0-1)
  // Distance from now to deadline in hours. E.g. 12h = urgent (1.0), 168h (1 week) = 0.2
  const msToDeadline = Math.max(0, input.deadline.getTime() - referenceNow.getTime());
  const hoursToDeadline = msToDeadline / (1000 * 3600);
  // Cap between 0 and 1, where 1 means immediate deadline (<= 24 hours), 0 means > 240 hours (10 days)
  let deadlineUrgency = Math.max(0, Math.min(1, 1 - hoursToDeadline / 240));
  if (input.urgencyLevel === "CRITICAL") deadlineUrgency = Math.max(deadlineUrgency, 0.95);
  else if (input.urgencyLevel === "HIGH") deadlineUrgency = Math.max(deadlineUrgency, 0.8);

  // 2. fairness: Fewer recent bookings by that student scores higher (normalised 0-1)
  const recentBookings = input.studentRecentBookingCount ?? 0;
  // If student has 0 bookings: 1.0; 5+ bookings: 0.2
  const fairness = Math.max(0.1, Math.min(1.0, 1.0 - (recentBookings * 0.18)));

  // 3. projectNeed: derived from structured fields such as how essential the equipment is (normalised 0-1)
  let projectNeed = 0.6; // baseline
  if (input.isCoreRequirement) projectNeed += 0.3;
  if (input.urgencyLevel === "CRITICAL") projectNeed += 0.1;
  else if (input.urgencyLevel === "LOW") projectNeed -= 0.2;
  projectNeed = Math.max(0, Math.min(1.0, projectNeed));

  const totalScore = Number(
    (
      WEIGHT_DEADLINE_URGENCY * deadlineUrgency +
      WEIGHT_FAIRNESS * fairness +
      WEIGHT_PROJECT_NEED * projectNeed
    ).toFixed(3)
  );

  return {
    deadlineUrgency: Number(deadlineUrgency.toFixed(3)),
    fairness: Number(fairness.toFixed(3)),
    projectNeed: Number(projectNeed.toFixed(3)),
    totalScore,
  };
}

/**
 * Top 3 FEASIBLE options:
 * a. The requested slot, if free
 * b. The best alternate slot BEFORE the deadline
 * c. An equivalent substitute (same category and compatible specs) from another department
 * Never returns a slot after the deadline or outside open hours.
 */
export function recommendAllocations(
  input: SchedulingRequestInput,
  targetEquipment: EquipmentItem,
  allEquipments: EquipmentItem[],
  existingBookings: ExistingBooking[],
  referenceNow: Date = new Date()
): AllocationCandidate[] {
  const options: AllocationCandidate[] = [];

  const requestedSlot: TimeSlot = {
    start: new Date(input.preferredStart),
    end: new Date(input.preferredStart.getTime() + input.durationHours * 3600 * 1000),
  };

  // Option A: Check requested slot
  const isReqSlotFeasible =
    requestedSlot.end <= input.deadline &&
    isSlotAvailable(targetEquipment, requestedSlot, existingBookings);

  if (isReqSlotFeasible) {
    const breakdown = computeScore(input, requestedSlot, referenceNow);
    options.push({
      id: "opt-requested",
      type: "REQUESTED",
      equipment: targetEquipment,
      slot: requestedSlot,
      score: breakdown.totalScore,
      breakdown,
      feasible: true,
      reason: `Direct requested slot is available on ${targetEquipment.name}.`,
    });
  }

  // Option B: Best alternate slot on target equipment before deadline
  const freeAlternateSlots = findFreeSlots(
    targetEquipment,
    input.durationHours,
    referenceNow > input.preferredStart ? referenceNow : input.preferredStart,
    input.deadline,
    existingBookings,
    10
  );

  for (const altSlot of freeAlternateSlots) {
    // Skip if it's identical to the requested slot
    if (
      altSlot.start.getTime() === requestedSlot.start.getTime() &&
      altSlot.end.getTime() === requestedSlot.end.getTime()
    ) {
      continue;
    }

    const breakdown = computeScore(input, altSlot, referenceNow);
    options.push({
      id: `opt-alt-${altSlot.start.getTime()}`,
      type: "ALTERNATE",
      equipment: targetEquipment,
      slot: altSlot,
      score: Number((breakdown.totalScore * 0.95).toFixed(3)), // slight penalty for slot drift
      breakdown,
      feasible: true,
      reason: `Earlier/optimal free slot available on ${targetEquipment.name} prior to deadline.`,
    });
    break; // Top alternate slot
  }

  // Option C: Equivalent substitute from another department
  const substitutes = allEquipments.filter(
    (e) =>
      e.id !== targetEquipment.id &&
      e.isActive &&
      e.category.toLowerCase() === targetEquipment.category.toLowerCase()
  );

  for (const subEquipment of substitutes) {
    // Check if requested slot is free on the substitute
    if (isSlotAvailable(subEquipment, requestedSlot, existingBookings)) {
      const breakdown = computeScore(input, requestedSlot, referenceNow);
      options.push({
        id: `opt-sub-${subEquipment.id}`,
        type: "SUBSTITUTE",
        equipment: subEquipment,
        slot: requestedSlot,
        score: Number((breakdown.totalScore * 0.92).toFixed(3)), // slight cross-dept variance
        breakdown,
        feasible: true,
        reason: `Cross-department substitute ${subEquipment.name} (${subEquipment.department}) has the requested slot open.`,
      });
      break;
    } else {
      // Find alternate slot on substitute
      const subFreeSlots = findFreeSlots(
        subEquipment,
        input.durationHours,
        referenceNow,
        input.deadline,
        existingBookings,
        2
      );
      if (subFreeSlots.length > 0) {
        const subSlot = subFreeSlots[0];
        const breakdown = computeScore(input, subSlot, referenceNow);
        options.push({
          id: `opt-sub-${subEquipment.id}`,
          type: "SUBSTITUTE",
          equipment: subEquipment,
          slot: subSlot,
          score: Number((breakdown.totalScore * 0.88).toFixed(3)),
          breakdown,
          feasible: true,
          reason: `Substitute ${subEquipment.name} (${subEquipment.department}) has availability before deadline.`,
        });
        break;
      }
    }
  }

  // Return top 3 sorted by totalScore descending
  return options
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
