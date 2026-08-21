import { stravaFetch } from "./client";
import type { StravaAthlete } from "./types";

/** Fetch the authenticated athlete's profile. */
export async function getAthlete(accessToken: string): Promise<StravaAthlete> {
  return stravaFetch<StravaAthlete>("/athlete", { accessToken });
}