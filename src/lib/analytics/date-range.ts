/**
 * Pure date-range helpers for analytics. No I/O, no side effects.
 *
 * Calendar-day boundaries are resolved in the authenticated athlete's IANA
 * timezone (DST-safe via Intl), falling back to UTC only when the timezone is
 * missing or invalid.
 */

export const MAX_RANGE_DAYS = 366;

/** Parse a `YYYY-MM-DD` string into a UTC Date, or null when invalid. */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Reject impossible dates such as 2026-02-31.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export type DateRangeValidation =
  | { ok: true; from: Date; to: Date }
  | { ok: false; message: string };

/** Validate an inclusive ISO date range (from <= to, max 366 days). */
export function validateDateRange(
  from: string,
  to: string
): DateRangeValidation {
  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);
  if (!fromDate) {
    return { ok: false, message: "開始日（from）の形式が不正です。" };
  }
  if (!toDate) {
    return { ok: false, message: "終了日（to）の形式が不正です。" };
  }
  if (fromDate.getTime() > toDate.getTime()) {
    return {
      ok: false,
      message: "開始日は終了日以前の日付を指定してください。",
    };
  }
  const days =
    Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1;
  if (days > MAX_RANGE_DAYS) {
    return {
      ok: false,
      message: `期間は最大${MAX_RANGE_DAYS}日以内で指定してください。`,
    };
  }
  return { ok: true, from: fromDate, to: toDate };
}

/** Return true when `tz` is a valid IANA timezone identifier. */
export function isValidTimeZone(tz: string | null | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Offset (ms) of `timeZone` at the given instant: localTime - utcTime. */
function getTimezoneOffsetMs(epochMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(epochMs));
  const get = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const localAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );
  return localAsUtc - epochMs;
}

/**
 * Epoch milliseconds of local midnight (00:00:00) for the given `YYYY-MM-DD`
 * calendar day in `timeZone`. DST-safe: the offset is evaluated at the actual
 * local-midnight instant and refined iteratively.
 */
export function localMidnightEpoch(dateStr: string, timeZone: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d, 0, 0, 0);
  let epoch = utcMidnight;
  for (let i = 0; i < 3; i++) {
    const offset = getTimezoneOffsetMs(epoch, timeZone);
    epoch = utcMidnight - offset;
  }
  return epoch;
}

/** Return the `YYYY-MM-DD` string for the day after `dateStr`. */
export function nextDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

/** Current local calendar day (`YYYY-MM-DD`) in `timeZone`. */
export function todayInTimezone(timeZone: string): string {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(new Date());
  const get = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/**
 * Convert an inclusive ISO date range to Strava `after`/`before` Unix
 * timestamps (seconds).
 *
 * - `after`  = start of the `from` local calendar day (00:00:00), inclusive.
 * - `before` = start of the next local calendar day after `to` (00:00:00),
 *   exclusive, so the entire `to` day is included.
 *
 * When `timeZone` is a valid IANA timezone it is used for the local calendar
 * day boundaries; otherwise UTC is used as a fallback.
 */
export function dateRangeToTimestamps(
  from: string,
  to: string,
  timeZone?: string | null
): { after: number; before: number } {
  if (isValidTimeZone(timeZone)) {
    const after = Math.floor(localMidnightEpoch(from, timeZone) / 1000);
    const before = Math.floor(localMidnightEpoch(nextDay(to), timeZone) / 1000);
    return { after, before };
  }

  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);
  const after = Math.floor((fromDate?.getTime() ?? 0) / 1000);
  const before = Math.floor(((toDate?.getTime() ?? 0) + 86_400_000) / 1000);
  return { after, before };
}