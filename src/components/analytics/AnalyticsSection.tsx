"use client";

import React from "react";
import type { GearItemResponse } from "@/types/api";
import { AnalyticsTile } from "./AnalyticsTile";
import { GearDistanceCard } from "./GearDistanceCard";

interface AnalyticsSectionProps {
  gears: GearItemResponse[];
  isLoadingGears: boolean;
  gearsError: string | null;
  onRefreshGears?: () => void;
}

/**
 * Analytics grid. Currently hosts a single real tile (Gear Distance); the grid
 * is 1 column on mobile and supports 2–3 columns on desktop so future tiles
 * slot in without layout changes. No placeholder/Coming Soon tiles are shown.
 */
export function AnalyticsSection({
  gears,
  isLoadingGears,
  gearsError,
  onRefreshGears,
}: AnalyticsSectionProps) {
  return (
    <section aria-labelledby="analytics-heading">
      <div className="mb-4">
        <h2
          id="analytics-heading"
          className="text-lg font-semibold tracking-tight text-on-surface"
        >
          Analytics
        </h2>
        <p className="mt-0.5 text-sm text-on-surface-variant">
          機材別・期間ごとのアクティビティを分析します
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsTile
          title="Gear Distance"
          description="指定した期間に、選択した機材で走った距離を確認します。"
          icon="directions_bike"
        >
          <GearDistanceCard
            gears={gears}
            isLoadingGears={isLoadingGears}
            gearsError={gearsError}
            onRefreshGears={onRefreshGears}
          />
        </AnalyticsTile>
      </div>
    </section>
  );
}
