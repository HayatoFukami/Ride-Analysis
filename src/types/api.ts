import type { StravaErrorCode } from "@/lib/strava/errors";

/** Shape of every error response: `{ error: { code, message } }`. */
export interface ApiErrorResponse {
  error: {
    code: StravaErrorCode;
    message: string;
  };
}

export interface MeResponse {
  athlete: {
    id: string;
    displayName: string;
    profile: string;
  };
}

export interface DashboardResponse {
  overview: {
    monthDistanceKilometers: number;
    monthActivityCount: number;
    monthMovingTimeSeconds: number;
    yearDistanceKilometers: number;
  };
}

export interface GearItemResponse {
  id: string;
  name: string;
  type: "bike" | "shoes";
}

export interface GearsResponse {
  gears: GearItemResponse[];
}

export interface GearDistanceResponse {
  gear: {
    id: string | null;
    name: string;
  };
  period: {
    from: string;
    to: string;
  };
  distanceMeters: number;
  distanceKilometers: number;
  activityCount: number;
  averageDistanceKilometers: number;
}