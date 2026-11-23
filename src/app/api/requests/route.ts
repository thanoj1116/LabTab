import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { CreateRequestSchema } from "@/schemas";

export async function GET(req: NextRequest) {
  const auth = await requireRole(["STUDENT", "FACULTY", "ADMIN"]);
  if ("status" in auth) return auth;

  try {
    const { user } = auth;
    let where: any = {};

    // IDOR Defense: Enforce server-side data scoping by user and department
    if (user.role === "STUDENT") {
      where.studentId = user.userId;
    } else if (user.role === "FACULTY") {
      if (user.department) {
        where.equipment = {
          department: user.department,
        };
      }
    }
    // Admin has global visibility

    const requests = await prisma.request.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: { id: true, name: true, email: true, department: true },
        },
        equipment: {
          select: { id: true, name: true, department: true, category: true, location: true },
        },
        booking: {
          select: { id: true, start: true, end: true, status: true },
        },
        approvals: {
          include: {
            faculty: {
              select: { id: true, name: true },
            },
          },
          orderBy: { decidedAt: "desc" },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Fetch requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource access requests." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["STUDENT", "ADMIN"]);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const validated = CreateRequestSchema.parse(body);

    const created = await prisma.request.create({
      data: {
        studentId: auth.user.userId,
        equipmentId: validated.equipmentId,
        projectTitle: validated.projectTitle,
        projectDescription: validated.projectDescription,
        justification: validated.justification,
        deadline: new Date(validated.deadline),
        durationHours: validated.durationHours,
        preferredStart: new Date(validated.preferredStart),
        priorityScore: validated.priorityScore,
        status: "PENDING",
      },
      include: {
        equipment: true,
      },
    });

    return NextResponse.json({ request: created });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json(
      { error: "Failed to create resource request. Please verify inputs." },
      { status: 400 }
    );
  }
}
