import { NextRequest, NextResponse } from "next/server";
import { NaturalLanguageRequestSchema } from "@/schemas";
import { parseRequest } from "@/lib/ai";
import { requireRole } from "@/lib/auth/rbac";

export async function POST(req: NextRequest) {
  const auth = await requireRole(["STUDENT", "FACULTY", "ADMIN"]);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const validated = NaturalLanguageRequestSchema.parse(body);

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const parsed = await parseRequest(validated.text, clientIp);

    return NextResponse.json({ parsed });
  } catch (error) {
    console.error("AI Parse route error:", error);
    return NextResponse.json(
      { error: "Failed to parse natural language request. Please use format with 10-500 characters." },
      { status: 400 }
    );
  }
}
