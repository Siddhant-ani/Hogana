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
      border: "border-[#DCE5ED] hover:border-[#0F8278]",
      pill: "bg-[#EAF4F7] text-[#0F8278] border-[#0F8278]/30",
      dot: "bg-[#0F8278]"
    },
    warning: {
      border: "border-[#D97706]/40 bg-amber-50/25",
      pill: "bg-amber-50 text-[#D97706] border-amber-200",
      dot: "bg-[#D97706]"
    },
    alert: {
      border: "border-[#DC2626]/40 bg-red-50/25",
      pill: "bg-red-50 text-[#DC2626] border-red-200",
      dot: "bg-[#DC2626]"
    },
    neutral: {
      border: "border-[#DCE5ED] hover:border-slate-300",
      pill: "bg-[#F5F7FA] text-[#12233F] border-[#DCE5ED]",
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
          <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-[#12233F]">
            {value}
          </span>
          {subValue && (
            <span className="text-xs font-medium text-slate-500">
              {subValue}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#DCE5ED]/60 flex items-center justify-between text-xs gap-2">
        <span className="text-slate-500 truncate" title={benchmark || hint}>
          {benchmark || hint || "Service Benchmark"}
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
