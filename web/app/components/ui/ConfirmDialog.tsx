"use client";

import React, { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import Button from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  tone?: "primary" | "danger";
  confirmLabel?: string;
  cancelLabel?: string;
  noteValue?: string;
  onNoteChange?: (note: string) => void;
  noteRequired?: boolean;
  notePlaceholder?: string;
  noteError?: string | null;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  tone = "primary",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  noteValue = "",
  onNoteChange,
  noteRequired = false,
  notePlaceholder = "Add operational context...",
  noteError,
  isLoading = false
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl mt-0.5 ${
                tone === "danger"
                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                  : "bg-teal-50 text-teal-600 border border-teal-200"
              }`}
            >
              {tone === "danger" ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2
                id="confirm-dialog-title"
                className="text-lg font-bold text-slate-900"
              >
                {title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {onNoteChange && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Operational Justification {noteRequired && <span className="text-rose-600">*</span>}</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {noteRequired ? "Mandatory" : "Optional"}
              </span>
            </label>
            <textarea
              value={noteValue}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder={notePlaceholder}
              rows={3}
              className={`w-full text-xs font-mono p-3 rounded-lg border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                noteError
                  ? "border-rose-400 focus:ring-rose-400"
                  : "border-slate-300 focus:ring-teal-500"
              }`}
            />
            {noteError && (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{noteError}</span>
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={noteRequired && noteValue.trim().length === 0}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
