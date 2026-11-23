import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.equipment.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: "CONFIRMED",
            end: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
          },
          orderBy: { start: "asc" },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Equipment not found." }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Equipment detail error:", error);
    return NextResponse.json({ error: "Failed to load equipment." }, { status: 500 });
  }
}
