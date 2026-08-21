/**
 * Typed error hierarchy for Strava API interactions.
 *
 * Every error carries a stable `code` and a safe Japanese `message` that can be
 * returned to the client as `{ error: { code, message } }`. Sensitive values
 * (client secret, access/refresh tokens) are never included.
 */

export type StravaErrorCode =
  | "AUTHENTICATION"
  | "STRAVA_API"
  | "RATE_LIMIT"
  | "NETWORK"
  | "VALIDATION"
  | "UNKNOWN";

export class StravaError extends Error {
  readonly code: StravaErrorCode;
  readonly status: number | null;
  /** Optional technical detail for server-side logs only. */
  readonly detail?: string;

  constructor(
    code: StravaErrorCode,
    message: string,
    options: { status?: number | null; detail?: string; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "StravaError";
    this.code = code;
    this.status = options.status ?? null;
    this.detail = options.detail;
  }

  /** Shape safe to return to the client. */
  toJSON(): { error: { code: StravaErrorCode; message: string } } {
    return { error: { code: this.code, message: this.message } };
  }
}

export class AuthenticationError extends StravaError {
  constructor(detail?: string) {
    super(
      "AUTHENTICATION",
      "Stravaとの接続が切れています。再接続してください。",
      { status: 401, detail }
    );
    this.name = "AuthenticationError";
  }
}

export class StravaApiError extends StravaError {
  constructor(message: string, status: number, detail?: string) {
    super("STRAVA_API", message, { status, detail });
    this.name = "StravaApiError";
  }
}

export class RateLimitError extends StravaError {
  constructor(detail?: string) {
    super(
      "RATE_LIMIT",
      "Strava APIの利用制限に達しました。時間を空けて再度試してください。",
      { status: 429, detail }
    );
    this.name = "RateLimitError";
  }
}

export class NetworkError extends StravaError {
  constructor(detail?: string) {
    super("NETWORK", "Stravaからデータを取得できませんでした。", {
      status: null,
      detail,
    });
    this.name = "NetworkError";
  }
}

export class ValidationError extends StravaError {
  constructor(message: string) {
    super("VALIDATION", message, { status: 400 });
    this.name = "ValidationError";
  }
}

export class UnknownError extends StravaError {
  constructor(detail?: string) {
    super("UNKNOWN", "予期しないエラーが発生しました。", { detail });
    this.name = "UnknownError";
  }
}
