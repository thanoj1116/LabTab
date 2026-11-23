import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { FacultyDecisionSchema } from "@/schemas";
import { createBookingWithGuard } from "@/lib/scheduler/booking-guard";

export async function GET(req: NextRequest) {
  const auth = await requireRole(["FACULTY", "ADMIN"]);
  if ("status" in auth) return auth;

  try {
    const { user } = auth;
    const where: any = {
      status: "PENDING",
    };

    // Scoped strictly to faculty's department
    if (user.role === "FACULTY" && user.department) {
      where.equipment = {
        department: user.department,
      };
    }

    const pendingRequests = await prisma.request.findMany({
      where,
      orderBy: [{ priorityScore: "desc" }, { deadline: "asc" }],
      include: {
        student: {
          select: { id: true, name: true, email: true, department: true },
        },
        equipment: {
          select: { id: true, name: true, department: true, category: true, location: true },
        },
      },
    });

    return NextResponse.json({ requests: pendingRequests });
  } catch (error) {
    console.error("Faculty approvals fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending approval requests." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["FACULTY", "ADMIN"]);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const { requestId, decision, reason } = FacultyDecisionSchema.parse(body);

    // Look up the request
    const existingReq = await prisma.request.findUnique({
      where: { id: requestId },
      include: { equipment: true },
    });

    if (!existingReq) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    // Verify department authorization (prevent cross-department tampering)
    if (
      auth.user.role === "FACULTY" &&
      auth.user.department &&
      existingReq.equipment.department !== auth.user.department
    ) {
      return NextResponse.json(
        { error: "Forbidden: You may only decide requests for your own department." },
        { status: 403 }
      );
    }

    if (decision === "REJECTED") {
      // Record rejection
      await prisma.$transaction([
        prisma.request.update({
          where: { id: requestId },
          data: {
            status: "REJECTED",
            decisionReason: reason || "Declined by faculty reviewer.",
          },
        }),
        prisma.approval.create({
          data: {
            requestId,
            facultyId: auth.user.userId,
            decision: "REJECTED",
            reason,
          },
        }),
      ]);

      return NextResponse.json({ success: true, decision: "REJECTED" });
    }

    // APPROVAL FLOW: Runs in atomic transaction guarded against double-booking
    const bookingEnd = new Date(
      existingReq.preferredStart.getTime() + existingReq.durationHours * 3600 * 1000
    );

    const bookingResult = await createBookingWithGuard({
      requestId: existingReq.id,
      equipmentId: existingReq.equipmentId,
      start: existingReq.preferredStart,
      end: bookingEnd,
      facultyId: auth.user.userId,
      approvalReason: reason || "Approved by faculty after project feasibility review.",
    });

    if (!bookingResult.success) {
      return NextResponse.json(
        {
          error:
            bookingResult.error === "SLOT_DOUBLE_BOOKED_CONFLICT"
              ? "Cannot approve: Another booking was confirmed for this equipment and slot concurrently."
              : "Approval failed during booking creation.",
          code: bookingResult.error,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      decision: "APPROVED",
      bookingId: bookingResult.bookingId,
    });
  } catch (error) {
    console.error("Faculty decision error:", error);
    return NextResponse.json(
      { error: "Failed to process approval decision." },
      { status: 500 }
    );
  }
}
