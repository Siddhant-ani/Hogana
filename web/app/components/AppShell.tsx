"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  User,
  LogIn,
  UserPlus
} from "lucide-react";
import HoganaBrand from "./ui/HoganaBrand";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Data & Quality", href: "/data", icon: Database },
  { name: "Recommendations", href: "/interventions", icon: ShieldAlert },
  { name: "Scenario Planning", href: "/simulation", icon: GitBranch },
  { name: "Reports", href: "/reports", icon: FileText },
];

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json().catch(() => ({}));
        if (isMounted && data.authenticated && data.user) {
          setSessionUser(data.user);
        } else if (isMounted) {
          setSessionUser(null);
        }
      } catch {
        if (isMounted) setSessionUser(null);
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setSessionUser(null);
      setIsLoggingOut(false);
      router.push("/");
      router.refresh();
    }
  };

  // Public landing page, login page, and signup page use their dedicated public layouts
  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return <main className="flex-1 w-full bg-[#F5F7FA]">{children}</main>;
  }

  return (
    <>
      {/* Top Application Header */}
      <header className="bg-[#12233F] text-white border-b border-[#12233F]/90 px-4 py-3 shrink-0 shadow-sm z-30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Identity & Branding — ONE unified clickable link navigating to / */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-1.5 rounded-md text-slate-300 hover:bg-[#12233F]/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F8278]"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <HoganaBrand variant="dark" showTagline showLocation />
            </div>

            {/* Mobile status indicator badge */}
            <div className="lg:hidden flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-200 bg-amber-950/70 border border-[#D97706]/70 rounded px-2 py-0.5">
                <Calendar className="h-2.5 w-2.5" />
                10 Mar 2025
              </span>
            </div>
          </div>

          {/* Right Header: Dataset Date, Persistent Disclosure Banner, and Authentication Controls */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 sm:gap-3 text-xs">
            <div className="hidden lg:flex items-center gap-1.5 text-slate-300 bg-slate-800/80 border border-slate-700/80 rounded-md px-2.5 py-1">
              <Calendar className="h-3.5 w-3.5 text-[#0F8278]" />
              <span>Dataset: <strong className="text-slate-100 font-semibold">10 March 2025</strong></span>
            </div>
            
            <div className="flex items-center gap-1.5 text-amber-200 bg-amber-950/80 border border-[#D97706]/70 rounded-md px-3 py-1 font-medium tracking-tight">
              <AlertTriangle className="h-3.5 w-3.5 text-[#D97706] shrink-0" />
              <span>Illustrative synthetic operational data — not connected to live BMTC systems.</span>
            </div>

            {/* Authentication Controls */}
            {sessionUser ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-700/80">
                <div className="flex items-center gap-2 bg-slate-800/90 text-slate-200 border border-slate-700/80 px-2.5 py-1 rounded-md">
                  <User className="h-3.5 w-3.5 text-[#0F8278]" />
                  <span className="font-semibold text-slate-100 truncate max-w-[120px] sm:max-w-none">
                    {sessionUser.name}
                  </span>
                  {sessionUser.role && (
                    <span className="capitalize text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#0F8278]/30 text-teal-300 border border-[#0F8278]/40">
                      {sessionUser.role.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:text-rose-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F8278] disabled:opacity-50"
                  title="Sign out of HOGANA"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-400" />
                  <span>{isLoggingOut ? "..." : "Sign out"}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign in</span>
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-white bg-[#0F8278] hover:bg-[#0c6961] shadow-2xs transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Sign up</span>
                </Link>
              </div>
            )}
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
            fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-[#DCE5ED] pt-20 pb-4 px-3 overflow-y-auto shadow-sm
            transition-transform duration-200 ease-in-out
            md:static md:translate-x-0 md:pt-5 md:z-auto
            ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="mb-3 px-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Service Operations
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
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F8278]
                      ${
                        isActive
                          ? "bg-[#EAF4F7] text-[#0F8278] border-l-4 border-[#0F8278] shadow-xs font-semibold"
                          : "text-slate-600 hover:bg-[#F5F7FA] hover:text-[#12233F]"
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#0F8278]" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 border-t border-[#DCE5ED] pt-4 px-3 space-y-3">
            <Link
              href="/"
              className="flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-[#0F8278] p-2 rounded-lg hover:bg-[#F5F7FA] transition-colors"
            >
              <span>← Service Area Overview</span>
              <span className="text-[10px] font-normal text-slate-400">Home</span>
            </Link>

            <div className="rounded-lg bg-[#F5F7FA] border border-[#DCE5ED] p-3 text-xs text-slate-600 space-y-1.5">
              <p className="font-semibold text-[#12233F] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Route: Silk Board–Hebbal, Bengaluru
              </p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                24 directional stops across 19.8 km Outer Ring Road service area. 86 scheduled daily trip slots.
              </p>
            </div>

            {/* Mobile Auth action in sidebar */}
            {sessionUser && (
              <div className="pt-2 border-t border-slate-100 md:hidden">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out ({sessionUser.name})</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#F5F7FA] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </>
  );
}
