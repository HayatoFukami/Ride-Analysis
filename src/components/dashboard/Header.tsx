"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { StravaLogo, LogoutIcon, UserIcon, SpinnerIcon } from "../ui/Icons";

export interface Athlete {
  id: string;
  displayName: string;
  profile?: string;
}

interface HeaderProps {
  athlete: Athlete | null;
  isLoading?: boolean;
}

export function Header({ athlete, isLoading = false }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setLogoutError(null);
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok || res.status === 401 || res.status === 404) {
        // Successful logout or session already gone
        router.push("/login");
        router.refresh();
      } else {
        setLogoutError("ログアウトに失敗しました");
        setIsLoggingOut(false);
      }
    } catch {
      // Fallback redirect even on network drop
      router.push("/login");
    }
  };

  const fullName = athlete?.displayName || "Athlete";
  const avatarUrl = athlete?.profile;
  const isDefaultAvatar =
    !avatarUrl ||
    avatarUrl.includes("avatar/athlete/large.png") ||
    avatarUrl.includes("avatar/athlete/medium.png");

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FC5200] text-white shadow-sm shadow-[#FC5200]/30 transition-transform hover:scale-105">
            <StravaLogo className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Strava Dashboard
              </span>
              <span className="hidden rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-[#FC5200] ring-1 ring-inset ring-[#FC5200]/20 sm:inline-block">
                MVP
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
              パーソナル統計・機材別分析
            </p>
          </div>
        </div>

        {/* Right Section: Athlete & Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isLoading ? (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="h-9 w-9 rounded-full bg-slate-200" />
              <div className="hidden flex-col gap-1 sm:flex">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-3 w-16 rounded bg-slate-200" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative">
                {avatarUrl && !isDefaultAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-9 w-9 rounded-full border border-slate-200 object-cover shadow-sm ring-2 ring-white"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-2 ring-white">
                    <UserIcon className="h-5 w-5" />
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight text-slate-800">
                  {fullName}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Strava接続中
                </p>
              </div>
            </div>
          )}

          <div className="h-5 w-px bg-slate-200" />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 focus:outline-none focus:ring-2 focus:ring-[#FC5200]/20 disabled:cursor-not-allowed disabled:opacity-50"
            title="ログアウト"
          >
            {isLoggingOut ? (
              <>
                <SpinnerIcon className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">ログアウト中...</span>
              </>
            ) : (
              <>
                <LogoutIcon className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>ログアウト</span>
              </>
            )}
          </button>
        </div>
      </div>
      {logoutError && (
        <div className="bg-rose-50 px-4 py-1.5 text-center text-xs font-medium text-rose-700">
          {logoutError}
        </div>
      )}
    </header>
  );
}
