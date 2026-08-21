import { describe, expect, it } from "vitest";
import {
  MAX_RANGE_DAYS,
  dateRangeToTimestamps,
  isValidTimeZone,
  localMidnightEpoch,
  nextDay,
  parseIsoDate,
  todayInTimezone,
  validateDateRange,
} from "@/lib/analytics/date-range";

describe("parseIsoDate", () => {
  it("parses a valid YYYY-MM-DD string into a UTC Date", () => {
    const date = parseIsoDate("2026-08-21");
    expect(date).not.toBeNull();
    expect(date!.getUTCFullYear()).toBe(2026);
    expect(date!.getUTCMonth()).toBe(7); // 0-indexed
    expect(date!.getUTCDate()).toBe(21);
    expect(date!.getUTCHours()).toBe(0);
    expect(date!.getUTCMinutes()).toBe(0);
    expect(date!.getUTCSeconds()).toBe(0);
  });

  it("returns null for a non-ISO string", () => {
    expect(parseIsoDate("2026/08/21")).toBeNull();
    expect(parseIsoDate("not-a-date")).toBeNull();
    expect(parseIsoDate("")).toBeNull();
  });

  it("returns null for an impossible calendar date", () => {
    expect(parseIsoDate("2026-02-31")).toBeNull();
    expect(parseIsoDate("2026-13-01")).toBeNull();
    expect(parseIsoDate("2026-00-10")).toBeNull();
  });

  it("returns null for a malformed day/month length", () => {
    expect(parseIsoDate("2026-8-1")).toBeNull();
    expect(parseIsoDate("2026-08-1")).toBeNull();
  });
});

describe("validateDateRange", () => {
  it("accepts a valid inclusive range", () => {
    const result = validateDateRange("2026-08-01", "2026-08-21");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.from.getUTCDate()).toBe(1);
      expect(result.to.getUTCDate()).toBe(21);
    }
  });

  it("accepts a single-day range", () => {
    const result = validateDateRange("2026-08-21", "2026-08-21");
    expect(result.ok).toBe(true);
  });

  it("rejects an invalid from date", () => {
    const result = validateDateRange("bad", "2026-08-21");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("from");
  });

  it("rejects an invalid to date", () => {
    const result = validateDateRange("2026-08-01", "bad");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("to");
  });

  it("rejects a range where from is after to", () => {
    const result = validateDateRange("2026-08-21", "2026-08-01");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("以前");
  });

  it("rejects a range exceeding the maximum number of days", () => {
    // 2025-01-01 .. 2026-12-31 spans 731 days (> MAX_RANGE_DAYS).
    const result = validateDateRange("2025-01-01", "2026-12-31");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain(String(MAX_RANGE_DAYS));
  });

  it("accepts a range exactly at the maximum number of days", () => {
    // MAX_RANGE_DAYS days inclusive starting 2026-01-01.
    const to = new Date(Date.UTC(2026, 0, 1 + (MAX_RANGE_DAYS - 1)));
    const toIso = to.toISOString().slice(0, 10);
    const result = validateDateRange("2026-01-01", toIso);
    expect(result.ok).toBe(true);
  });
});

describe("dateRangeToTimestamps", () => {
  it("converts an inclusive range to after/before Unix seconds (UTC fallback)", () => {
    const { after, before } = dateRangeToTimestamps("2026-08-01", "2026-08-21");
    const from = parseIsoDate("2026-08-01")!;
    const to = parseIsoDate("2026-08-21")!;
    expect(after).toBe(Math.floor(from.getTime() / 1000));
    // before is the start of the day AFTER `to`, so the whole `to` day is included.
    expect(before).toBe(Math.floor((to.getTime() + 86_400_000) / 1000));
  });

  it("returns before strictly greater than after for a single-day range", () => {
    const { after, before } = dateRangeToTimestamps("2026-08-21", "2026-08-21");
    expect(before - after).toBe(86_400);
  });

  it("uses the local calendar day when a valid timezone is provided", () => {
    const utc = dateRangeToTimestamps("2026-08-01", "2026-08-01");
    const tokyo = dateRangeToTimestamps("2026-08-01", "2026-08-01", "Asia/Tokyo");
    // Tokyo (UTC+9) local midnight is 9 hours earlier in UTC than UTC midnight.
    expect(tokyo.after).toBe(utc.after - 9 * 3600);
    expect(tokyo.before).toBe(utc.before - 9 * 3600);
  });

  it("falls back to UTC for an invalid timezone", () => {
    const utc = dateRangeToTimestamps("2026-08-01", "2026-08-01");
    const invalid = dateRangeToTimestamps("2026-08-01", "2026-08-01", "Not/AZone");
    expect(invalid).toEqual(utc);
  });
});

describe("isValidTimeZone", () => {
  it("accepts a valid IANA timezone", () => {
    expect(isValidTimeZone("Asia/Tokyo")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
  });

  it("rejects invalid, empty, or null timezones", () => {
    expect(isValidTimeZone("Not/AZone")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone(null)).toBe(false);
    expect(isValidTimeZone(undefined)).toBe(false);
  });
});

describe("nextDay", () => {
  it("returns the following calendar day", () => {
    expect(nextDay("2026-08-21")).toBe("2026-08-22");
    expect(nextDay("2026-12-31")).toBe("2027-01-01");
    expect(nextDay("2028-02-28")).toBe("2028-02-29"); // leap year
  });
});

describe("localMidnightEpoch", () => {
  it("returns the epoch of local midnight for a timezone", () => {
    // 2026-08-01 00:00 JST (UTC+9) == 2026-07-31 15:00 UTC.
    const epoch = localMidnightEpoch("2026-08-01", "Asia/Tokyo");
    expect(epoch).toBe(Date.UTC(2026, 6, 31, 15, 0, 0));
  });
});

describe("todayInTimezone", () => {
  it("returns a YYYY-MM-DD string for the given timezone", () => {
    const today = todayInTimezone("UTC");
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});