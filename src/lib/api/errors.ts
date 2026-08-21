import { NextResponse } from "next/server";
import { StravaError, AuthenticationError } from "@/lib/strava/errors";
import { revokeCurrentSession } from "@/lib/auth/session";
import type { ApiErrorResponse } from "@/types/api";

/** 401 response for missing/invalid sessions. */
export function unauthorized(): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code: "AUTHENTICATION",
        message: "Stravaとの接続が切れています。再接続してください。",
      },
    },
    { status: 401 }
  );
}

/**
 * Convert any thrown error into a safe Japanese `{ error: { code, message } }`
 * response. Technical detail is logged server-side only and never includes
 * tokens or secrets.
 */
export function handleApiError(
  err: unknown
): NextResponse<ApiErrorResponse> {
  if (err instanceof StravaError) {
    if (err.detail) {
      console.error(`[${err.code}]`, err.detail);
    }
    const status = err.status ?? 500;
    return NextResponse.json(err.toJSON(), { status });
  }
  console.error("Unexpected API error", err);
  return NextResponse.json(
    { error: { code: "UNKNOWN", message: "予期しないエラーが発生しました。" } },
    { status: 500 }
  );
}

/**
 * Handle an error thrown inside a session-protected route.
 *
 * On an AuthenticationError the database session is revoked and the cookie
 * cleared before returning a safe 401, preventing a `/` <-> `/login` loop.
 * If revoking the session itself fails (a real database error), that error is
 * surfaced rather than silently accepted. All other errors are formatted
 * safely.
 */
export async function handleAuthenticatedApiError(
  err: unknown
): Promise<NextResponse<ApiErrorResponse>> {
  if (err instanceof AuthenticationError) {
    try {
      await revokeCurrentSession();
    } catch (revokeErr) {
      console.error("Failed to revoke session after authentication error", revokeErr);
      return handleApiError(revokeErr);
    }
    return unauthorized();
  }
  return handleApiError(err);
}

/** 400 response for validation failures. */
export function validationError(message: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { error: { code: "VALIDATION", message } },
    { status: 400 }
  );
}