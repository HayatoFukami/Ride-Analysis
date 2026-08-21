import type { StravaActivity } from "@/lib/strava/types";

export interface GearDistanceResult {
  distanceMeters: number;
  distanceKilometers: number;
  activityCount: number;
  averageDistanceKilometers: number;
}

/**
 * Aggregate activities for a gear-distance analysis.
 *
 * - When `gearId` is provided, only activities whose `gear_id` matches are
 *   counted; otherwise all activities are included.
 * - Distance is summed in meters and converted to kilometers (m -> km).
 * - Average distance is kilometers per activity (0 when there are none).
 */
export function aggregateGearDistance(
  activities: StravaActivity[],
  gearId: string | null
): GearDistanceResult {
  const filtered = gearId
    ? activities.filter((activity) => activity.gear_id === gearId)
    : activities;

  const distanceMeters = filtered.reduce(
    (sum, activity) => sum + (activity.distance || 0),
    0
  );
  const distanceKilometers = distanceMeters / 1000;
  const activityCount = filtered.length;
  const averageDistanceKilometers =
    activityCount > 0 ? distanceKilometers / activityCount : 0;

  return {
    distanceMeters,
    distanceKilometers,
    activityCount,
    averageDistanceKilometers,
  };
}