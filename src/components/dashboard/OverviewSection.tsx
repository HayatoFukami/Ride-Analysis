"use client";

import React from "react";
import {
  ActivityIcon,
  CalendarIcon,
  ClockIcon,
  FlameIcon,
  RefreshIcon,
  AlertCircleIcon,
} from "../ui/Icons";

export interface OverviewStats {
  monthDistanceKilometers: number;
  monthActivityCount: number;
  monthMovingTimeSeconds: number;
  yearDistanceKilometers: number;
}

interface OverviewSectionProps {
  stats: OverviewStats | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

function formatMovingTime(seconds?: number): string {
  if (typeof seconds === "number" && !isNaN(seconds)) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
  return "0h 00m";
}

function formatKm(km?: number): string {
  if (typeof km !== "number" || isNaN(km)) return "0.0";
  return km.toLocaleString("ja-JP", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatCount(count?: number): string {
  if (typeof count !== "number" || isNaN(count)) return "0";
  return count.toLocaleString("ja-JP");
}

export function OverviewSection({
  stats,
  isLoading,
  error,
  onRetry,
}: OverviewSectionProps) {
  const monthDistance = stats?.monthDistanceKilometers ?? 0;
  const monthActivities = stats?.monthActivityCount ?? 0;
  const monthTime = formatMovingTime(stats?.monthMovingTimeSeconds);
  const yearDistance = stats?.yearDistanceKilometers ?? 0;

  if (error) {
    return (
      <section className="mb-8 rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-slate-800 shadow-sm">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-900">
                基本統計データを取得できませんでした
              </h3>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              再試行する
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            アクティビティ概要
          </h2>
          <p className="text-xs text-slate-500">
            Stravaデータに基づく今月および今年の実績サマリー
          </p>
        </div>
        {onRetry && !isLoading && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-200/60 hover:text-slate-800"
            title="統計を更新"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            <span>更新</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <div className="h-8 w-28 animate-pulse rounded-lg bg-slate-200" />
                <div className="h-4 w-8 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="mt-3 h-3 w-32 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: 今月の距離 */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                今月の距離
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#FC5200] ring-1 ring-inset ring-orange-500/10">
                <CalendarIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {formatKm(monthDistance)}
              </span>
              <span className="ml-1.5 text-sm font-semibold text-slate-500">
                km
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              当月1日〜現在までの合計
            </p>
          </div>

          {/* Card 2: 今月のアクティビティ */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                今月のアクティビティ
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/10">
                <ActivityIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {formatCount(monthActivities)}
              </span>
              <span className="ml-1.5 text-sm font-semibold text-slate-500">
                回
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              記録されたワークアウト数
            </p>
          </div>

          {/* Card 3: 今月の運動時間 */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                今月の運動時間
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/10">
                <ClockIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {monthTime}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              移動時間の合計
            </p>
          </div>

          {/* Card 4: 今年の距離 */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                今年の距離
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/10">
                <FlameIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {formatKm(yearDistance)}
              </span>
              <span className="ml-1.5 text-sm font-semibold text-slate-500">
                km
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              本年1月1日〜現在までの年間合計
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
