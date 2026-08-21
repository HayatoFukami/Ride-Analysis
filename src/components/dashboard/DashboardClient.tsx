"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { MeResponse, DashboardResponse, GearsResponse, GearItemResponse } from "@/types/api";
import { Header, Athlete } from "./Header";
import { OverviewSection, OverviewStats } from "./OverviewSection";
import { AnalyticsSection } from "../analytics/AnalyticsSection";

export function DashboardClient() {
  const router = useRouter();

  // Athlete state
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [isLoadingAthlete, setIsLoadingAthlete] = useState<boolean>(true);

  // Overview stats state
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Gears state
  const [gears, setGears] = useState<GearItemResponse[]>([]);
  const [isLoadingGears, setIsLoadingGears] = useState<boolean>(true);
  const [gearsError, setGearsError] = useState<string | null>(null);

  const redirectToReconnect = useCallback(() => {
    router.push("/login?reason=reconnect");
  }, [router]);

  // Fetch /api/dashboard
  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      setStatsError(null);
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 401 || errData?.error?.code === "AUTHENTICATION") {
          redirectToReconnect();
          return;
        }
        throw new Error(errData?.error?.message || "ダッシュボード統計の取得に失敗しました。");
      }
      const data: DashboardResponse = await res.json();
      setOverviewStats(data.overview);
    } catch (err: unknown) {
      setStatsError(err instanceof Error ? err.message : "ダッシュボード統計の取得に失敗しました。");
    } finally {
      setIsLoadingStats(false);
    }
  }, [redirectToReconnect]);

  // Fetch /api/gears
  const fetchGears = useCallback(async () => {
    try {
      setIsLoadingGears(true);
      setGearsError(null);
      const res = await fetch("/api/gears");
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 401 || errData?.error?.code === "AUTHENTICATION") {
          redirectToReconnect();
          return;
        }
        throw new Error(errData?.error?.message || "機材リストの取得に失敗しました。");
      }
      const data: GearsResponse = await res.json();
      setGears(data.gears);
    } catch (err: unknown) {
      setGearsError(err instanceof Error ? err.message : "機材リストの取得に失敗しました。");
    } finally {
      setIsLoadingGears(false);
    }
  }, [redirectToReconnect]);

  // Load all initial dashboard data once on mount
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [meRes, dashRes, gearsRes] = await Promise.allSettled([
          fetch("/api/me"),
          fetch("/api/dashboard"),
          fetch("/api/gears"),
        ]);

        if (!isMounted) return;

        // Process /api/me
        if (meRes.status === "fulfilled") {
          if (meRes.value.ok) {
            const meData: MeResponse = await meRes.value.json();
            if (isMounted) setAthlete(meData.athlete);
          } else {
            const meErr = await meRes.value.json().catch(() => null);
            if (meRes.value.status === 401 || meErr?.error?.code === "AUTHENTICATION") {
              redirectToReconnect();
              return;
            }
          }
        }

        // Process /api/dashboard
        if (dashRes.status === "fulfilled") {
          if (dashRes.value.ok) {
            const dashData: DashboardResponse = await dashRes.value.json();
            if (isMounted) setOverviewStats(dashData.overview);
          } else {
            const dashErr = await dashRes.value.json().catch(() => null);
            if (dashRes.value.status === 401 || dashErr?.error?.code === "AUTHENTICATION") {
              redirectToReconnect();
              return;
            }
            if (isMounted) {
              setStatsError(dashErr?.error?.message || "ダッシュボード統計の取得に失敗しました。");
            }
          }
        } else if (isMounted) {
          setStatsError("ダッシュボード統計の取得に失敗しました。");
        }

        // Process /api/gears
        if (gearsRes.status === "fulfilled") {
          if (gearsRes.value.ok) {
            const gearsData: GearsResponse = await gearsRes.value.json();
            if (isMounted) setGears(gearsData.gears);
          } else {
            const gearsErr = await gearsRes.value.json().catch(() => null);
            if (gearsRes.value.status === 401 || gearsErr?.error?.code === "AUTHENTICATION") {
              redirectToReconnect();
              return;
            }
            if (isMounted) {
              setGearsError(gearsErr?.error?.message || "機材リストの取得に失敗しました。");
            }
          }
        } else if (isMounted) {
          setGearsError("機材リストの取得に失敗しました。");
        }
      } finally {
        if (isMounted) {
          setIsLoadingAthlete(false);
          setIsLoadingStats(false);
          setIsLoadingGears(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [redirectToReconnect]);

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col">
      {/* Top Header */}
      <Header athlete={athlete} isLoading={isLoadingAthlete} />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {athlete?.displayName ? `${athlete.displayName} さんのダッシュボード` : "ダッシュボード"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Stravaのアクティビティと機材別データを集計・可視化
            </p>
          </div>
        </div>

        {/* Overview Stats (4 / 2 / 1 Responsive Grid) */}
        <OverviewSection
          stats={overviewStats}
          isLoading={isLoadingStats}
          error={statsError}
          onRetry={fetchDashboardStats}
        />

        {/* Extensible Analytics Section */}
        <AnalyticsSection
          gears={gears}
          isLoadingGears={isLoadingGears}
          gearsError={gearsError}
          onRefreshGears={fetchGears}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>Strava Personal Dashboard · Powered by Strava API</p>
        </div>
      </footer>
    </div>
  );
}
