import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const OAUTH_STATE_COOKIE_NAME = "oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Create a random temporary state value and store it in an HttpOnly cookie. */
export async function createOAuthState(): Promise<string> {
  const state = randomBytes(32).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(STATE_TTL_MS / 1000),
  });
  return state;
}

/**
 * Validate the returned `state` against the stored cookie using a timing-safe
 * comparison. This does NOT delete the cookie, so an invalid callback cannot
 * erase a valid in-progress state. Call `clearOAuthState()` only after a
 * successful match.
 */
export async function validateOAuthState(
  state: string | null
): Promise<boolean> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
  if (!state || !stored) return false;

  const a = Buffer.from(state);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Delete the OAuth state cookie (single-use consumption). */
export async function clearOAuthState(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
}