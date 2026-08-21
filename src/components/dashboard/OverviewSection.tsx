"use client";

import React from "react";
import { MaterialIcon, type IconName } from "../ui/Icon";

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

interface Metric {
  key: string;
  label: string;
  icon: IconName;
  value: string;
  unit?: string;
  caption: string;
}

function formatKm(km: number): string {
  return km.toLocaleString("ja-JP", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatCount(count: number): string {
  return count.toLocaleString("ja-JP");
}

function formatMovingTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function buildMetrics(stats: OverviewStats): Metric[] {
  return [
    {
      key: "month-distance",
      label: "今月の距離",
      icon: "calendar",
      value: formatKm(stats.monthDistanceKilometers),
      unit: "km",
      caption: "当月1日〜現在までの合計",
    },
    {
      key: "month-count",
      label: "今月のアクティビティ",
      icon: "activity",
      value: formatCount(stats.monthActivityCount),
      unit: "回",
      caption: "記録されたワークアウト数",
    },
    {
      key: "month-time",
      label: "今月の運動時間",
      icon: "schedule",
      value: formatMovingTime(stats.monthMovingTimeSeconds),
      caption: "移動時間の合計",
    },
    {
      key: "year-distance",
      label: "今年の距離",
      icon: "trending_up",
      value: formatKm(stats.yearDistanceKilometers),
      unit: "km",
      caption: "本年1月1日〜現在までの年間合計",
    },
  ];
}

export function OverviewSection({
  stats,
  isLoading,
  error,
  onRetry,
}: OverviewSectionProps) {
  return (
    <section aria-labelledby="overview-heading">
      <div className="mb-4">
        <h2
          id="overview-heading"
          className="text-lg font-semibold tracking-tight text-on-surface"
        >
          アクティビティ概要
        </h2>
        <p className="mt-0.5 text-sm text-on-surface-variant">
          Stravaデータに基づく今月・今年の実績サマリー
        </p>
      </div>

      {error ? (
        <div className="m3-alert m3-alert--error">
          <MaterialIcon name="error" size={20} className="mt-0.5 shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-semibold">基本統計データを取得できませんでした</p>
            <p className="mt-1 text-sm leading-relaxed opacity-90">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="m3-button m3-button--md mt-3 bg-secondary-container text-on-secondary-container hover:bg-surface-container-high"
              >
                <MaterialIcon name="refresh" size={18} aria-hidden />
                <span>再試行する</span>
              </button>
            )}
          </div>
        </div>
      ) : isLoading || !stats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="m3-card p-5">
              <div className="m3-skeleton h-4 w-24" />
              <div className="mt-4 flex items-baseline gap-2">
                <div className="m3-skeleton h-8 w-24" />
                <div className="m3-skeleton h-4 w-8" />
              </div>
              <div className="m3-skeleton mt-3 h-3 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {buildMetrics(stats).map((metric) => (
            <div key={metric.key} className="m3-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-on-surface-variant">
                  {metric.label}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                  <MaterialIcon name={metric.icon} size={18} aria-hidden />
                </span>
              </div>
              <div className="mt-4 flex items-baseline">
                <span className="text-2xl font-semibold tracking-tight text-on-surface">
                  {metric.value}
                </span>
                {metric.unit && (
                  <span className="ml-1.5 text-sm font-medium text-on-surface-variant">
                    {metric.unit}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">{metric.caption}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
