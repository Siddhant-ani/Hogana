import React from "react";

interface PageHeaderProps {
  badge?: string;
  badgeTone?: "teal" | "amber" | "navy" | "slate";
  corridor?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  badge,
  badgeTone = "teal",
  corridor = "Silk Board ↔ Hebbal | Bengaluru (19.8 km)",
  title,
  description,
  actions
}: PageHeaderProps) {
  const badgeClasses = {
    teal: "text-[#0F8278] bg-[#EAF4F7] border-[#0F8278]/30",
    amber: "text-[#D97706] bg-amber-50 border-amber-200",
    navy: "text-[#12233F] bg-[#EAF4F7] border-[#DCE5ED]",
    slate: "text-slate-700 bg-[#F5F7FA] border-[#DCE5ED]"
  }[badgeTone];

  return (
    <div className="bg-white rounded-xl border border-[#DCE5ED] shadow-xs p-5 sm:p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            {badge && (
              <span
                className={`text-[11px] font-bold uppercase tracking-wider border rounded px-2 py-0.5 ${badgeClasses}`}
              >
                {badge}
              </span>
            )}
            {corridor && (
              <>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-medium text-slate-600">{corridor}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12233F]">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-slate-600 leading-relaxed pt-0.5">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
