"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  ShieldAlert,
  GitBranch,
  FileText,
  Menu,
  X,
  AlertTriangle,
  Calendar,
  MapPin,
  Bus
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Data Centre", href: "/data", icon: Database },
  { name: "Interventions", href: "/interventions", icon: ShieldAlert },
  { name: "Simulation", href: "/simulation", icon: GitBranch },
  { name: "Reports", href: "/reports", icon: FileText },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  // Root path '/' is the public marketing landing page (no operational sidebar/header)
  if (pathname === "/") {
    return <main className="flex-1 w-full">{children}</main>;
  }

  return (
    <>
      {/* Top Application Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-4 py-3 shrink-0 shadow-sm z-30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Identity & Corridor */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded bg-teal-600 flex items-center justify-center font-bold text-white tracking-wider shadow-inner">
                  <Bus className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold tracking-tight text-white">
                      HOGANA
                    </span>
                    <span className="hidden sm:inline-block text-xs font-medium text-teal-300 tracking-wide">
                      Smart Bus Operations & Mobility Intelligence
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <MapPin className="h-3 w-3 text-teal-400 shrink-0" />
                    <span className="font-medium text-slate-200">Silk Board ↔ Hebbal</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-300">Bengaluru</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile menu toggle badge */}
            <div className="lg:hidden flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-200 bg-amber-950/70 border border-amber-800/80 rounded px-2 py-0.5">
                <Calendar className="h-2.5 w-2.5" />
                10 Mar 2025
              </span>
            </div>
          </div>

          {/* Right Header: Dataset Date & Persistent Synthetic Disclaimer */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <div className="hidden lg:flex items-center gap-1.5 text-slate-300 bg-slate-800/80 border border-slate-700/80 rounded-md px-2.5 py-1">
              <Calendar className="h-3.5 w-3.5 text-teal-400" />
              <span>Dataset: <strong className="text-slate-100 font-semibold">10 March 2025</strong></span>
            </div>
            
            <div className="flex items-center gap-1.5 text-amber-200 bg-amber-950/80 border border-amber-700/70 rounded-md px-3 py-1 font-medium tracking-tight">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Synthetic demonstration data — not connected to live BMTC systems.</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Navigation */}
        <nav
          className={`
            fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 pt-20 pb-4 px-3 overflow-y-auto shadow-sm
            transition-transform duration-200 ease-in-out
            md:static md:translate-x-0 md:pt-5 md:z-auto
            ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="mb-3 px-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Corridor Operations
            </p>
          </div>

          <ul className="space-y-1.5">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
                      ${
                        isActive
                          ? "bg-teal-50 text-teal-900 border-l-4 border-teal-600 shadow-xs font-semibold"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-teal-700" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 border-t border-slate-200 pt-4 px-3 space-y-3">
            <Link
              href="/"
              className="flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-teal-700 p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span>← Public Overview</span>
              <span className="text-[10px] font-normal text-slate-400">Marketing</span>
            </Link>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Route: Silk Board ↔ Hebbal
              </p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                24 directional stops across 19.8 km Outer Ring Road corridor. 86 scheduled daily trip slots.
              </p>
            </div>
          </div>
        </nav>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </>
  );
}
