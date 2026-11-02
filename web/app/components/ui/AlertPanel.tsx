import React from "react";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface AlertPanelProps {
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  description: string;
  location?: string;
  metrics?: Array<{ label: string; value: string }>;
  action?: React.ReactNode;
  disclaimer?: string;
}

export default function AlertPanel({
  severity,
  title,
  description,
  location,
  metrics,
  action,
  disclaimer
}: AlertPanelProps) {
  const config = {
    critical: {
      container: "border-rose-200 bg-rose-50/40 text-rose-950",
      icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
      badge: "bg-rose-100 text-rose-900 border-rose-300",
      badgeText: "Critical Alert"
    },
    warning: {
      container: "border-amber-200 bg-amber-50/40 text-amber-950",
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
      badge: "bg-amber-100 text-amber-900 border-amber-300",
      badgeText: "Operational Warning"
    },
    info: {
      container: "border-teal-200 bg-teal-50/30 text-teal-950",
      icon: <Info className="h-5 w-5 text-teal-600 shrink-0" />,
      badge: "bg-teal-100 text-teal-900 border-teal-200",
      badgeText: "Advisory Intel"
    },
    success: {
      container: "border-emerald-200 bg-emerald-50/30 text-emerald-950",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
      badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
      badgeText: "Nominal Regularity"
    }
  }[severity];

  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-all shadow-xs ${config.container}`}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="flex items-start gap-3 max-w-3xl">
          <div className="mt-0.5">{config.icon}</div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${config.badge}`}>
                {config.badgeText}
              </span>
              {location && (
                <span className="text-xs font-semibold text-slate-700 bg-white/80 border border-slate-200 px-2 py-0.5 rounded">
                  {location}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 pt-0.5">{title}</h3>
            <p className="text-xs text-slate-700 leading-relaxed">{description}</p>
          </div>
        </div>

        {action && <div className="shrink-0 pt-2 md:pt-0">{action}</div>}
      </div>

      {metrics && metrics.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {metrics.map((m, idx) => (
            <div key={idx} className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                {m.label}
              </span>
              <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm mt-0.5 block">
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {disclaimer && (
        <div className="mt-2.5 text-[11px] text-slate-500 italic">
          <strong>Constraint:</strong> {disclaimer}
        </div>
      )}
    </div>
  );
}
