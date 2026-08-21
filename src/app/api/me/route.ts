import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getValidAccessToken } from "@/lib/strava/auth";
import { getAthlete } from "@/lib/strava/athlete";
import { handleAuthenticatedApiError, unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * Expose the authenticated athlete profile.
 * Response shape: `{ athlete: { id, displayName, profile } }`.
 */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { accessToken } = await getValidAccessToken(session.account);
    const athlete = await getAthlete(accessToken);

    const displayName =
      [athlete.firstname, athlete.lastname].filter(Boolean).join(" ").trim() ||
      athlete.username ||
      "Athlete";

    return NextResponse.json({
      athlete: {
        id: String(athlete.id),
        displayName,
        profile: athlete.profile,
      },
    });
  } catch (err) {
    return handleAuthenticatedApiError(err);
  }
}