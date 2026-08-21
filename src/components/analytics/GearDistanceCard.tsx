"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { GearDistanceResponse, GearItemResponse } from "@/types/api";
import {
  LayersIcon,
  ActivityIcon,
  AlertCircleIcon,
  SpinnerIcon,
  CheckCircleIcon,
  RefreshIcon,
  InfoIcon,
  LogoutIcon,
} from "../ui/Icons";

interface GearDistanceCardProps {
  gears: GearItemResponse[];
  isLoadingGears?: boolean;
  gearsError?: string | null;
  onRefreshGears?: () => void;
}

type PresetType = "this_month" | "last_month" | "this_year" | "last_30_days" | "custom";

function formatDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getPresetDates(preset: PresetType): { from: string; to: string } {
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
    default:
      return { from: "", to: "" };
  }
}

export function GearDistanceCard({
  gears,
  isLoadingGears = false,
  gearsError = null,
  onRefreshGears,
}: GearDistanceCardProps) {
  const router = useRouter();

  // Preset & Form State
  const [activePreset, setActivePreset] = useState<PresetType>("this_month");
  const [fromDate, setFromDate] = useState<string>(() => getPresetDates("this_month").from);
  const [toDate, setToDate] = useState<string>(() => getPresetDates("this_month").to);
  const [selectedGearId, setSelectedGearId] = useState<string>("");

  // Calculation state
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [result, setResult] = useState<GearDistanceResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState<boolean>(false);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  // Validation
  const dateValidationError = useMemo(() => {
    if (!fromDate) return "開始日（From）を入力してください。";
    if (!toDate) return "終了日（To）を入力してください。";
    if (fromDate > toDate) {
      return "開始日は終了日以前の日付を指定してください。";
    }
    return null;
  }, [fromDate, toDate]);

  const isValid = !dateValidationError;

  // Handle preset change
  const handleSelectPreset = (preset: PresetType) => {
    setActivePreset(preset);
    if (preset !== "custom") {
      const dates = getPresetDates(preset);
      setFromDate(dates.from);
      setToDate(dates.to);
    }
  };

  // Handle manual date change
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromDate(e.target.value);
    setActivePreset("custom");
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToDate(e.target.value);
    setActivePreset("custom");
  };

  // Perform Calculation
  const handleCalculate = useCallback(async () => {
    if (!isValid || isCalculating) return;

    try {
      setIsCalculating(true);
      setErrorMessage(null);
      setIsAuthError(false);

      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
      });

      if (selectedGearId && selectedGearId !== "all") {
        params.append("gearId", selectedGearId);
      }

      const res = await fetch(`/api/analytics/gear-distance?${params.toString()}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorCode = errorData?.error?.code;

        if (res.status === 401 || errorCode === "AUTHENTICATION") {
          setIsAuthError(true);
          throw new Error("Stravaとの接続が切れています。再接続してください。");
        }
        if (res.status === 429 || errorCode === "RATE_LIMIT") {
          throw new Error("Strava APIの利用制限に達しました。時間を空けて再度試してください。");
        }
        if (res.status >= 500 || errorCode === "UPSTREAM") {
          throw new Error("Stravaからデータを取得できませんでした。");
        }
        throw new Error(
          errorData?.error?.message || errorData?.message || "予期しないエラーが発生しました。"
        );
      }

      const data: GearDistanceResponse = await res.json();
      setResult(data);
      setHasCalculated(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Stravaからデータを取得できませんでした。");
      }
      setResult(null);
      setHasCalculated(true);
    } finally {
      setIsCalculating(false);
    }
  }, [fromDate, toDate, selectedGearId, isValid, isCalculating]);

  const handleReconnect = () => {
    router.push("/login?reason=reconnect");
  };

  const selectedGearName = useMemo(() => {
    if (!selectedGearId || selectedGearId === "all") {
      return "すべての機材 (All Gear)";
    }
    const gear = gears.find((g) => g.id === selectedGearId);
    return gear?.name || selectedGearId;
  }, [gears, selectedGearId]);

  return (
    <div className="flex flex-col h-full">
      {/* Description */}
      <p className="text-xs text-slate-500 mb-5 leading-relaxed">
        指定した期間に、選択した機材で走った距離・アクティビティ数を集計します。
      </p>

      {/* Date Presets */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
          期間プリセット
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleSelectPreset("this_month")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              activePreset === "this_month"
                ? "bg-[#FC5200] text-white shadow-sm shadow-[#FC5200]/20"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            今月
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("last_month")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              activePreset === "last_month"
                ? "bg-[#FC5200] text-white shadow-sm shadow-[#FC5200]/20"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            先月
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("this_year")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              activePreset === "this_year"
                ? "bg-[#FC5200] text-white shadow-sm shadow-[#FC5200]/20"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            今年
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("last_30_days")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              activePreset === "last_30_days"
                ? "bg-[#FC5200] text-white shadow-sm shadow-[#FC5200]/20"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            過去30日
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("custom")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              activePreset === "custom"
                ? "bg-slate-800 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            カスタム
          </button>
        </div>
      </div>

      {/* Form Fields: From, To, Gear */}
      <div className="mb-5 space-y-3.5 rounded-xl bg-slate-50/80 p-4 border border-slate-200/60">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* From Input */}
          <div>
            <label
              htmlFor="from-date"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              開始日 (From)
            </label>
            <div className="relative">
              <input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={handleFromChange}
                disabled={isCalculating}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm transition focus:border-[#FC5200] focus:outline-none focus:ring-2 focus:ring-[#FC5200]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* To Input */}
          <div>
            <label
              htmlFor="to-date"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              終了日 (To)
            </label>
            <div className="relative">
              <input
                id="to-date"
                type="date"
                value={toDate}
                onChange={handleToChange}
                disabled={isCalculating}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm transition focus:border-[#FC5200] focus:outline-none focus:ring-2 focus:ring-[#FC5200]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Validation error notice */}
        {dateValidationError && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            <span>{dateValidationError}</span>
          </div>
        )}

        {/* Gear Select */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label
              htmlFor="gear-select"
              className="block text-xs font-medium text-slate-700"
            >
              対象機材 (Gear)
            </label>
            {gearsError && onRefreshGears && (
              <button
                type="button"
                onClick={onRefreshGears}
                className="text-[11px] text-rose-600 hover:underline inline-flex items-center gap-1"
              >
                <RefreshIcon className="h-3 w-3" />
                機材リスト再読込
              </button>
            )}
          </div>

          <div className="relative">
            <select
              id="gear-select"
              value={selectedGearId}
              onChange={(e) => setSelectedGearId(e.target.value)}
              disabled={isCalculating || isLoadingGears}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-xs font-medium text-slate-900 shadow-sm transition focus:border-[#FC5200] focus:outline-none focus:ring-2 focus:ring-[#FC5200]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">すべての機材 (All Gear)</option>
              {gears.map((gear) => (
                <option key={gear.id} value={gear.id}>
                  {gear.name}
                  {gear.type === "bike" ? " (バイク)" : gear.type === "shoes" ? " (シューズ)" : ""}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <LayersIcon className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Calculate Action */}
        <button
          type="button"
          onClick={handleCalculate}
          disabled={!isValid || isCalculating}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#FC5200] px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-[#FC5200]/30 transition hover:bg-[#E04800] focus:outline-none focus:ring-2 focus:ring-[#FC5200]/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCalculating ? (
            <>
              <SpinnerIcon className="h-4 w-4" />
              <span>走行距離を集計中...</span>
            </>
          ) : (
            <>
              <ActivityIcon className="h-4 w-4" />
              <span>距離を計算する (Calculate)</span>
            </>
          )}
        </button>
      </div>

      {/* Outcome / Result / Empty / Error States */}
      <div className="flex-1">
        {isCalculating && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center animate-pulse">
            <SpinnerIcon className="h-8 w-8 text-[#FC5200]" />
            <p className="mt-3 text-xs font-semibold text-slate-700">
              Stravaからアクティビティを取得して集計しています...
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              ※ 複数ページのアクティビティも自動で集約します
            </p>
          </div>
        )}

        {!isCalculating && errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-slate-800">
            <div className="flex items-start gap-3">
              <AlertCircleIcon className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-rose-900">
                  {isAuthError ? "認証エラー" : "集計エラー"}
                </h4>
                <p className="mt-0.5 text-xs text-rose-700 leading-relaxed">
                  {errorMessage}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {isAuthError ? (
                    <button
                      type="button"
                      onClick={handleReconnect}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#FC5200] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#E04800]"
                    >
                      <LogoutIcon className="h-3.5 w-3.5" />
                      Stravaに再接続する
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCalculate}
                      className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-50"
                    >
                      <RefreshIcon className="h-3 w-3" />
                      もう一度試す
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isCalculating && !errorMessage && hasCalculated && result && (
          <div>
            {result.activityCount === 0 ? (
              // Empty State (Spec Section 23)
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/70 text-slate-500">
                  <InfoIcon className="h-5 w-5" />
                </div>
                <h4 className="mt-2 text-xs font-bold text-slate-800">
                  No activities found
                </h4>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  この期間・機材に一致するアクティビティはありません。
                </p>
                <div className="mt-3 rounded-md bg-white px-3 py-1 text-[11px] font-medium text-slate-600 border border-slate-200">
                  {fromDate} 〜 {toDate} · {selectedGearName}
                </div>
              </div>
            ) : (
              // Successful Result (Spec Section 22)
              <div className="overflow-hidden rounded-xl border border-orange-200/80 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/30 p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                  <div>
                    <span className="text-xs font-semibold text-[#FC5200]">
                      {result.gear?.name || selectedGearName}
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {result.period?.from || fromDate} 〜 {result.period?.to || toDate}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    <CheckCircleIcon className="h-3 w-3 text-emerald-600" />
                    集計完了
                  </span>
                </div>

                <div className="mt-4">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    合計走行距離
                  </span>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                      {result.distanceKilometers.toLocaleString("ja-JP", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </span>
                    <span className="ml-2 text-base font-bold text-slate-600">
                      km
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-orange-100/80 pt-3">
                  <div className="rounded-lg bg-white/80 p-2.5 border border-slate-200/60">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      アクティビティ数
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {result.activityCount.toLocaleString("ja-JP")}
                    </span>
                    <span className="ml-1 text-xs text-slate-500">回</span>
                  </div>

                  <div className="rounded-lg bg-white/80 p-2.5 border border-slate-200/60">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      平均距離
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {result.averageDistanceKilometers.toLocaleString("ja-JP", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </span>
                    <span className="ml-1 text-xs text-slate-500">km / 回</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isCalculating && !errorMessage && !hasCalculated && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/60 text-slate-400">
              <InfoIcon className="h-5 w-5" />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600">
              期間と機材を選択して「距離を計算する」をクリックしてください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
