"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  DashboardResponse,
  GearItemResponse,
  MeResponse,
} from "@/types/api";
import { Header, Athlete } from "./Header";
import { OverviewSection, OverviewStats } from "./OverviewSection";
import { AnalyticsSection } from "../analytics/AnalyticsSection";
import { readApiError } from "./api";

/**
 * Client boundary for the authenticated dashboard. All data comes from
 * internal routes (/api/me, /api/dashboard, /api/gears, /api/analytics/*,
 * /api/auth/*) — never from Strava directly. Initial loads run independently
 * in parallel; each surface keeps its own loading/error/retry state.
 */
export function DashboardClient() {
  const router = useRouter();

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [isLoadingAthlete, setIsLoadingAthlete] = useState(true);

  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [gears, setGears] = useState<GearItemResponse[]>([]);
  const [isLoadingGears, setIsLoadingGears] = useState(true);
  const [gearsError, setGearsError] = useState<string | null>(null);

  const redirectToReconnect = useCallback(() => {
    router.push("/login?reason=reconnect");
  }, [router]);

  // Fetch /api/dashboard. State is only updated after `await` so this is safe
  // to call from the mount effect (no synchronous setState in the effect body).
  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        const info = await readApiError(res, "ダッシュボード統計の取得に失敗しました。");
        if (info.kind === "auth") {
          redirectToReconnect();
          return;
        }
        setStatsError(info.message);
        return;
      }
      const data: DashboardResponse = await res.json();
      setOverviewStats(data.overview);
      setStatsError(null);
    } catch {
      setStatsError("ダッシュボード統計の取得に失敗しました。");
    } finally {
      setIsLoadingStats(false);
    }
  }, [redirectToReconnect]);

  // Retry wrapper: flip loading/error synchronously (event handler, not effect).
  const retryStats = useCallback(() => {
    setIsLoadingStats(true);
    setStatsError(null);
    void fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Fetch /api/gears. State is only updated after `await` (see above).
  const fetchGears = useCallback(async () => {
    try {
      const res = await fetch("/api/gears");
      if (!res.ok) {
        const info = await readApiError(res, "機材リストの取得に失敗しました。");
        if (info.kind === "auth") {
          redirectToReconnect();
          return;
        }
        setGearsError(info.message);
        return;
      }
      const data = (await res.json()) as { gears: GearItemResponse[] };
      setGears(data.gears);
      setGearsError(null);
    } catch {
      setGearsError("機材リストの取得に失敗しました。");
    } finally {
      setIsLoadingGears(false);
    }
  }, [redirectToReconnect]);

  // Retry wrapper for gears (event handler, not effect).
  const retryGears = useCallback(() => {
    setIsLoadingGears(true);
    setGearsError(null);
    void fetchGears();
  }, [fetchGears]);

  // Load all initial dashboard data independently in parallel. State is only
  // updated after `await`, so nothing is set synchronously in the effect body.
  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      const [meRes, dashRes, gearsRes] = await Promise.allSettled([
        fetch("/api/me"),
        fetch("/api/dashboard"),
        fetch("/api/gears"),
      ]);

      if (!isMounted) return;

      // /api/me
      if (meRes.status === "fulfilled") {
        if (meRes.value.ok) {
          const data: MeResponse = await meRes.value.json();
          if (isMounted) setAthlete(data.athlete);
        } else {
          const info = await readApiError(meRes.value, "プロフィールの取得に失敗しました。");
          if (info.kind === "auth") redirectToReconnect();
        }
      }

      // /api/dashboard
      if (dashRes.status === "fulfilled") {
        if (dashRes.value.ok) {
          const data: DashboardResponse = await dashRes.value.json();
          if (isMounted) {
            setOverviewStats(data.overview);
            setStatsError(null);
          }
        } else {
          const info = await readApiError(dashRes.value, "ダッシュボード統計の取得に失敗しました。");
          if (info.kind === "auth") redirectToReconnect();
          else if (isMounted) setStatsError(info.message);
        }
      } else if (isMounted) {
        setStatsError("ダッシュボード統計の取得に失敗しました。");
      }

      // /api/gears
      if (gearsRes.status === "fulfilled") {
        if (gearsRes.value.ok) {
          const data = (await gearsRes.value.json()) as { gears: GearItemResponse[] };
          if (isMounted) {
            setGears(data.gears);
            setGearsError(null);
          }
        } else {
          const info = await readApiError(gearsRes.value, "機材リストの取得に失敗しました。");
          if (info.kind === "auth") redirectToReconnect();
          else if (isMounted) setGearsError(info.message);
        }
      } else if (isMounted) {
        setGearsError("機材リストの取得に失敗しました。");
      }

      if (isMounted) {
        setIsLoadingAthlete(false);
        setIsLoadingStats(false);
        setIsLoadingGears(false);
      }
    }

    void loadInitial();

    return () => {
      isMounted = false;
    };
  }, [redirectToReconnect]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header athlete={athlete} isLoading={isLoadingAthlete} />

      <main className="m3-container flex-1 py-6 sm:py-8">
        {/* Welcome */}
        <section className="mb-6" aria-labelledby="welcome-heading">
          <h1
            id="welcome-heading"
            className="text-xl font-semibold tracking-tight text-on-surface sm:text-2xl"
          >
            {athlete?.displayName
              ? `${athlete.displayName} さんのダッシュボード`
              : "ダッシュボード"}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Stravaのアクティビティと機材別データを集計・可視化
          </p>
        </section>

        <div className="space-y-8">
          <OverviewSection
            stats={overviewStats}
            isLoading={isLoadingStats}
            error={statsError}
            onRetry={retryStats}
          />

          <AnalyticsSection
            gears={gears}
            isLoadingGears={isLoadingGears}
            gearsError={gearsError}
            onRefreshGears={retryGears}
          />
        </div>
      </main>

      <footer className="border-t border-outline-variant py-5">
        <p className="m3-container text-center text-xs text-on-surface-variant">
          Ride Analysis · Powered by Strava API
        </p>
      </footer>
    </div>
  );
}
