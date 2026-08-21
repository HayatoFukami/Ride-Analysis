/**
 * Typed models for the Strava API resources used by this application.
 * Only the fields we actually consume are declared.
 */

export interface StravaAthlete {
  /** Raw Strava athlete id. May exceed JS safe integer (Long), so it is
   *  converted to a String at persistence/API boundaries. */
  id: number;
  username: string | null;
  firstname: string;
  lastname: string;
  profile: string;
  profile_medium: string;
  city: string | null;
  state: string | null;
  country: string | null;
  /** IANA timezone of the athlete (e.g. "Asia/Tokyo"). */
  timezone: string;
  bikes: StravaGear[];
  shoes: StravaGear[];
}

export type StravaGearType = "bike" | "shoes";

export interface StravaGear {
  id: string;
  primary: boolean;
  name: string;
  distance: number;
  /** Present on bikes. */
  brand_name?: string | null;
  model_name?: string | null;
  /** Present on shoes. */
  nickname?: string | null;
}

export type StravaActivityType =
  | "Ride"
  | "Run"
  | "Walk"
  | "Hike"
  | "Swim"
  | "VirtualRide"
  | "VirtualRun"
  | "AlpineSki"
  | "BackcountrySki"
  | "Canoeing"
  | "Crossfit"
  | "EBikeRide"
  | "Elliptical"
  | "Golf"
  | "Handcycle"
  | "IceSkate"
  | "InlineSkate"
  | "Kayaking"
  | "Kitesurf"
  | "NordicSki"
  | "RockClimbing"
  | "RollerSki"
  | "Rowing"
  | "Sail"
  | "Skateboard"
  | "Snowboard"
  | "Snowshoe"
  | "Soccer"
  | "StairStepper"
  | "StandUpPaddling"
  | "Surfing"
  | "Velomobile"
  | "WeightTraining"
  | "Wheelchair"
  | "Windsurf"
  | "Workout"
  | "Yoga";

export interface StravaActivity {
  id: number;
  name: string;
  type: StravaActivityType;
  /** Distance in meters. */
  distance: number;
  /** Moving time in seconds. */
  moving_time: number;
  elapsed_time: number;
  /** Unix timestamp (seconds) of the activity start. */
  start_date: string;
  /** Unix timestamp (seconds) of the activity start. */
  start_date_local: string;
  /** Unix timestamp (seconds). */
  start_date_local_raw?: number;
  /** Unix timestamp (seconds). */
  start_date_raw?: number;
  /** Gear id when the activity used a bike/shoes. */
  gear_id: string | null;
  athlete: { id: number };
}

/** Response from the Strava token endpoint. */
export interface StravaTokenResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  /** Unix timestamp (seconds) when the access token expires. */
  expires_at: number;
  expires_in: number;
  scope: string;
  athlete?: StravaAthlete;
}

/** Normalized athlete profile exposed to the UI. */
export interface AthleteProfile {
  id: string;
  displayName: string;
  profile: string;
}
