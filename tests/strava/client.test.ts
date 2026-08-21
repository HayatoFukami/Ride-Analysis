import { afterEach, describe, expect, it, vi } from "vitest";
import { stravaFetch } from "@/lib/strava/client";
import {
  AuthenticationError,
  NetworkError,
  RateLimitError,
  StravaApiError,
} from "@/lib/strava/errors";

/** Signature of the global `fetch` used to type fetch spies. */
type FetchFn = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("stravaFetch", () => {
  it("sends the access token as a Bearer Authorization header", async () => {
    const fetchMock = vi.fn<FetchFn>(async () => jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await stravaFetch("/athlete", { accessToken: "secret-token" });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({
      Authorization: "Bearer secret-token",
    });
  });

  it("returns the parsed JSON body on success", async () => {
    vi.stubGlobal("fetch", async () => jsonResponse({ id: 42 }));
    const result = await stravaFetch<{ id: number }>("/athlete", {
      accessToken: "token",
    });
    expect(result.id).toBe(42);
  });

  it("throws AuthenticationError on a 401 response", async () => {
    vi.stubGlobal("fetch", async () => jsonResponse({}, 401));
    await expect(
      stravaFetch("/athlete/activities", { accessToken: "token" })
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("throws RateLimitError on a 429 response", async () => {
    vi.stubGlobal("fetch", async () => jsonResponse({}, 429));
    await expect(
      stravaFetch("/athlete/activities", { accessToken: "token" })
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("throws StravaApiError on a non-OK response", async () => {
    vi.stubGlobal("fetch", async () => jsonResponse({ message: "boom" }, 500));
    await expect(
      stravaFetch("/athlete/activities", { accessToken: "token" })
    ).rejects.toBeInstanceOf(StravaApiError);
  });

  it("throws NetworkError when fetch itself throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connection refused");
      })
    );
    await expect(
      stravaFetch("/athlete/activities", { accessToken: "token" })
    ).rejects.toBeInstanceOf(NetworkError);
  });

  it("omits undefined query params from the URL", async () => {
    const fetchMock = vi.fn<FetchFn>(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await stravaFetch("/athlete/activities", {
      accessToken: "token",
      query: { after: undefined, before: 200 },
    });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).not.toContain("after=");
    expect(url).toContain("before=200");
  });
});