import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getValidAccessToken } from "@/lib/strava/auth";
import { getGears } from "@/lib/strava/gear";
import { handleAuthenticatedApiError, unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * List the authenticated athlete's gear (bikes and shoes).
 * Response shape: `{ gears: [{ id, name, type }] }`.
 */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { accessToken } = await getValidAccessToken(session.account);
    const { bikes, shoes } = await getGears(accessToken);

    const gears = [
      ...bikes.map((gear) => ({
        id: gear.id,
        name: gear.name,
        type: "bike" as const,
      })),
      ...shoes.map((gear) => ({
        id: gear.id,
        name: gear.name,
        type: "shoes" as const,
      })),
    ];

    return NextResponse.json({ gears });
  } catch (err) {
    return handleAuthenticatedApiError(err);
  }
}