import { stravaFetch } from "./client";
import type { StravaAthlete, StravaGear } from "./types";

export interface GearList {
  bikes: StravaGear[];
  shoes: StravaGear[];
}

/**
 * Fetch the authenticated athlete's registered gear (bikes and shoes).
 * Uses the shared client; the athlete endpoint returns both lists.
 */
export async function getGears(accessToken: string): Promise<GearList> {
  const athlete = await stravaFetch<StravaAthlete>("/athlete", { accessToken });
  return {
    bikes: athlete.bikes ?? [],
    shoes: athlete.shoes ?? [],
  };
}