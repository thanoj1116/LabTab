import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "lablink_session";

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || "fallback_dev_session_secret_32_characters_long_min";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /student, /faculty, and /admin routes
  const isStudentRoute = pathname.startsWith("/student");
  const isFacultyRoute = pathname.startsWith("/faculty");
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isStudentRoute && !isFacultyRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    const role = (payload as any).role as string;

    // Admin has universal access
    if (role === "ADMIN") {
      return NextResponse.next();
    }

    if (isStudentRoute && role !== "STUDENT") {
      const url = request.nextUrl.clone();
      url.pathname = role === "FACULTY" ? "/faculty/approvals" : "/";
      return NextResponse.redirect(url);
    }

    if (isFacultyRoute && role !== "FACULTY") {
      const url = request.nextUrl.clone();
      url.pathname = role === "STUDENT" ? "/student/discover" : "/";
      return NextResponse.redirect(url);
    }

    if (isAdminRoute && role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    // Invalid or expired token: clear cookie and redirect to landing
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const response = NextResponse.redirect(url);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    "/student/:path*",
    "/faculty/:path*",
    "/admin/:path*",
  ],
};
