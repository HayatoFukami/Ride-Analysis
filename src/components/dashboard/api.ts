/**
 * Shared client-side helpers for reading and classifying API error responses.
 *
 * All dashboard/analytics fetches go through internal routes that return
 * `{ error: { code, message } }` on failure. These helpers keep the mapping to
 * a single place so every surface (overview, gears, gear-distance) presents
 * consistent, safe messages without `alert()` and without exposing tokens.
 */

export type ApiErrorKind =
  | "auth"
  | "rate_limit"
  | "network"
  | "validation"
  | "upstream"
  | "unknown";

export interface ApiErrorInfo {
  kind: ApiErrorKind;
  message: string;
  code: string | null;
  status: number | null;
}

/** Read a `{ error: { code, message } }` body (when present) and classify it. */
export async function readApiError(
  res: Response,
  fallback: string
): Promise<ApiErrorInfo> {
  let code: string | null = null;
  let message = fallback;
  try {
    const data = await res.json();
    if (data?.error?.code) code = String(data.error.code);
    if (data?.error?.message) message = String(data.error.message);
  } catch {
    // Non-JSON body — keep the fallback message.
  }

  const status = res.status;
  let kind: ApiErrorKind;
  if (status === 401 || code === "AUTHENTICATION") kind = "auth";
  else if (status === 429 || code === "RATE_LIMIT") kind = "rate_limit";
  else if (code === "NETWORK") kind = "network";
  else if (code === "VALIDATION" || status === 400) kind = "validation";
  else if (code === "STRAVA_API" || status >= 500) kind = "upstream";
  else kind = "unknown";

  return { kind, message, code, status };
}
