import React from "react";
import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import Button from "./Button";

interface StateFeedbackProps {
  type: "empty" | "loading" | "error";
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function StateFeedback({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}: StateFeedbackProps) {
  if (type === "loading") {
    return (
      <div
        className={`bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3 ${className}`}
      >
        <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        <h3 className="text-sm font-bold text-slate-800">
          {title || "Loading operational data..."}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
    );
  }

  if (type === "error") {
    return (
      <div
        className={`bg-rose-50/50 rounded-xl border border-rose-200 p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-3 ${className}`}
      >
        <div className="p-2.5 rounded-full bg-rose-100 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-rose-950">
          {title || "Operational Data Error"}
        </h3>
        <p className="text-xs text-rose-800 max-w-md leading-relaxed">
          {description || "Unable to retrieve operational metrics. Please check network or reload."}
        </p>
        {onAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            {actionLabel || "Retry"}
          </Button>
        )}
      </div>
    );
  }

  // Empty state
  return (
    <div
      className={`bg-white rounded-xl border border-dashed border-slate-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-2.5 ${className}`}
    >
      <div className="p-2.5 rounded-full bg-slate-100 text-slate-400">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">
        {title || "No records observed"}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
        {description || "No anomalies or observations match the selected criteria."}
      </p>
      {onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel || "Reset filter"}
        </Button>
      )}
    </div>
  );
}
