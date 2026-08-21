"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "../ui/Icon";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => setMenuOpen(false);

  // Close the menu on Escape or when clicking/tabbing outside.
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMenu();
        triggerRef.current?.focus();
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setLogoutError(null);
      closeMenu();
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok || res.status === 401 || res.status === 404) {
        // Successful logout or session already gone.
        router.push("/login");
        router.refresh();
      } else {
        setLogoutError("ログアウトに失敗しました");
        setIsLoggingOut(false);
      }
    } catch {
      // Fallback redirect even on network drop.
      router.push("/login");
    }
  };

  const fullName = athlete?.displayName || "アカウント";
  const avatarUrl = athlete?.profile;
  const isDefaultAvatar =
    !avatarUrl ||
    avatarUrl.includes("avatar/athlete/large.png") ||
    avatarUrl.includes("avatar/athlete/medium.png");

  return (
    <header className="m3-app-bar">
      <div className="m3-container flex h-14 items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <MaterialIcon name="monitoring" size={20} aria-hidden />
          </div>
          <span className="text-base font-semibold tracking-tight text-on-surface">
            Ride Analysis
          </span>
        </div>

        {/* Account disclosure */}
        <div ref={menuRef} className="relative">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-controls="account-popup"
            aria-label="アカウントメニュー"
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            {isLoading ? (
              <span className="m3-skeleton h-8 w-8 rounded-full" aria-hidden />
            ) : avatarUrl && !isDefaultAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-8 w-8 rounded-full border border-outline-variant object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <MaterialIcon name="person" size={20} aria-hidden />
              </span>
            )}
            {!isLoading && (
              <>
                <span className="hidden max-w-[10rem] truncate text-sm font-medium text-on-surface sm:inline">
                  {fullName}
                </span>
                <MaterialIcon
                  name="expand_more"
                  size={18}
                  className="text-on-surface-variant"
                  aria-hidden
                />
              </>
            )}
          </button>

          {menuOpen && (
            <div
              id="account-popup"
              aria-label="アカウントメニュー"
              className="m3-menu absolute right-0 top-full z-40 mt-2"
            >
              <a
                href="/api/auth/strava/login"
                className="m3-menu-item"
                onClick={closeMenu}
              >
                <MaterialIcon name="link" size={18} aria-hidden />
                <span>Stravaに再接続</span>
              </a>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="m3-menu-item"
              >
                <MaterialIcon name="logout" size={18} aria-hidden />
                <span>{isLoggingOut ? "ログアウト中..." : "ログアウト"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {logoutError && (
        <div
          role="alert"
          className="m3-alert m3-alert--error rounded-none border-t text-sm"
        >
          <MaterialIcon name="error" size={18} aria-hidden />
          <p>{logoutError}</p>
        </div>
      )}
    </header>
  );
}
