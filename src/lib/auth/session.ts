import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionAccount {
  id: string;
  athleteId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string;
}

export interface CurrentSession {
  id: string;
  expiresAt: Date;
  account: SessionAccount;
  /** Athlete profile is fetched from Strava via /api/me, not stored locally. */
  athlete: null;
}

function generateSessionId(): string {
  return randomBytes(32).toString("base64url");
}

function toCurrentSession(session: {
  id: string;
  expiresAt: Date;
  account: {
    id: string;
    athleteId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    scopes: string;
  };
}): CurrentSession {
  return {
    id: session.id,
    expiresAt: session.expiresAt,
    account: {
      id: session.account.id,
      athleteId: session.account.athleteId,
      accessToken: session.account.accessToken,
      refreshToken: session.account.refreshToken,
      expiresAt: session.account.expiresAt,
      scopes: session.account.scopes,
    },
    athlete: null,
  };
}

/** Create a database session and set the opaque session cookie. */
export async function createSession(
  accountId: string
): Promise<CurrentSession> {
  const id = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const session = await prisma.session.create({
    data: { id, stravaAccountId: accountId, expiresAt },
    include: { account: true },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return toCurrentSession(session);
}

/** Resolve the current session from the cookie, or null when absent/expired. */
export async function getCurrentSession(): Promise<CurrentSession | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { account: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    // Best-effort cleanup of an expired session.
    await prisma.session
      .deleteMany({ where: { id: session.id } })
      .catch(() => undefined);
    return null;
  }

  return toCurrentSession(session);
}

/**
 * Delete the current database session and clear the cookie.
 *
 * Uses deleteMany so an already-absent session is not an error, but real
 * database failures propagate (they are not silently swallowed). The cookie is
 * only cleared after the database invalidation has been confirmed.
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Revoke the current session (database + cookie) after an authentication
 * failure. Database errors propagate so they are not silently accepted.
 */
export async function revokeCurrentSession(): Promise<void> {
  await deleteSession();
}