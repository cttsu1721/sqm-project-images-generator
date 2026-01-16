import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  createSession,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
} from "@/lib/auth";

// Get client IP from request headers
function getClientIP(request: NextRequest): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to a default (shouldn't happen in production)
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    // Check rate limiting
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Try again in ${Math.ceil(rateLimit.lockoutRemaining! / 60)} minutes.`,
          lockoutRemaining: rateLimit.lockoutRemaining,
        },
        { status: 429 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (!verifyPassword(password)) {
      // Record failed attempt
      recordFailedAttempt(ip);
      const remaining = rateLimit.remainingAttempts - 1;

      return NextResponse.json(
        {
          error: remaining > 0
            ? `Invalid password. ${remaining} attempts remaining.`
            : "Invalid password. Account locked for 15 minutes.",
          remainingAttempts: remaining,
        },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(ip);

    await createSession();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
