"use client";

import React from "react";
import Link from "next/link";
import { Bus, MapPin } from "lucide-react";

export interface HoganaBrandProps {
  variant?: "dark" | "light";
  showTagline?: boolean;
  showLocation?: boolean;
  className?: string;
}

/**
 * HOGANA Unified Reusable Brand Component
 * 
 * Invariants:
 * 1. The icon and HOGANA text are ONE single clickable link wrapped in <Link href="/">.
 * 2. Clicking either navigates to / from every route.
 * 3. Preserves approved Navy (#12233F) and Teal (#0F8278) visual palette.
 * 4. Displays verified location: "Silk Board–Hebbal, Bengaluru".
 */
export default function HoganaBrand({
  variant = "light",
  showTagline = true,
  showLocation = false,
  className = ""
}: HoganaBrandProps) {
  const isDark = variant === "dark";

  return (
    <Link
      href="/"
      data-testid="hogana-brand-link"
      className={`flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F8278] rounded-lg transition-opacity hover:opacity-95 ${className}`}
      title="HOGANA — Return to Public Home"
      aria-label="HOGANA Home"
    >
      {/* Brand Icon */}
      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-[#0F8278] flex items-center justify-center text-white shadow-xs group-hover:bg-[#0c6961] transition-colors shrink-0">
        <Bus className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>

      {/* Brand Typography */}
      <div>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-lg sm:text-xl font-bold tracking-tight transition-colors ${
              isDark ? "text-white group-hover:text-slate-100" : "text-[#12233F] group-hover:text-slate-800"
            }`}
          >
            HOGANA
          </span>

          {showTagline && (
            <span
              className={`hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-[#0F8278] bg-[#EAF4F7] border border-[#0F8278]/25 px-2 py-0.5 rounded`}
            >
              Mobility Intelligence
            </span>
          )}
        </div>

        {showLocation && (
          <div
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              isDark ? "text-slate-300" : "text-slate-500"
            }`}
          >
            <MapPin className="h-3 w-3 text-[#0F8278] shrink-0" />
            <span className="font-medium">Silk Board–Hebbal, Bengaluru</span>
          </div>
        )}
      </div>
    </Link>
  );
}
