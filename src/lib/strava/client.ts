import { STRAVA_API_BASE_URL } from "./config";
import {
  AuthenticationError,
  NetworkError,
  RateLimitError,
  StravaApiError,
} from "./errors";

export interface StravaRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  accessToken: string;
}

/**
 * Shared HTTP client for every Strava resource request.
 *
 * Never include the access token in thrown errors or logs; it is only ever
 * attached to the Authorization header.
 */
export async function stravaFetch<T>(
  path: string,
  options: StravaRequestOptions
): Promise<T> {
  const url = new URL(`${STRAVA_API_BASE_URL}${path}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
  } catch (cause) {
    throw new NetworkError(
      cause instanceof Error ? cause.message : "Strava API unreachable"
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError(`Strava returned ${response.status} for ${path}`);
  }
  if (response.status === 429) {
    throw new RateLimitError(`Strava returned 429 for ${path}`);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new StravaApiError(
      `Strava API error (${response.status})`,
      response.status,
      detail
    );
  }

  return (await response.json()) as T;
}