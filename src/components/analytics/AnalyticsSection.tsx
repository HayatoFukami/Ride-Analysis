"use client";

import React from "react";
import type { GearItemResponse } from "@/types/api";
import { AnalyticsTile } from "./AnalyticsTile";
import { GearDistanceCard } from "./GearDistanceCard";
import { BikeIcon, LayersIcon } from "../ui/Icons";

interface AnalyticsSectionProps {
  gears: GearItemResponse[];
  isLoadingGears: boolean;
  gearsError: string | null;
  onRefreshGears?: () => void;
}

export function AnalyticsSection({
  gears,
  isLoadingGears,
  gearsError,
  onRefreshGears,
}: AnalyticsSectionProps) {
  return (
    <section className="mb-12">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">Analytics</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            分析タイル
          </span>
        </div>
        <p className="text-xs text-slate-500">
          機材別や期間ごとのアクティビティを深掘りして分析します
        </p>
      </div>

      {/* Extensible Grid Layout: 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Core MVP Feature Tile: Gear Distance */}
        <AnalyticsTile
          title="Gear Distance"
          description="機材ごとの走行距離と利用頻度を集計"
          badge="MVP"
          icon={<BikeIcon className="h-5 w-5" />}
        >
          <GearDistanceCard
            gears={gears}
            isLoadingGears={isLoadingGears}
            gearsError={gearsError}
            onRefreshGears={onRefreshGears}
          />
        </AnalyticsTile>

        {/* Extensible Future Tile 1: Monthly Trends (Preview / Placeholder) */}
        <AnalyticsTile
          title="Monthly Trends"
          description="月ごとの走行距離推移と前年同月比較"
          badge="Coming Soon"
          icon={<LayersIcon className="h-5 w-5 text-slate-400" />}
          className="bg-slate-50/50 border-dashed border-slate-300"
        >
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center min-h-[320px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <LayersIcon className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-semibold text-slate-800">
              月間推移・トレンド分析
            </h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500 leading-relaxed">
              月別の走行距離・獲得標高・運動時間をグラフで可視化し、トレーニングの傾向を把握できるタイルを追加予定です。
            </p>
            <span className="mt-4 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              タイル構造により拡張可能
            </span>
          </div>
        </AnalyticsTile>
      </div>
    </section>
  );
}
