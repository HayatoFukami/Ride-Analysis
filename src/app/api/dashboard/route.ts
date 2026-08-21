import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getValidAccessToken } from "@/lib/strava/auth";
import { getAthlete } from "@/lib/strava/athlete";
import { getAllActivities } from "@/lib/strava/activities";
import {
  isValidTimeZone,
  localMidnightEpoch,
  nextDay,
  todayInTimezone,
} from "@/lib/analytics/date-range";
import { handleAuthenticatedApiError, unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * Dashboard overview statistics for the current month and year, using the
 * authenticated athlete's timezone for calendar-day boundaries (UTC fallback
 * when the timezone is missing/invalid).
 * Response shape: `{ overview: { monthDistanceKilometers, monthActivityCount,
 * monthMovingTimeSeconds, yearDistanceKilometers } }`.
 */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { accessToken } = await getValidAccessToken(session.account);
    const athlete = await getAthlete(accessToken);
    const timeZone = isValidTimeZone(athlete.timezone) ? athlete.timezone : null;

    const today = timeZone ? todayInTimezone(timeZone) : null;
    const [year, month] = today
      ? today.split("-").map(Number)
      : [new Date().getUTCFullYear(), new Date().getUTCMonth() + 1];

    const yearStartStr = `${year}-01-01`;
    const monthStartStr = `${year}-${String(month).padStart(2, "0")}-01`;

    // Inclusive lower bound (start of year) and exclusive upper bound (start
    // of the next local calendar day after today).
    const after = timeZone
      ? Math.floor(localMidnightEpoch(yearStartStr, timeZone) / 1000)
      : Math.floor(Date.UTC(year, 0, 1) / 1000);
    const before = timeZone
      ? Math.floor(localMidnightEpoch(nextDay(today!), timeZone) / 1000)
      : Math.floor((Date.now() + 86_400_000) / 1000);

    const monthStartMs = timeZone
      ? localMidnightEpoch(monthStartStr, timeZone)
      : Date.UTC(year, month - 1, 1);

    const activities = await getAllActivities({ accessToken, after, before });

    const monthActivities = activities.filter(
      (activity) =>
        new Date(activity.start_date).getTime() >= monthStartMs
    );

    const monthDistanceMeters = monthActivities.reduce(
      (sum, activity) => sum + (activity.distance || 0),
      0
    );
    const monthMovingTimeSeconds = monthActivities.reduce(
      (sum, activity) => sum + (activity.moving_time || 0),
      0
    );
    const yearDistanceMeters = activities.reduce(
      (sum, activity) => sum + (activity.distance || 0),
      0
    );

    return NextResponse.json({
      overview: {
        monthDistanceKilometers: monthDistanceMeters / 1000,
        monthActivityCount: monthActivities.length,
        monthMovingTimeSeconds,
        yearDistanceKilometers: yearDistanceMeters / 1000,
      },
    });
  } catch (err) {
    return handleAuthenticatedApiError(err);
  }
}