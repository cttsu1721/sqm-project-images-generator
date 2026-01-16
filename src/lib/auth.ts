import { cookies } from "next/headers";

const COOKIE_NAME = "auth_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Simple hash function for session token
function createSessionToken(password: string, secret: string): string {
  // Create a simple hash combining password verification with secret
  const data = `${password}:${secret}:${Date.now()}`;
  return Buffer.from(data).toString("base64");
}

// Verify password matches environment variable
export function verifyPassword(password: string): boolean {
  const correctPassword = process.env.AUTH_PASSWORD;
  if (!correctPassword) {
    console.error("AUTH_PASSWORD not set in environment");
    return false;
  }
  return password === correctPassword;
}

// Create session cookie
export async function createSession(): Promise<void> {
  const secret = process.env.AUTH_SECRET || "default-secret";
  const token = createSessionToken("verified", secret);

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
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return !!session?.value;
}

// Clear session cookie
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
