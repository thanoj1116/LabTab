import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
  const auth = await requireRole(["ADMIN"]);
  if ("status" in auth) return auth;

  try {
    // 1. Total counts
    const totalEquipment = await prisma.equipment.count({ where: { isActive: true } });
    const totalRequests = await prisma.request.count();
    const totalBookings = await prisma.booking.count({ where: { status: "CONFIRMED" } });
    const pendingCount = await prisma.request.count({ where: { status: "PENDING" } });

    // 2. Department-wise utilization analytics (Equipment count, active bookings)
    const departments = ["ECE", "CSE", "Mechanical", "EEE"];
    const deptStats = await Promise.all(
      departments.map(async (dept) => {
        const eqCount = await prisma.equipment.count({
          where: { department: dept, isActive: true },
        });

        const bookingsCount = await prisma.booking.count({
          where: {
            status: "CONFIRMED",
            equipment: { department: dept },
          },
        });

        const requestsCount = await prisma.request.count({
          where: {
            equipment: { department: dept },
          },
        });

        // Compute simulated utilization percentage based on booked hours
        const utilizationRate = eqCount > 0 ? Math.min(100, Math.round((bookingsCount / (eqCount * 2)) * 100)) : 0;

        return {
          department: dept,
          equipmentCount: eqCount,
          activeBookings: bookingsCount,
          totalRequests: requestsCount,
          utilizationRate: Math.max(15, utilizationRate), // visual baseline
        };
      })
    );

    // 3. Equipment with low or zero usage (Idle Equipment)
    const idleEquipments = await prisma.equipment.findMany({
      where: {
        isActive: true,
        bookings: {
          none: {
            status: "CONFIRMED",
          },
        },
      },
      select: {
        id: true,
        name: true,
        department: true,
        category: true,
        location: true,
      },
      take: 5,
    });

    // 4. Recent bookings list for audit
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        equipment: {
          select: { name: true, department: true },
        },
        request: {
          include: {
            student: { select: { name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({
      summary: {
        totalEquipment,
        totalRequests,
        totalBookings,
        pendingApprovals: pendingCount,
      },
      deptStats,
      idleEquipments,
      recentBookings,
    });
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to generate utilization analytics." },
      { status: 500 }
    );
  }
}
