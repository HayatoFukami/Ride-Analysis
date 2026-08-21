"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { GearDistanceResponse, GearItemResponse } from "@/types/api";
import { MaterialIcon } from "../ui/Icon";
import { readApiError, type ApiErrorInfo } from "../dashboard/api";

interface GearDistanceCardProps {
  gears: GearItemResponse[];
  isLoadingGears?: boolean;
  gearsError?: string | null;
  onRefreshGears?: () => void;
}

type PresetType =
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_30_days"
  | "custom";

const PRESETS: { id: PresetType; label: string }[] = [
  { id: "this_month", label: "今月" },
  { id: "last_month", label: "先月" },
  { id: "this_year", label: "今年" },
  { id: "last_30_days", label: "過去30日" },
  { id: "custom", label: "カスタム" },
];

function formatDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getPresetDates(preset: Exclude<PresetType, "custom">): {
  from: string;
  to: string;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (preset) {
    case "this_month": {
      const from = new Date(year, month, 1);
      const to = new Date(year, month + 1, 0);
      return { from: formatDateIso(from), to: formatDateIso(to) };
    }
    case "last_month": {
      const from = new Date(year, month - 1, 1);
      const to = new Date(year, month, 0);
      return { from: formatDateIso(from), to: formatDateIso(to) };
    }
    case "this_year": {
      const from = new Date(year, 0, 1);
      const to = new Date(year, 11, 31);
      return { from: formatDateIso(from), to: formatDateIso(to) };
    }
    case "last_30_days": {
      const to = new Date();
      const from = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      return { from: formatDateIso(from), to: formatDateIso(to) };
    }
  }
}

function gearTypeLabel(type: GearItemResponse["type"]): string {
  return type === "bike" ? "バイク" : type === "shoes" ? "シューズ" : "";
}

export function GearDistanceCard({
  gears,
  isLoadingGears = false,
  gearsError = null,
  onRefreshGears,
}: GearDistanceCardProps) {
  const router = useRouter();

  const [activePreset, setActivePreset] = useState<PresetType>("this_month");
  const [fromDate, setFromDate] = useState<string>(
    () => getPresetDates("this_month").from
  );
  const [toDate, setToDate] = useState<string>(
    () => getPresetDates("this_month").to
  );
  const [selectedGearId, setSelectedGearId] = useState<string>("all");

  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<GearDistanceResponse | null>(null);
  const [apiError, setApiError] = useState<ApiErrorInfo | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  const dateValidationError = useMemo(() => {
    if (!fromDate) return "開始日（From）を入力してください。";
    if (!toDate) return "終了日（To）を入力してください。";
    if (fromDate > toDate) {
      return "開始日は終了日以前の日付を指定してください。";
    }
    return null;
  }, [fromDate, toDate]);

  const isValid = !dateValidationError;

  const handleSelectPreset = (preset: PresetType) => {
    setActivePreset(preset);
    if (preset !== "custom") {
      const dates = getPresetDates(preset);
      setFromDate(dates.from);
      setToDate(dates.to);
    }
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromDate(e.target.value);
    setActivePreset("custom");
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToDate(e.target.value);
    setActivePreset("custom");
  };

  const handleCalculate = async () => {
    if (!isValid || isCalculating) return;

    try {
      setIsCalculating(true);
      setApiError(null);

      const params = new URLSearchParams({ from: fromDate, to: toDate });
      if (selectedGearId && selectedGearId !== "all") {
        params.append("gearId", selectedGearId);
      }

      const res = await fetch(
        `/api/analytics/gear-distance?${params.toString()}`
      );

      if (!res.ok) {
        const info = await readApiError(res, "集計に失敗しました。");
        setApiError(info);
        setResult(null);
        setHasCalculated(true);
        return;
      }

      const data: GearDistanceResponse = await res.json();
      setResult(data);
      setHasCalculated(true);
    } catch {
      setApiError({
        kind: "network",
        message: "Stravaからデータを取得できませんでした。",
        code: "NETWORK",
        status: null,
      });
      setResult(null);
      setHasCalculated(true);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReconnect = () => {
    router.push("/login?reason=reconnect");
  };

  const selectedGearName = useMemo(() => {
    if (!selectedGearId || selectedGearId === "all") return "すべての機材";
    return gears.find((g) => g.id === selectedGearId)?.name || selectedGearId;
  }, [gears, selectedGearId]);

  const controlsDisabled = isCalculating;

  return (
    <div className="flex flex-col gap-5">
      {/* Date presets */}
      <div>
        <span
          id="preset-label"
          className="mb-1.5 block text-xs font-medium text-on-surface-variant"
        >
          期間プリセット
        </span>
        <div
          role="group"
          aria-labelledby="preset-label"
          className="flex flex-wrap gap-1.5"
        >
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={activePreset === preset.id}
              disabled={controlsDisabled}
              onClick={() => handleSelectPreset(preset.id)}
              className="m3-chip"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3.5">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="from-date"
              className="mb-1.5 block text-xs font-medium text-on-surface-variant"
            >
              開始日（From）
            </label>
            <input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={handleFromChange}
              disabled={controlsDisabled}
              className="m3-field"
            />
          </div>
          <div>
            <label
              htmlFor="to-date"
              className="mb-1.5 block text-xs font-medium text-on-surface-variant"
            >
              終了日（To）
            </label>
            <input
              id="to-date"
              type="date"
              value={toDate}
              onChange={handleToChange}
              disabled={controlsDisabled}
              className="m3-field"
            />
          </div>
        </div>

        {dateValidationError && (
          <div
            role="alert"
            className="m3-alert m3-alert--error py-2.5 text-sm"
          >
            <MaterialIcon name="error" size={18} className="mt-0.5 shrink-0" aria-hidden />
            <p>{dateValidationError}</p>
          </div>
        )}

        {/* Gear select */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="gear-select"
              className="text-xs font-medium text-on-surface-variant"
            >
              対象機材（Gear）
            </label>
            {gearsError && onRefreshGears && (
              <button
                type="button"
                onClick={onRefreshGears}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <MaterialIcon name="refresh" size={14} aria-hidden />
                <span>機材リスト再読込</span>
              </button>
            )}
          </div>

          {gearsError ? (
            <div className="m3-alert m3-alert--error py-2.5 text-sm">
              <MaterialIcon name="error" size={18} className="mt-0.5 shrink-0" aria-hidden />
              <p>{gearsError}</p>
            </div>
          ) : (
            <div className="relative">
              <select
                id="gear-select"
                value={selectedGearId}
                onChange={(e) => setSelectedGearId(e.target.value)}
                disabled={controlsDisabled || isLoadingGears}
                className="m3-field m3-select"
              >
                <option value="all">すべての機材（All Gear）</option>
                {gears.map((gear) => (
                  <option key={gear.id} value={gear.id}>
                    {gear.name}
                    {gearTypeLabel(gear.type) ? `（${gearTypeLabel(gear.type)}）` : ""}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-on-surface-variant">
                <MaterialIcon name="expand_more" size={18} aria-hidden />
              </span>
            </div>
          )}

          {!gearsError && !isLoadingGears && gears.length === 0 && (
            <p className="mt-1.5 text-xs text-on-surface-variant">
              登録されている機材がありません。「すべての機材」で集計できます。
            </p>
          )}
        </div>

        {/* Calculate action */}
        <button
          type="button"
          onClick={handleCalculate}
          disabled={!isValid || isCalculating}
          className="m3-button m3-button--md m3-button--primary w-full"
        >
          {isCalculating ? (
            <>
              <MaterialIcon name="timer" size={18} aria-hidden />
              <span>集計中...</span>
            </>
          ) : (
            <>
              <MaterialIcon name="arrow_forward" size={18} aria-hidden />
              <span>距離を計算する</span>
            </>
          )}
        </button>
      </div>

      {/* Outcome area */}
      <div aria-live="polite">
        {isCalculating && (
          <div className="flex flex-col items-center gap-3 rounded-medium border border-outline-variant bg-surface-container-low p-6 text-center">
            <div
              className="m3-progress"
              role="progressbar"
              aria-label="集計中"
            >
              <div className="m3-progress__bar" />
            </div>
            <p className="text-sm font-medium text-on-surface">
              Stravaからアクティビティを取得して集計しています...
            </p>
          </div>
        )}

        {!isCalculating && apiError && (
          <div className="m3-alert m3-alert--error">
            <MaterialIcon name="error" size={20} className="mt-0.5 shrink-0" aria-hidden />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {apiError.kind === "auth"
                  ? "認証エラー"
                  : apiError.kind === "rate_limit"
                  ? "利用制限"
                  : "集計エラー"}
              </p>
              <p className="mt-1 text-sm leading-relaxed opacity-90">
                {apiError.message}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {apiError.kind === "auth" ? (
                  <button
                    type="button"
                    onClick={handleReconnect}
                    className="m3-button m3-button--md m3-button--strava"
                  >
                    <span>Stravaに再接続する</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCalculate}
                    className="m3-button m3-button--md bg-secondary-container text-on-secondary-container hover:bg-surface-container-high"
                  >
                    <MaterialIcon name="refresh" size={18} aria-hidden />
                    <span>もう一度試す</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!isCalculating && !apiError && hasCalculated && result && (
          <ResultView
            result={result}
            fallbackGearName={selectedGearName}
            fallbackFrom={fromDate}
            fallbackTo={toDate}
          />
        )}

        {!isCalculating && !apiError && !hasCalculated && (
          <div className="flex flex-col items-center gap-3 rounded-medium border border-dashed border-outline-variant bg-surface-container-low p-6 text-center">
            <MaterialIcon
              name="info"
              size={24}
              className="text-on-surface-variant"
              aria-hidden
            />
            <p className="text-sm text-on-surface-variant">
              期間と機材を選択して「距離を計算する」を押してください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ResultViewProps {
  result: GearDistanceResponse;
  fallbackGearName: string;
  fallbackFrom: string;
  fallbackTo: string;
}

function ResultView({
  result,
  fallbackGearName,
  fallbackFrom,
  fallbackTo,
}: ResultViewProps) {
  const gearName = result.gear?.name || fallbackGearName;
  const from = result.period?.from || fallbackFrom;
  const to = result.period?.to || fallbackTo;

  if (result.activityCount === 0) {
    // Intentional no-results state (spec §23) — not an error.
    return (
      <div className="flex flex-col items-center gap-3 rounded-medium border border-outline-variant bg-surface-container-low p-6 text-center">
        <MaterialIcon
          name="info"
          size={24}
          className="text-on-surface-variant"
          aria-hidden
        />
        <p className="text-sm font-semibold text-on-surface">
          No activities found
        </p>
        <p className="text-sm text-on-surface-variant">
          この期間・機材に一致するアクティビティはありません。
        </p>
        <span className="rounded-small border border-outline-variant bg-surface px-3 py-1 text-xs text-on-surface-variant">
          {from} 〜 {to} · {gearName}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-medium border border-outline-variant bg-surface-container-low p-5">
      <div className="flex items-start justify-between gap-3 border-b border-outline-variant pb-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-on-surface">
            {gearName}
          </p>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            {from} 〜 {to}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-medium text-on-secondary-container">
          <MaterialIcon name="check_circle" size={14} aria-hidden />
          <span>集計完了</span>
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-on-surface-variant">合計走行距離</p>
        <div className="mt-1 flex items-baseline">
          <span className="text-3xl font-semibold tracking-tight text-on-surface">
            {result.distanceKilometers.toLocaleString("ja-JP", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
          <span className="ml-1.5 text-base font-medium text-on-surface-variant">
            km
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-outline-variant pt-4">
        <div>
          <p className="text-xs text-on-surface-variant">アクティビティ数</p>
          <p className="mt-1 text-lg font-semibold text-on-surface">
            {result.activityCount.toLocaleString("ja-JP")}
            <span className="ml-1 text-sm font-medium text-on-surface-variant">回</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant">平均距離</p>
          <p className="mt-1 text-lg font-semibold text-on-surface">
            {result.averageDistanceKilometers.toLocaleString("ja-JP", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            <span className="ml-1 text-sm font-medium text-on-surface-variant">
              km / 回
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
