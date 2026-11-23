import { NextResponse } from "next/server";
import { getSession, Role, SessionPayload } from "./session";
import { prisma } from "../db";

export interface AuthContext {
  user: SessionPayload;
}

/**
 * Server-side role guard for API routes.
 * Enforces role check, verifies active session, and returns user payload.
 * Throws a response error or returns the user.
 */
export async function requireRole(
  allowedRoles: Role[]
): Promise<{ user: SessionPayload } | NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized: No active session. Please select a role on the landing page." },
      { status: 401 }
    );
  }

  // Admin has universal superuser access
  if (session.role === "ADMIN") {
    return { user: session };
  }

  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json(
      { error: `Forbidden: Role ${session.role} is not permitted to access this resource.` },
      { status: 403 }
    );
  }

  return { user: session };
}
