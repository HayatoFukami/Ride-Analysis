import { stravaFetch } from "./client";
import {
  ACTIVITIES_PER_PAGE,
  MAX_ACTIVITY_PAGES,
} from "./config";
import { StravaApiError } from "./errors";
import type { StravaActivity } from "./types";

export interface GetActivitiesParams {
  accessToken: string;
  /** Inclusive lower bound as a Unix timestamp (seconds). */
  after?: number;
  /** Exclusive upper bound as a Unix timestamp (seconds). */
  before?: number;
  page?: number;
  perPage?: number;
}

/** Fetch a single page of activities. */
export async function getActivities(
  params: GetActivitiesParams
): Promise<StravaActivity[]> {
  return stravaFetch<StravaActivity[]>("/athlete/activities", {
    accessToken: params.accessToken,
    query: {
      after: params.after,
      before: params.before,
      page: params.page ?? 1,
      per_page: params.perPage ?? ACTIVITIES_PER_PAGE,
    },
  });
}

/**
 * Fetch all activities in the given inclusive range, paging through the API.
 * Stops when a page returns fewer than `per_page` results.
 *
 * Never returns silently truncated partial data: if the configured page
 * maximum is reached with a full page (meaning more results may exist), a safe
 * error is thrown instead of returning an incomplete aggregate.
 */
export async function getAllActivities(params: {
  accessToken: string;
  after: number;
  before: number;
}): Promise<StravaActivity[]> {
  const activities: StravaActivity[] = [];
  for (let page = 1; page <= MAX_ACTIVITY_PAGES; page++) {
    const batch = await getActivities({
      accessToken: params.accessToken,
      after: params.after,
      before: params.before,
      page,
      perPage: ACTIVITIES_PER_PAGE,
    });
    activities.push(...batch);
    if (batch.length < ACTIVITIES_PER_PAGE) {
      break;
    }
    if (page === MAX_ACTIVITY_PAGES) {
      throw new StravaApiError(
        "アクティビティの取得が上限に達しました。期間を短くして再度お試しください。",
        500
      );
    }
  }
  return activities;
}