import React from "react";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "info"
  | "teal";

interface StatusBadgeProps {
  status: string;
  tone?: StatusTone;
  size?: "sm" | "md";
  showDot?: boolean;
}

export default function StatusBadge({
  status,
  tone,
  size = "md",
  showDot = true
}: StatusBadgeProps) {
  // Infer tone if not explicitly provided
  const resolvedTone: StatusTone = tone || (() => {
    const s = status.toLowerCase();
    if (["approved", "feasible", "optimal", "passed", "valid", "normal", "active"].includes(s)) return "success";
    if (["warning", "cleared_partial", "overcrowded", "standby"].includes(s)) return "warning";
    if (["rejected", "bunching", "bunching_persists", "alert", "severely_overcrowded", "failed", "maintenance"].includes(s)) return "danger";
    if (["unconfirmed", "proposed", "not_indicated"].includes(s)) return "info";
    return "neutral";
  })();

  const toneStyles: Record<StatusTone, { badge: string; dot: string }> = {
    success: {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dot: "bg-emerald-500"
    },
    warning: {
      badge: "bg-amber-50 text-amber-900 border-amber-200",
      dot: "bg-amber-500"
    },
    danger: {
      badge: "bg-rose-50 text-rose-900 border-rose-200",
      dot: "bg-rose-500"
    },
    info: {
      badge: "bg-blue-50 text-blue-900 border-blue-200",
      dot: "bg-blue-500"
    },
    teal: {
      badge: "bg-teal-50 text-teal-900 border-teal-200",
      dot: "bg-teal-500"
    },
    neutral: {
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-400"
    }
  };

  const sizeClasses = size === "sm" ? "px-1.5 py-0.2 text-[10px]" : "px-2.5 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-md border tracking-wide uppercase font-mono ${toneStyles[resolvedTone].badge} ${sizeClasses}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${toneStyles[resolvedTone].dot}`}
        />
      )}
      <span>{status.replace(/_/g, " ")}</span>
    </span>
  );
}
