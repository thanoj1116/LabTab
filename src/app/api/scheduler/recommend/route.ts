import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { recommendAllocations } from "@/lib/scheduler";
import { EquipmentItem, ExistingBooking, SchedulingRequestInput } from "@/lib/scheduler/types";
import { explainAllocation } from "@/lib/ai";
import { AllocationOption } from "@/schemas";

export async function POST(req: NextRequest) {
  const auth = await requireRole(["STUDENT", "FACULTY", "ADMIN"]);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const {
      equipmentId,
      durationHours,
      deadline,
      preferredStart,
      urgency,
      isCoreRequirement,
    } = body;

    if (!equipmentId || !durationHours || !deadline || !preferredStart) {
      return NextResponse.json(
        { error: "Missing required scheduling parameters." },
        { status: 400 }
      );
    }

    // 1. Fetch targeted equipment and all available items for substitutes
    const targetEq = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!targetEq) {
      return NextResponse.json({ error: "Target equipment not found." }, { status: 404 });
    }

    const allEqs = await prisma.equipment.findMany({
      where: { isActive: true },
    });

    // 2. Fetch active bookings in time range
    const searchStart = new Date(preferredStart);
    const deadlineDate = new Date(deadline);

    const rawBookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        end: { gte: new Date() },
        start: { lte: deadlineDate },
      },
    });

    const existingBookings: ExistingBooking[] = rawBookings.map((b) => ({
      id: b.id,
      equipmentId: b.equipmentId,
      start: b.start,
      end: b.end,
      status: b.status,
    }));

    // 3. Count student's recent bookings for fairness factor
    const recentBookingCount = await prisma.booking.count({
      where: {
        status: "CONFIRMED",
        request: {
          studentId: auth.user.userId,
        },
      },
    });

    // 4. Run deterministic allocation engine
    const targetItem: EquipmentItem = {
      id: targetEq.id,
      name: targetEq.name,
      department: targetEq.department,
      category: targetEq.category,
      specs: targetEq.specs,
      quantity: targetEq.quantity,
      location: targetEq.location,
      openHoursStart: targetEq.openHoursStart,
      openHoursEnd: targetEq.openHoursEnd,
      isActive: targetEq.isActive,
    };

    const allItems: EquipmentItem[] = allEqs.map((e) => ({
      id: e.id,
      name: e.name,
      department: e.department,
      category: e.category,
      specs: e.specs,
      quantity: e.quantity,
      location: e.location,
      openHoursStart: e.openHoursStart,
      openHoursEnd: e.openHoursEnd,
      isActive: e.isActive,
    }));

    const input: SchedulingRequestInput = {
      equipmentId: targetEq.id,
      durationHours: Number(durationHours),
      deadline: deadlineDate,
      preferredStart: searchStart,
      studentId: auth.user.userId,
      studentRecentBookingCount: recentBookingCount,
      urgencyLevel: urgency || "MEDIUM",
      isCoreRequirement: Boolean(isCoreRequirement),
    };

    const deterministicCandidates = recommendAllocations(
      input,
      targetItem,
      allItems,
      existingBookings,
      new Date()
    );

    // 5. Enhance each candidate with Gemini explanation (or fallback) in parallel
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const optionsWithExplanations: AllocationOption[] = await Promise.all(
      deterministicCandidates.map(async (c) => {
        const option: AllocationOption = {
          id: c.id,
          type: c.type,
          equipmentId: c.equipment.id,
          equipmentName: c.equipment.name,
          department: c.equipment.department,
          slotStart: c.slot.start.toISOString(),
          slotEnd: c.slot.end.toISOString(),
          score: c.score,
          breakdown: {
            deadlineUrgency: c.breakdown.deadlineUrgency,
            fairness: c.breakdown.fairness,
            projectNeed: c.breakdown.projectNeed,
          },
        };

        const explanation = await explainAllocation(option, auth.user.name, clientIp);
        return {
          ...option,
          explanation,
        };
      })
    );

    return NextResponse.json({
      options: optionsWithExplanations,
      conflictDetected:
        optionsWithExplanations.length > 0 &&
        optionsWithExplanations[0].type !== "REQUESTED",
    });
  } catch (error) {
    console.error("Scheduler recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to compute scheduling recommendations." },
      { status: 500 }
    );
  }
}
