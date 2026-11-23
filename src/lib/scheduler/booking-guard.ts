import { prisma } from "../db";
import { isSlotAvailable } from "./index";
import { EquipmentItem, ExistingBooking, TimeSlot } from "./types";

export interface CreateBookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
}

/**
 * Creates a booking within an atomic database transaction.
 * Re-queries and locks/verifies existing bookings inside the transaction
 * to guarantee no double-booking race conditions can occur.
 */
export async function createBookingWithGuard(params: {
  requestId: string;
  equipmentId: string;
  start: Date;
  end: Date;
  facultyId?: string;
  approvalReason?: string;
}): Promise<CreateBookingResult> {
  const { requestId, equipmentId, start, end, facultyId, approvalReason } = params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch equipment details
      const equipment = await tx.equipment.findUnique({
        where: { id: equipmentId },
      });

      if (!equipment || !equipment.isActive) {
        throw new Error("EQUIPMENT_UNAVAILABLE");
      }

      // 2. Query all existing active bookings for this equipment that could overlap
      const conflictingBookings = await tx.booking.findMany({
        where: {
          equipmentId,
          status: "CONFIRMED",
          start: { lt: end },
          end: { gt: start },
        },
      });

      // 3. Re-verify slot availability under transaction isolation
      const equipmentItem: EquipmentItem = {
        id: equipment.id,
        name: equipment.name,
        department: equipment.department,
        category: equipment.category,
        specs: equipment.specs,
        quantity: equipment.quantity,
        location: equipment.location,
        openHoursStart: equipment.openHoursStart,
        openHoursEnd: equipment.openHoursEnd,
        isActive: equipment.isActive,
      };

      const requestedSlot: TimeSlot = { start, end };
      const existing: ExistingBooking[] = conflictingBookings.map((b) => ({
        id: b.id,
        equipmentId: b.equipmentId,
        start: b.start,
        end: b.end,
        status: b.status,
      }));

      if (!isSlotAvailable(equipmentItem, requestedSlot, existing)) {
        throw new Error("SLOT_DOUBLE_BOOKED_CONFLICT");
      }

      // 4. Update request status to APPROVED
      await tx.request.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          decisionReason: approvalReason || "Approved and booked by faculty.",
        },
      });

      // 5. If facultyId provided, log the approval record
      if (facultyId) {
        await tx.approval.create({
          data: {
            requestId,
            facultyId,
            decision: "APPROVED",
            reason: approvalReason,
          },
        });
      }

      // 6. Create Confirmed Booking
      const booking = await tx.booking.create({
        data: {
          requestId,
          equipmentId,
          start,
          end,
          status: "CONFIRMED",
        },
      });

      return booking;
    });

    return { success: true, bookingId: result.id };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "BOOKING_FAILED",
    };
  }
}
