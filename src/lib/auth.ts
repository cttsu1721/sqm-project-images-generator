import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "auth_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Rate limiting store (in-memory, resets on restart)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Create HMAC-signed session token
function createSessionToken(secret: string): string {
  const payload = {
    authenticated: true,
    createdAt: Date.now(),
    expiresAt: Date.now() + COOKIE_MAX_AGE * 1000,
  };
  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString("base64");

  // Create HMAC signature
  const signature = createHmac("sha256", secret)
    .update(payloadBase64)
    .digest("hex");

  return `${payloadBase64}.${signature}`;
}

// Verify HMAC-signed session token
function verifySessionToken(token: string, secret: string): boolean {
  try {
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) return false;

    // Verify signature
    const expectedSignature = createHmac("sha256", secret)
      .update(payloadBase64)
      .digest("hex");

    // Timing-safe comparison of signatures
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (sigBuffer.length !== expectedBuffer.length) return false;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return false;

    // Verify payload hasn't expired
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());
    if (Date.now() > payload.expiresAt) return false;

    return payload.authenticated === true;
  } catch {
    return false;
  }
}

// Timing-safe password comparison
export function verifyPassword(password: string): boolean {
  const correctPassword = process.env.AUTH_PASSWORD;
  if (!correctPassword) {
    console.error("AUTH_PASSWORD not set in environment");
    return false;
  }

  // Pad to same length for timing-safe comparison
  const maxLen = Math.max(password.length, correctPassword.length);
  const paddedInput = password.padEnd(maxLen, "\0");
  const paddedCorrect = correctPassword.padEnd(maxLen, "\0");

  const inputBuffer = Buffer.from(paddedInput);
  const correctBuffer = Buffer.from(paddedCorrect);

  return timingSafeEqual(inputBuffer, correctBuffer) &&
         password.length === correctPassword.length;
}

// Check rate limiting
export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; lockoutRemaining?: number } {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (!attempts) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    const lockoutRemaining = Math.ceil((LOCKOUT_DURATION - (now - attempts.lastAttempt)) / 1000);
    return { allowed: false, remainingAttempts: 0, lockoutRemaining };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - attempts.count };
}

// Record failed login attempt
export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    loginAttempts.set(ip, { count: attempts.count + 1, lastAttempt: now });
  }
}

// Clear failed attempts on successful login
export function clearFailedAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

// Create session cookie
export async function createSession(): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET not set in environment");
  }

  const token = createSessionToken(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

// Check if user has valid session
export async function hasValidSession(): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);

  if (!session?.value) return false;

  return verifySessionToken(session.value, secret);
}

// Clear session cookie
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
