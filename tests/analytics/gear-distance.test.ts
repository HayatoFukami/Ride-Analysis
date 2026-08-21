import { describe, expect, it } from "vitest";
import { aggregateGearDistance } from "@/lib/analytics/gear-distance";
import type { StravaActivity } from "@/lib/strava/types";

function makeActivity(
  id: number,
  distance: number,
  gearId: string | null
): StravaActivity {
  return {
    id,
    name: `Activity ${id}`,
    type: "Ride",
    distance,
    moving_time: 0,
    elapsed_time: 0,
    start_date: "2026-08-01T00:00:00Z",
    start_date_local: "2026-08-01T00:00:00Z",
    gear_id: gearId,
    athlete: { id: 1 },
  };
}

describe("aggregateGearDistance", () => {
  it("converts summed meters to kilometers", () => {
    const activities = [
      makeActivity(1, 1000, "bike-a"),
      makeActivity(2, 2500, "bike-a"),
    ];
    const result = aggregateGearDistance(activities, "bike-a");
    expect(result.distanceMeters).toBe(3500);
    expect(result.distanceKilometers).toBe(3.5);
  });

  it("filters activities by a specific gear id", () => {
    const activities = [
      makeActivity(1, 1000, "bike-a"),
      makeActivity(2, 2000, "bike-b"),
      makeActivity(3, 3000, "bike-a"),
    ];
    const result = aggregateGearDistance(activities, "bike-a");
    expect(result.activityCount).toBe(2);
    expect(result.distanceMeters).toBe(4000);
    expect(result.distanceKilometers).toBe(4);
  });

  it("includes all activities when gearId is null (All Gear)", () => {
    const activities = [
      makeActivity(1, 1000, "bike-a"),
      makeActivity(2, 2000, "bike-b"),
      makeActivity(3, 3000, null),
    ];
    const result = aggregateGearDistance(activities, null);
    expect(result.activityCount).toBe(3);
    expect(result.distanceMeters).toBe(6000);
    expect(result.distanceKilometers).toBe(6);
  });

  it("includes all activities when gearId is an empty string (All Gear)", () => {
    const activities = [
      makeActivity(1, 1000, "bike-a"),
      makeActivity(2, 2000, null),
    ];
    const result = aggregateGearDistance(activities, "");
    expect(result.activityCount).toBe(2);
    expect(result.distanceMeters).toBe(3000);
  });

  it("returns zero counts for an empty activity list", () => {
    const result = aggregateGearDistance([], "bike-a");
    expect(result.activityCount).toBe(0);
    expect(result.distanceMeters).toBe(0);
    expect(result.distanceKilometers).toBe(0);
    expect(result.averageDistanceKilometers).toBe(0);
  });

  it("returns zero average for an empty filtered set", () => {
    const activities = [makeActivity(1, 1000, "bike-a")];
    const result = aggregateGearDistance(activities, "bike-b");
    expect(result.activityCount).toBe(0);
    expect(result.averageDistanceKilometers).toBe(0);
  });

  it("computes average distance in kilometers per activity", () => {
    const activities = [
      makeActivity(1, 1000, "bike-a"),
      makeActivity(2, 3000, "bike-a"),
    ];
    const result = aggregateGearDistance(activities, "bike-a");
    expect(result.averageDistanceKilometers).toBe(2);
  });

  it("treats a missing distance as zero", () => {
    const activities = [
      { ...makeActivity(1, 1000, "bike-a"), distance: undefined as unknown as number },
      makeActivity(2, 2000, "bike-a"),
    ];
    const result = aggregateGearDistance(activities, "bike-a");
    expect(result.distanceMeters).toBe(2000);
    expect(result.activityCount).toBe(2);
  });
});