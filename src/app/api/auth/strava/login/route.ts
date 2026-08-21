import { NextResponse } from "next/server";
import { createOAuthState } from "@/lib/auth/oauth-state";
import { STRAVA_AUTHORIZE_URL, STRAVA_SCOPES } from "@/lib/strava/config";

export const dynamic = "force-dynamic";

/**
 * Start the Strava OAuth flow: create a CSRF state value, then redirect to the
 * official Strava authorize URL with the exact requested scope.
 */
export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      {
        error: {
          code: "UNKNOWN",
          message: "Stravaクライアント設定がありません。",
        },
      },
      { status: 500 }
    );
  }

  const state = await createOAuthState();
  const redirectUri =
    process.env.STRAVA_REDIRECT_URI ??
    "http://localhost:3000/api/auth/strava/callback";

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: STRAVA_SCOPES,
    state,
    approval_prompt: "auto",
  });

  return NextResponse.redirect(`${STRAVA_AUTHORIZE_URL}?${params.toString()}`);
}