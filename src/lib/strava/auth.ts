import { prisma } from "@/lib/db";
import { STRAVA_TOKEN_URL, TOKEN_REFRESH_MARGIN_SECONDS } from "./config";
import {
  AuthenticationError,
  NetworkError,
  RateLimitError,
  StravaApiError,
  UnknownError,
} from "./errors";
import type { StravaTokenResponse } from "./types";

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new UnknownError("Strava client credentials are not configured.");
  }
  return { clientId, clientSecret };
}

async function postTokenRequest(
  params: Record<string, string>
): Promise<StravaTokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    ...params,
  });

  let response: Response;
  try {
    response = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
  } catch (cause) {
    throw new NetworkError(
      cause instanceof Error ? cause.message : "token endpoint unreachable"
    );
  }

  if (response.status === 429) {
    throw new RateLimitError("token endpoint returned 429");
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    // A revoked/expired refresh token surfaces as an invalid_grant error.
    // Treat it as an authentication failure so the session can be revoked.
    if (isInvalidGrant(detail)) {
      throw new AuthenticationError("refresh token rejected (invalid_grant)");
    }
    throw new StravaApiError(
      `Strava token endpoint error (${response.status})`,
      response.status,
      detail
    );
  }
  return (await response.json()) as StravaTokenResponse;
}

/** Detect an invalid_grant (revoked/expired refresh token) error body. */
function isInvalidGrant(body: string): boolean {
  try {
    const parsed = JSON.parse(body) as {
      message?: string;
      errors?: Array<{ resource?: string; field?: string; code?: string }>;
    };
    if (typeof parsed.message === "string" && /invalid/i.test(parsed.message)) {
      return true;
    }
    return (
      Array.isArray(parsed.errors) &&
      parsed.errors.some(
        (e) => e?.resource === "RefreshToken" && e?.code === "invalid"
      )
    );
  } catch {
    return false;
  }
}

/** Exchange an authorization code for tokens (server-side only). */
export async function exchangeCodeForToken(
  code: string
): Promise<StravaTokenResponse> {
  return postTokenRequest({
    code,
    grant_type: "authorization_code",
    redirect_uri:
      process.env.STRAVA_REDIRECT_URI ??
      "http://localhost:3000/api/auth/strava/callback",
  });
}

/** Refresh an access token using a refresh token. */
export async function refreshAccessToken(
  refreshToken: string
): Promise<StravaTokenResponse> {
  return postTokenRequest({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

/** The subset of account fields needed for token management. */
export interface TokenAccount {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface ValidTokenResult {
  accessToken: string;
  account: TokenAccount;
}

function isTokenValid(account: TokenAccount): boolean {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = Math.floor(account.expiresAt.getTime() / 1000);
  return expiresAtSeconds - nowSeconds > TOKEN_REFRESH_MARGIN_SECONDS;
}

/**
 * In-process single-flight map keyed by account id. Concurrent callers for the
 * same account share one refresh instead of issuing duplicate token requests.
 */
const refreshInFlight = new Map<string, Promise<ValidTokenResult>>();

/**
 * Return a valid access token for the given account, refreshing it when it is
 * expired or about to expire (within ~5 minutes).
 *
 * Concurrency safety:
 * - In-process: single-flight per account id. Inside the lock we re-read the
 *   account from the database and recheck near-expiry, so a caller that raced
 *   in with a stale account still uses the freshest stored credentials.
 * - Multi-process: a conditional DB update (matching the current refresh token)
 *   prevents a stale refresh response from overwriting newer credentials. If
 *   the update matches no row, we reread and fall back to the freshest stored
 *   values. This also covers the case where two processes receive the same
 *   token response: the second update matches nothing and rereads.
 *
 * Every refresh response is persisted, including the newest refresh token.
 */
export async function getValidAccessToken(
  account: TokenAccount
): Promise<ValidTokenResult> {
  if (isTokenValid(account)) {
    return { accessToken: account.accessToken, account };
  }

  const existing = refreshInFlight.get(account.id);
  if (existing) {
    return existing;
  }

  const promise = doRefresh(account).finally(() => {
    refreshInFlight.delete(account.id);
  });
  refreshInFlight.set(account.id, promise);
  return promise;
}

async function doRefresh(account: TokenAccount): Promise<ValidTokenResult> {
  // Re-read inside the lock: a concurrent refresh may already have produced
  // valid credentials, or the account may have changed.
  const fresh = await prisma.stravaAccount.findUnique({
    where: { id: account.id },
  });
  if (!fresh) {
    throw new AuthenticationError("account no longer exists");
  }
  if (isTokenValid(fresh)) {
    return { accessToken: fresh.accessToken, account: fresh };
  }

  const refreshed = await refreshAccessToken(fresh.refreshToken);

  // Conditional update: only succeed if the refresh token still matches the
  // one we used, so a stale response can never overwrite newer credentials.
  const result = await prisma.stravaAccount.updateMany({
    where: { id: account.id, refreshToken: fresh.refreshToken },
    data: {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: new Date(refreshed.expires_at * 1000),
    },
  });

  if (result.count === 0) {
    // Another process already replaced the credentials. Reread and use the
    // freshest stored values instead of overwriting them.
    const latest = await prisma.stravaAccount.findUnique({
      where: { id: account.id },
    });
    if (!latest) {
      throw new AuthenticationError("account no longer exists");
    }
    return { accessToken: latest.accessToken, account: latest };
  }

  return {
    accessToken: refreshed.access_token,
    account: {
      ...fresh,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: new Date(refreshed.expires_at * 1000),
    },
  };
}