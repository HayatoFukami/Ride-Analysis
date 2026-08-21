import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { validateOAuthState, clearOAuthState } from "@/lib/auth/oauth-state";
import { prisma } from "@/lib/db";
import { exchangeCodeForToken } from "@/lib/strava/auth";
import { STRAVA_SCOPES } from "@/lib/strava/config";

export const dynamic = "force-dynamic";

function redirectToLogin(request: NextRequest, reason: string) {
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(reason)}`, request.url)
  );
}

/** Verify the granted scope includes every required scope. */
function hasRequiredScopes(grantedScope: string | null): boolean {
  const required = STRAVA_SCOPES.split(",");
  const granted = (grantedScope ?? "")
    .split(/[\s,]+/)
    .filter(Boolean);
  return required.every((s) => granted.includes(s));
}

/**
 * OAuth callback: validate state first (for both approval and denial), then
 * exchange the code server-side, verify the granted scope, upsert the Strava
 * account, create a session and redirect to `/`.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const callbackScope = searchParams.get("scope");

  // Validate state before anything else, for both approval and denial. The
  // cookie is only consumed after a constant-time match, so an invalid
  // callback cannot erase a valid in-progress state.
  const stateValid = await validateOAuthState(state);
  if (!stateValid) {
    return redirectToLogin(request, "state");
  }
  await clearOAuthState();

  // User denied authorization.
  if (error) {
    return redirectToLogin(request, "denied");
  }

  if (!code) {
    return redirectToLogin(request, "missing_code");
  }

  let token;
  try {
    token = await exchangeCodeForToken(code);
  } catch (err) {
    console.error("OAuth token exchange failed", err);
    return redirectToLogin(request, "token");
  }

  if (!token.athlete) {
    return redirectToLogin(request, "no_athlete");
  }

  // Verify the actual granted scope. Prefer the token response scope when
  // supplied; otherwise fall back to the callback scope.
  const grantedScope = token.scope || callbackScope;
  if (!hasRequiredScopes(grantedScope)) {
    return redirectToLogin(request, "scope");
  }

  // Upsert the Strava account keyed by the unique athlete id. The id is stored
  // as a String to accommodate Long values safely.
  const athleteId = String(token.athlete.id);
  const account = await prisma.stravaAccount.upsert({
    where: { athleteId },
    update: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(token.expires_at * 1000),
      scopes: token.scope,
    },
    create: {
      athleteId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(token.expires_at * 1000),
      scopes: token.scope,
    },
  });

  await createSession(account.id);

  return NextResponse.redirect(new URL("/", request.url));
}
