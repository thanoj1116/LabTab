import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EquipmentFilterSchema } from "@/schemas";
import { requireRole } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department") || undefined;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;

    const validated = EquipmentFilterSchema.parse({ department, category, search });

    const where: any = {
      isActive: true,
    };

    if (validated.department && validated.department !== "ALL") {
      where.department = validated.department;
    }

    if (validated.category && validated.category !== "ALL") {
      where.category = validated.category;
    }

    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search } },
        { location: { contains: validated.search } },
        { specs: { contains: validated.search } },
      ];
    }

    const items = await prisma.equipment.findMany({
      where,
      orderBy: [{ department: "asc" }, { name: "asc" }],
      include: {
        bookings: {
          where: {
            status: "CONFIRMED",
            end: { gte: new Date() },
          },
          select: {
            id: true,
            start: true,
            end: true,
          },
        },
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Equipment fetch error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve equipment list." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Only Admin can add or edit equipment
  const auth = await requireRole(["ADMIN"]);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const item = await prisma.equipment.create({
      data: {
        name: body.name,
        department: body.department,
        category: body.category,
        specs: typeof body.specs === "object" ? JSON.stringify(body.specs) : body.specs,
        quantity: parseInt(body.quantity || "1", 10),
        location: body.location,
        openHoursStart: body.openHoursStart || "08:00",
        openHoursEnd: body.openHoursEnd || "20:00",
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Equipment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create equipment." },
      { status: 500 }
    );
  }
}
