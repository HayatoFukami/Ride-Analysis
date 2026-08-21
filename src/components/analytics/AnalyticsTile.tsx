import React from "react";

interface AnalyticsTileProps {
  title: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AnalyticsTile({
  title,
  description,
  badge,
  icon,
  children,
  className = "",
}: AnalyticsTileProps) {
  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md ${className}`}
    >
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FC5200] ring-1 ring-inset ring-orange-500/10">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              {badge && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
