import React from "react";
import { MaterialIcon, type IconName } from "../ui/Icon";

interface AnalyticsTileProps {
  title: string;
  description?: string;
  icon: IconName;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared card shell for analytics tiles. Future tiles reuse this same surface
 * so the Analytics grid stays visually consistent (see spec §32).
 */
export function AnalyticsTile({
  title,
  description,
  icon,
  children,
  className = "",
}: AnalyticsTileProps) {
  return (
    <div className={`m3-card flex flex-col p-5 sm:p-6 ${className}`}>
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
          <MaterialIcon name={icon} size={20} aria-hidden />
        </span>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-on-surface">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-sm leading-relaxed text-on-surface-variant">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
