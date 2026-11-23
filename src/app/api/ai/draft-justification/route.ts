import { NextRequest, NextResponse } from "next/server";
import { DraftJustificationSchema } from "@/schemas";
import { draftJustification } from "@/lib/ai";
import { requireRole } from "@/lib/auth/rbac";

export async function POST(req: NextRequest) {
  const auth = await requireRole(["STUDENT", "FACULTY", "ADMIN"]);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const validated = DraftJustificationSchema.parse(body);

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const justification = await draftJustification(
      validated.projectTitle,
      validated.projectDescription,
      validated.equipmentName,
      clientIp
    );

    return NextResponse.json({ justification });
  } catch (error) {
    console.error("AI Justification route error:", error);
    return NextResponse.json(
      { error: "Failed to generate justification." },
      { status: 400 }
    );
  }
}
