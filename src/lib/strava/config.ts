/**
 * Single source of truth for all Strava API endpoints.
 * Keep every Strava resource request routed through the shared client.
 */
export const STRAVA_API_BASE_URL = "https://www.strava.com/api/v3";
export const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
export const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

/** Exact OAuth scope requested during login. */
export const STRAVA_SCOPES = "read,activity:read_all";

/** Refresh the access token when it expires within this many seconds. */
export const TOKEN_REFRESH_MARGIN_SECONDS = 5 * 60;

/** Maximum number of activity pages to fetch (safety guard against infinite loops). */
export const MAX_ACTIVITY_PAGES = 100;

/** Activities are requested in batches of this size. */
export const ACTIVITIES_PER_PAGE = 100;
