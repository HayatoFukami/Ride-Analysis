import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/session";
import { getValidAccessToken } from "@/lib/strava/auth";
import { getAthlete } from "@/lib/strava/athlete";
import { getAllActivities } from "@/lib/strava/activities";
import { validateDateRange, dateRangeToTimestamps } from "@/lib/analytics/date-range";
import { aggregateGearDistance } from "@/lib/analytics/gear-distance";
import { handleAuthenticatedApiError, unauthorized, validationError } from "@/lib/api/errors";

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "開始日（from）の形式が不正です。"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "終了日（to）の形式が不正です。"),
  gearId: z.string().optional(),
});

export const dynamic = "force-dynamic";

/**
 * Gear-distance analytics for an inclusive ISO date range and an optional gear.
 * Calendar-day boundaries use the authenticated athlete's timezone (UTC
 * fallback when missing/invalid).
 * Response shape:
 * `{ gear: { id|null, name }, period: { from, to }, distanceMeters,
 *   distanceKilometers, activityCount, averageDistanceKilometers }`.
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return unauthorized();
  }

  const searchParams = request.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
    gearId: searchParams.get("gearId") ?? undefined,
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "入力値が不正です。";
    return validationError(message);
  }

  const { from, to } = parsed.data;
  const gearId = parsed.data.gearId ?? null;

  const range = validateDateRange(from, to);
  if (!range.ok) {
    return validationError(range.message);
  }

  try {
    const { accessToken } = await getValidAccessToken(session.account);

    // Fetch the athlete once: it provides both the timezone (for calendar-day
    // boundaries) and the registered gear (for gear validation).
    const athlete = await getAthlete(accessToken);
    const timeZone = athlete.timezone;

    // When a gear is selected, confirm it belongs to the athlete.
    let gearName = "すべての機材 (All Gear)";
    if (gearId) {
      const gear = [...athlete.bikes, ...athlete.shoes].find(
        (item) => item.id === gearId
      );
      if (!gear) {
        return validationError("選択した機材が見つかりません。");
      }
      gearName = gear.name;
    }

    const { after, before } = dateRangeToTimestamps(from, to, timeZone);
    const activities = await getAllActivities({ accessToken, after, before });
    const result = aggregateGearDistance(activities, gearId);

    return NextResponse.json({
      gear: { id: gearId, name: gearName },
      period: { from, to },
      ...result,
    });
  } catch (err) {
    return handleAuthenticatedApiError(err);
  }
}