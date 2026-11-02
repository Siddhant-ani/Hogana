import React from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  benchmark?: string;
  status?: "optimal" | "warning" | "alert" | "neutral";
  statusText?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export default function KpiCard({
  label,
  value,
  subValue,
  benchmark,
  status = "neutral",
  statusText,
  icon,
  hint
}: KpiCardProps) {
  const statusStyles = {
    optimal: {
      border: "border-slate-200 hover:border-teal-300",
      pill: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dot: "bg-emerald-500"
    },
    warning: {
      border: "border-amber-200 bg-amber-50/20",
      pill: "bg-amber-50 text-amber-900 border-amber-200",
      dot: "bg-amber-500"
    },
    alert: {
      border: "border-rose-200 bg-rose-50/20",
      pill: "bg-rose-50 text-rose-900 border-rose-200",
      dot: "bg-rose-500"
    },
    neutral: {
      border: "border-slate-200 hover:border-slate-300",
      pill: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-400"
    }
  }[status];

  return (
    <div
      className={`bg-white rounded-xl border p-4 sm:p-5 shadow-xs transition-colors flex flex-col justify-between ${statusStyles.border}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </span>
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-slate-900">
            {value}
          </span>
          {subValue && (
            <span className="text-xs font-medium text-slate-500">
              {subValue}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
        <span className="text-slate-500 truncate" title={benchmark || hint}>
          {benchmark || hint || "Corridor Benchmark"}
        </span>
        {statusText && (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border shrink-0 ${statusStyles.pill}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusStyles.dot}`} />
            {statusText}
          </span>
        )}
      </div>
    </div>
  );
}
