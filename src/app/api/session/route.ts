import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SessionLoginSchema } from "@/schemas";
import { setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ user: session });
}

export async function POST(req: NextRequest) {
  // Enforce demo mode guard
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json(
      { error: "Demo session switcher is disabled in non-demo mode." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = SessionLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid role specified.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { role } = parsed.data;

    // Find seeded demo user for this role
    let demoUser = null;
    if (role === "STUDENT") {
      // Primary demo student: Alex Chen (ECE)
      demoUser = await prisma.user.findFirst({
        where: { role: "STUDENT", email: "alex.chen@campus.edu" },
      });
      if (!demoUser) {
        demoUser = await prisma.user.findFirst({ where: { role: "STUDENT" } });
      }
    } else if (role === "FACULTY") {
      // Primary demo faculty: Prof. David Miller (ECE)
      demoUser = await prisma.user.findFirst({
        where: { role: "FACULTY", department: "ECE" },
      });
      if (!demoUser) {
        demoUser = await prisma.user.findFirst({ where: { role: "FACULTY" } });
      }
    } else if (role === "ADMIN") {
      demoUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });
    }

    if (!demoUser) {
      return NextResponse.json(
        { error: `No seeded user found for role: ${role}. Run database seed first.` },
        { status: 500 }
      );
    }

    // Set signed httpOnly JWT cookie
    await setSessionCookie({
      userId: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role as "STUDENT" | "FACULTY" | "ADMIN",
      department: demoUser.department,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        department: demoUser.department,
      },
    });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while establishing session." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
