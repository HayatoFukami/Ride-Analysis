import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getActivities,
  getAllActivities,
} from "@/lib/strava/activities";
import { ACTIVITIES_PER_PAGE, MAX_ACTIVITY_PAGES } from "@/lib/strava/config";
import { StravaApiError } from "@/lib/strava/errors";
import type { StravaActivity } from "@/lib/strava/types";

/** Signature of the global `fetch` used to type fetch spies. */
type FetchFn = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

function makeActivity(id: number): StravaActivity {
  return {
    id,
    name: `Activity ${id}`,
    type: "Ride",
    distance: 1000,
    moving_time: 0,
    elapsed_time: 0,
    start_date: "2026-01-01T00:00:00Z",
    start_date_local: "2026-01-01T00:00:00Z",
    gear_id: null,
    athlete: { id: 1 },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getActivities", () => {
  it("requests the activities endpoint with default page and per_page", async () => {
    const fetchMock = vi.fn<FetchFn>(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await getActivities({ accessToken: "token" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/athlete/activities");
    expect(String(url)).toContain("page=1");
    expect(String(url)).toContain(`per_page=${ACTIVITIES_PER_PAGE}`);
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer token",
    });
  });

  it("passes through after, before, page and per_page query params", async () => {
    const fetchMock = vi.fn<FetchFn>(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await getActivities({
      accessToken: "token",
      after: 100,
      before: 200,
      page: 3,
      perPage: 50,
    });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("after=100");
    expect(url).toContain("before=200");
    expect(url).toContain("page=3");
    expect(url).toContain("per_page=50");
  });

  it("returns the parsed activity list", async () => {
    const activities = [makeActivity(1), makeActivity(2)];
    vi.stubGlobal("fetch", async () => jsonResponse(activities));

    const result = await getActivities({ accessToken: "token" });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
  });
});

describe("getAllActivities", () => {
  it("pages until a page returns fewer than per_page results", async () => {
    const page1 = Array.from({ length: ACTIVITIES_PER_PAGE }, (_, i) =>
      makeActivity(i + 1)
    );
    const page2 = [makeActivity(ACTIVITIES_PER_PAGE + 1)];
    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValueOnce(jsonResponse(page1))
      .mockResolvedValueOnce(jsonResponse(page2));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAllActivities({
      accessToken: "token",
      after: 100,
      before: 200,
    });

    expect(result).toHaveLength(ACTIVITIES_PER_PAGE + 1);
    // Two pages requested: full page then a short page that stops the loop.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws a safe error when MAX_ACTIVITY_PAGES full pages are reached", async () => {
    const fullPage = Array.from({ length: ACTIVITIES_PER_PAGE }, (_, i) =>
      makeActivity(i + 1)
    );
    const fetchMock = vi.fn<FetchFn>(async () => jsonResponse(fullPage));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getAllActivities({ accessToken: "token", after: 100, before: 200 })
    ).rejects.toBeInstanceOf(StravaApiError);

    expect(fetchMock).toHaveBeenCalledTimes(MAX_ACTIVITY_PAGES);
  });

  it("returns an empty list when the first page is empty", async () => {
    const fetchMock = vi.fn<FetchFn>(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAllActivities({
      accessToken: "token",
      after: 100,
      before: 200,
    });

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("increments the page number across requests", async () => {
    const page1 = Array.from({ length: ACTIVITIES_PER_PAGE }, (_, i) =>
      makeActivity(i + 1)
    );
    const page2 = [makeActivity(ACTIVITIES_PER_PAGE + 1)];
    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValueOnce(jsonResponse(page1))
      .mockResolvedValueOnce(jsonResponse(page2));
    vi.stubGlobal("fetch", fetchMock);

    await getAllActivities({ accessToken: "token", after: 1, before: 2 });

    const pages = fetchMock.mock.calls.map(([url]) =>
      new URL(String(url)).searchParams.get("page")
    );
    expect(pages).toEqual(["1", "2"]);
  });
});