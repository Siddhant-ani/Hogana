"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  ChevronDown,
  Send,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Menu,
  X,
  Sliders,
  FileText,
  Database,
  LogIn,
  LogOut,
  User,
  UserPlus,
  Users,
  Bus,
  AlertTriangle
} from "lucide-react";
import Button from "../ui/Button";
import HoganaBrand from "../ui/HoganaBrand";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function LandingPageClient() {
  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User session state
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Feature preview tab
  const [activeFeatureTab, setActiveFeatureTab] = useState<"dashboard" | "interventions" | "simulation">("dashboard");

  // Pilot enquiry form state
  const [formName, setFormName] = useState("");
  const [formOrg, setFormOrg] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formFleetSize, setFormFleetSize] = useState("1-50");
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    type: "success" | "error";
    message: string;
    details?: string;
  } | null>(null);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json().catch(() => ({}));
        if (isMounted && data.authenticated && data.user) {
          setSessionUser(data.user);
        }
      } catch {
        // guest mode
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setSessionUser(null);
      setIsLoggingOut(false);
      window.location.reload();
    }
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus(null);

    try {
      const res = await fetch("/api/pilot-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          organisation: formOrg,
          email: formEmail,
          phone: formPhone || undefined,
          fleetSize: formFleetSize,
          message: formMessage
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFormStatus({
          type: "success",
          message: data.message,
          details: data.enquiryId ? `Reference ID: ${data.enquiryId}` : undefined
        });
        setFormName("");
        setFormOrg("");
        setFormEmail("");
        setFormPhone("");
        setFormMessage("");
      } else {
        const errorMsg = data.errors
          ? Object.values(data.errors).join(" ")
          : data.message || "Failed to submit enquiry. Please verify the form.";
        setFormStatus({
          type: "error",
          message: errorMsg
        });
      }
    } catch (err: unknown) {
      setFormStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Network error. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqItems = [
    {
      q: "What data does HOGANA require from a transit agency?",
      a: "In planned pilot deployments, HOGANA is designed to ingest standard GTFS schedule tables and periodic GTFS-Realtime or AVL telemetry feeds, subject to authorised agency data agreements. Passenger load observations (APC) are optional but enable occupancy threshold tracking."
    },
    {
      q: "Does HOGANA replace our existing CAD/AVL or dispatch software?",
      a: "No. HOGANA is designed as an operational intelligence and decision-support layer that operates alongside existing dispatch systems. It computes headway regularity, bunching physics, and relief feasibility to empower human controllers."
    },
    {
      q: "How does HOGANA address bus bunching before it escalates?",
      a: "By monitoring trailing separation at critical control stops along the service area. When headway drops below the bunching threshold, HOGANA calculates the feasible hold duration (capped at maximum allowable delay) to restore scheduled spacing."
    },
    {
      q: "Is HOGANA currently deployed on live BMTC systems?",
      a: "No. The illustrative platform is calibrated strictly on approved synthetic data for Bengaluru's Silk Board–Hebbal service area (10 March 2025). Direct live integrations with BMTC dispatch systems are subject to future pilot agreements and authorised data exchange."
    },
    {
      q: "How long does an agency pilot take to set up?",
      a: "A structured pilot typically runs over 6 weeks: Week 1-2 for planned GTFS and telemetry feed validation, Week 3-4 for baseline headway auditing, and Week 5-6 for simulated intervention evaluation with control room dispatchers."
    }
  ];

  return (
    <div id="top" className="min-h-screen bg-[#F5F7FA] text-[#12233F] font-sans selection:bg-[#EAF4F7] selection:text-[#0F8278]">
      {/* 1. PUBLIC MARKETING NAVBAR WITH ACCESSIBLE MOBILE MENU & AUTH CONTROLS */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DCE5ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Unified Branding Link navigating to / */}
          <HoganaBrand variant="light" showTagline showLocation />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#problem" className="hover:text-[#0F8278] transition-colors">The Problem</a>
            <a href="#how-it-works" className="hover:text-[#0F8278] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#0F8278] transition-colors">Capabilities</a>
            <a href="#service-area" className="hover:text-[#0F8278] transition-colors">Service Area</a>
            <a href="#enquiry" className="hover:text-[#0F8278] transition-colors">Enquiry</a>
            <a href="#faq" className="hover:text-[#0F8278] transition-colors">FAQ</a>
          </nav>

          {/* Desktop CTAs & Authentication Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {sessionUser ? (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#EAF4F7] text-xs font-semibold text-[#12233F] border border-[#0F8278]/20">
                  <User className="h-3.5 w-3.5 text-[#0F8278]" />
                  <span>{sessionUser.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="text-xs font-semibold text-rose-700 hover:text-rose-800 px-3 py-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 transition-colors"
                >
                  {isLoggingOut ? "..." : "Sign out"}
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#12233F] hover:text-[#0F8278] px-3.5 py-2 rounded-lg border border-[#DCE5ED] bg-white hover:bg-[#F5F7FA] transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5 text-[#0F8278]" />
                  <span>Sign in</span>
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F8278] hover:text-[#0c6961] px-3.5 py-2 rounded-lg border border-[#0F8278]/30 bg-[#EAF4F7] hover:bg-[#ddf0ed] transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5 text-[#0F8278]" />
                  <span>Sign up</span>
                </Link>
              </div>
            )}

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-[#0F8278] hover:bg-[#0c6961] px-3.5 sm:px-4 py-2 rounded-lg shadow-xs transition-colors"
            >
              <span>Explore Operations</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="md:hidden p-2 rounded-lg border border-[#DCE5ED] text-slate-700 hover:text-[#0F8278] hover:bg-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#0F8278]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Accessible Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation-drawer"
            className="md:hidden border-t border-[#DCE5ED] bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-150"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                Overview &amp; Features
              </span>
              <a
                href="#problem"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-[#EAF4F7] hover:text-[#0F8278]"
              >
                The Operations Problem
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-[#EAF4F7] hover:text-[#0F8278]"
              >
                How HOGANA Works
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-[#EAF4F7] hover:text-[#0F8278]"
              >
                Platform Capabilities
              </a>
              <a
                href="#service-area"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-[#EAF4F7] hover:text-[#0F8278]"
              >
                Silk Board–Hebbal, Bengaluru
              </a>
              <a
                href="#enquiry"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-[#EAF4F7] hover:text-[#0F8278]"
              >
                Submit an Enquiry
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-[#EAF4F7] hover:text-[#0F8278]"
              >
                Frequently Asked Questions
              </a>
            </div>

            <div className="pt-2 border-t border-[#DCE5ED] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                Operational Application
              </span>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-[#EAF4F7] hover:text-[#0F8278]"
              >
                <Clock className="h-4 w-4 text-[#0F8278]" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/data"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-[#EAF4F7] hover:text-[#0F8278]"
              >
                <Database className="h-4 w-4 text-[#0F8278]" />
                <span>Data Centre &amp; Audit</span>
              </Link>
              <Link
                href="/interventions"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-[#EAF4F7] hover:text-[#0F8278]"
              >
                <ShieldAlert className="h-4 w-4 text-[#0F8278]" />
                <span>Interventions Console</span>
              </Link>
              <Link
                href="/simulation"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-[#EAF4F7] hover:text-[#0F8278]"
              >
                <Sliders className="h-4 w-4 text-[#0F8278]" />
                <span>Scenario Simulation</span>
              </Link>
              <Link
                href="/reports"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-[#EAF4F7] hover:text-[#0F8278]"
              >
                <FileText className="h-4 w-4 text-[#0F8278]" />
                <span>Shift Handover Reports</span>
              </Link>
            </div>

            <div className="pt-2 border-t border-[#DCE5ED] flex flex-col gap-2">
              {sessionUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-center text-xs font-semibold text-rose-700 py-2.5 rounded-lg border border-rose-200 bg-rose-50"
                >
                  Sign out ({sessionUser.name})
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center text-xs font-semibold text-[#12233F] py-2.5 rounded-lg border border-[#DCE5ED] bg-white hover:bg-[#F5F7FA]"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center text-xs font-semibold text-[#0F8278] py-2.5 rounded-lg border border-[#0F8278]/30 bg-[#EAF4F7] hover:bg-[#ddf0ed]"
                  >
                    Sign up
                  </Link>
                </div>
              )}
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-xs font-semibold text-white py-2.5 rounded-lg bg-[#0F8278] hover:bg-[#0c6961]"
              >
                Explore Operations
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* SYNTHETIC DATA DISCLOSURE BANNER */}
      <div className="bg-amber-50 border-b border-[#D97706]/30 px-4 py-2 text-center text-xs text-[#D97706] font-medium">
        <span>Illustrative synthetic operational data — not connected to live BMTC systems.</span>
      </div>

      {/* SECTION 1: HERO (WHITE BACKGROUND) */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 bg-white border-b border-[#DCE5ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF4F7] border border-[#DCE5ED] text-xs font-semibold text-[#12233F]">
              <span className="h-2 w-2 rounded-full bg-[#0F8278] animate-pulse"></span>
              <span>Bengaluru Outer Ring Road Service Area | 19.8 km Analysis</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#12233F] leading-[1.15]">
              &ldquo;A bus can be tracked.<br className="hidden sm:inline" />
              <span className="text-[#0F8278]"> A service gap needs to be managed.&rdquo;</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-700 max-w-3xl mx-auto leading-relaxed font-normal">
              HOGANA turns transport operations data into clear headway, bunching, crowding and service-gap insights—helping operations teams evaluate practical responses and make better-informed decisions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-[#0F8278] hover:bg-[#0c6961] shadow-sm transition-all"
              >
                <span>Explore Operations</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#enquiry"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-[#12233F] bg-white hover:bg-[#F5F7FA] border border-[#DCE5ED] shadow-2xs transition-all"
              >
                <span>Submit an Enquiry</span>
              </a>
            </div>

            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0F8278]" />
                <span>Deterministic Headway Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0F8278]" />
                <span>Automated Bunching Physics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0F8278]" />
                <span>Standby Relief Feasibility</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE URBAN BUS OPERATIONS PROBLEM (SOFT BLUE BACKGROUND) */}
      <section id="problem" className="py-16 sm:py-24 bg-[#EAF4F7] border-b border-[#DCE5ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F8278] bg-white border border-[#DCE5ED] px-2.5 py-1 rounded">
              The Operational Reality
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#12233F]">
              Why Traditional GPS Tracking Leaves Control Rooms Blind
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              Transit agencies invest millions in vehicle GPS tracking, yet dispatchers still face erratic service gaps, passenger complaints, and severe bus bunching every peak hour.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-[#DCE5ED] bg-white shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-[#12233F] text-white flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-[#12233F]">The Bus Bunching Loop</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When a leading bus is delayed by just 2 minutes, it encounters more waiting passengers. Dwell times expand, slowing it further until the trailing bus catches up, arriving empty just seconds behind a packed vehicle.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#DCE5ED] bg-white shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-[#0F8278] text-white flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-[#12233F]">Cascading Service Voids</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                A single cancelled trip or terminal bottleneck creates an unmanaged 24-minute service void. Waiting passengers accumulate along the entire service area, turning scheduled 12-minute headways into chaotic crowding.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#DCE5ED] bg-white shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-[#12233F] text-white flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-[#12233F]">Standby Resource Guesswork</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When gaps occur, dispatchers lack instant visibility into whether standby buses and on-shift drivers are physically staged and available to deploy, leading to missed backfill windows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: TRANSIT PHYSICS (WHITE BACKGROUND) */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#DCE5ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F8278] bg-[#EAF4F7] border border-[#0F8278]/20 px-2.5 py-1 rounded">
              Transit Physics
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#12233F]">
              The Instability of Unregulated Bus Headways
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              Without active control-point holding, equal bus spacing is mathematically unstable. Minor traffic friction amplifies into full service breakdown.
            </p>
          </div>

          <div className="bg-[#F5F7FA] rounded-2xl border border-[#DCE5ED] p-6 sm:p-10 shadow-xs max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#DC2626] bg-red-50 border border-red-200 px-2.5 py-1 rounded">
                  Without Intervention (Degradation)
                </span>
                <h3 className="text-xl font-bold text-[#12233F]">Leading Bus Delay Compounds Trailing Bus Bunching</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Trailing bus arrives only 75 seconds after the leading bus at Marathahalli UP. The leading bus is crush-loaded (153% capacity), while the trailing bus runs with empty seats. Downstream passengers face 20+ minute waits.
                </p>
                <div className="p-3.5 rounded-lg bg-white border border-[#DCE5ED] font-mono text-xs text-slate-700 space-y-1.5">
                  <div>• Scheduled Headway: 720s (12 min)</div>
                  <div className="text-[#DC2626] font-semibold">• Measured Separation: 75s (Severe Bunching)</div>
                  <div>• Result: Headway CV jumps to 0.46 (High Irregularity)</div>
                </div>
              </div>

              <div className="space-y-4 border-t md:border-t-0 md:border-l border-[#DCE5ED] pt-6 md:pt-0 md:pl-8">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F8278] bg-[#EAF4F7] border border-[#0F8278]/30 px-2.5 py-1 rounded">
                  With HOGANA Holding Advisory
                </span>
                <h3 className="text-xl font-bold text-[#12233F]">Calculated Holding at Designated Control Points</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  HOGANA detects the 75s violation and advises a 300s hold on the trailing bus at Marathahalli UP control point before departure, expanding separation to 375s and restoring 52.1% of nominal headway.
                </p>
                <div className="p-3.5 rounded-lg bg-white border border-[#0F8278]/30 font-mono text-xs text-[#12233F] space-y-1.5">
                  <div>• Advisory Hold Duration: 300s (Capped at allowance)</div>
                  <div className="text-[#0F8278] font-bold">• Projected Separation: 375s (Bunching Cleared)</div>
                  <div>• Headway Restoration: 52.1% of nominal target</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: PLATFORM ARCHITECTURE (SOFT BLUE BACKGROUND) */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-[#EAF4F7] border-b border-[#DCE5ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F8278] bg-white border border-[#DCE5ED] px-2.5 py-1 rounded">
              The HOGANA Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#12233F]">
              Four Operational Engines for Operations Decision Support
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              HOGANA processes timetable schedules, vehicle GPS traces, fleet allocations, and boarding observations through four synchronized operational engines.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-[#DCE5ED] p-5 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-[#0F8278] text-white flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#12233F] text-base">Headway Regularity Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calculates actual stop arrival intervals, coefficients of variation (CV), and On-Time Performance (±120s) across all monitoring points.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#DCE5ED] p-5 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-[#12233F] text-white flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-[#0F8278]" />
              </div>
              <h3 className="font-bold text-[#12233F] text-base">Bus Bunching &amp; Holding</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Identifies trailing arrivals within 120s of leading departures. Calculates feasible hold seconds capped at maximum delay allowance.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#DCE5ED] p-5 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-[#0F8278] text-white flex items-center justify-center">
                <Bus className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#12233F] text-base">Service Gaps &amp; Relief</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Detects gaps exceeding 1.5× nominal headway (1,080s). Verifies physical bus staging and driver duty shifts before proposing standby deployment.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#DCE5ED] p-5 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-[#12233F] text-white flex items-center justify-center">
                <Users className="h-5 w-5 text-[#0F8278]" />
              </div>
              <h3 className="font-bold text-[#12233F] text-base">Crowding &amp; Capacity Audit</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Monitors passenger load against 60-passenger design capacity (40 seated + 20 standing). Enforces 3-consecutive-stop frequency rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: PRODUCT CAPABILITIES (WHITE BACKGROUND) */}
      <section id="features" className="py-16 sm:py-24 bg-white border-b border-[#DCE5ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F8278] bg-[#EAF4F7] border border-[#0F8278]/25 px-2.5 py-1 rounded">
              Interactive Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#12233F]">
              Explore HOGANA in Action
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              Explore how HOGANA powers operations control, intervention workflows, and scenario analysis.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-[#F5F7FA] rounded-xl border border-[#DCE5ED]">
              <button
                onClick={() => setActiveFeatureTab("dashboard")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeFeatureTab === "dashboard"
                    ? "bg-white text-[#12233F] shadow-xs"
                    : "text-slate-600 hover:text-[#12233F]"
                }`}
              >
                Operations Dashboard
              </button>
              <button
                onClick={() => setActiveFeatureTab("interventions")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeFeatureTab === "interventions"
                    ? "bg-white text-[#12233F] shadow-xs"
                    : "text-slate-600 hover:text-[#12233F]"
                }`}
              >
                Standby Relief Dispatch
              </button>
              <button
                onClick={() => setActiveFeatureTab("simulation")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeFeatureTab === "simulation"
                    ? "bg-white text-[#12233F] shadow-xs"
                    : "text-slate-600 hover:text-[#12233F]"
                }`}
              >
                Passenger Crowding
              </button>
            </div>
          </div>

          {/* Feature Showcase Box */}
          <div className="bg-[#F5F7FA] rounded-2xl border border-[#DCE5ED] p-6 sm:p-10 shadow-xs max-w-4xl mx-auto">
            {activeFeatureTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-[#DCE5ED]">
                  <div>
                    <h3 className="text-lg font-bold text-[#12233F]">Service Operations Command Center</h3>
                    <p className="text-xs text-slate-500">Service area snapshot at 08:24:00 (Morning Peak) — Marathahalli UP Monitoring Point</p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-xs font-semibold text-[#0F8278] hover:text-[#0c6961] flex items-center gap-1"
                  >
                    <span>Open in App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-[#DCE5ED]">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">Fulfilment</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-[#12233F] mt-1 block">89.5%</span>
                    <span className="text-[11px] text-slate-500">77 of 86 trips operated</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#DCE5ED]">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">On-Time Performance</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-[#D97706] mt-1 block">57.1%</span>
                    <span className="text-[11px] text-slate-500">±120s arrival adherence</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#DCE5ED]">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">Active Bunching</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-[#DC2626] mt-1 block">75s Sep</span>
                    <span className="text-[11px] text-[#DC2626] font-medium">Critical (&lt; 120s limit)</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#DCE5ED]">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">Peak Crowding</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-[#DC2626] mt-1 block">153.3%</span>
                    <span className="text-[11px] text-slate-500">92 pax on board</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#DCE5ED] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#12233F]">Active Control-Point Advisory</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F8278] bg-[#EAF4F7] px-2 py-0.5 rounded">
                      Human Review Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Trailing bus BUS-07 is 75s behind BUS-06 at Marathahalli UP. Holding BUS-07 for 300s expands departure headway to 375s, clearing the bunching condition.
                  </p>
                </div>
              </div>
            )}

            {activeFeatureTab === "interventions" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-[#DCE5ED]">
                  <div>
                    <h3 className="text-lg font-bold text-[#12233F]">Standby Relief Dispatch Feasibility</h3>
                    <p className="text-xs text-slate-500">Evening Peak Replay (18:15:00) — Hebbal DOWN Terminal</p>
                  </div>
                  <Link
                    href="/interventions"
                    className="text-xs font-semibold text-[#0F8278] hover:text-[#0c6961] flex items-center gap-1"
                  >
                    <span>Open in App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#DCE5ED] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#DC2626]">Severe Service Void Detected</span>
                    <span className="text-xs font-mono font-bold text-[#DC2626]">1,440s (24 min)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Scheduled trip cancelled due to earlier mechanical failure. Headway exceeds 1.5× nominal threshold (1,080s limit).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#DCE5ED] text-xs">
                    <div className="p-2.5 rounded bg-[#F5F7FA]">
                      <span className="text-slate-500 block">Staged Vehicle</span>
                      <span className="font-bold text-[#12233F]">BUS-13 Staged at Hebbal DOWN</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#F5F7FA]">
                      <span className="text-slate-500 block">On-Shift Driver</span>
                      <span className="font-bold text-[#12233F]">CREW-24 (Shift 2: 14:00–22:00)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === "simulation" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-[#DCE5ED]">
                  <div>
                    <h3 className="text-lg font-bold text-[#12233F]">Crowding &amp; Frequency Analysis Sandbox</h3>
                    <p className="text-xs text-slate-500">60-Passenger Design Capacity Model (40 Seated + 20 Standing)</p>
                  </div>
                  <Link
                    href="/simulation"
                    className="text-xs font-semibold text-[#0F8278] hover:text-[#0c6961] flex items-center gap-1"
                  >
                    <span>Open in App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#DCE5ED] space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#12233F]">Peak Observed Load</span>
                    <span className="font-mono font-bold text-[#DC2626]">92 Pax (153.3% Occupancy)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#DC2626] h-full rounded-full" style={{ width: "100%" }}></div>
                  </div>
                  <p className="text-xs text-slate-600">
                    Observed at <strong>Kadubeesanahalli UP</strong> during morning peak. Single isolated spike did not meet the 3-consecutive-stop trigger required for scheduled frequency increase.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 6: SILK BOARD–HEBBAL SERVICE AREA (SOFT BLUE BACKGROUND) */}
      <section id="service-area" className="py-16 sm:py-24 bg-[#EAF4F7] border-b border-[#DCE5ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F8278] bg-white border border-[#DCE5ED] px-2.5 py-1 rounded">
              Bengaluru Reference Service Area
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#12233F]">
              Outer Ring Road: Silk Board–Hebbal, Bengaluru
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              One of India’s most critical arterial transport spines, connecting major tech hubs with dense commuter traffic and heavy peak-hour congestion.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10 text-center">
            <div className="p-5 rounded-xl border border-[#DCE5ED] bg-white shadow-xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-mono block">19.8 km</span>
              <span className="text-xs font-medium text-slate-500 mt-1 block">Service Area Length</span>
            </div>
            <div className="p-5 rounded-xl border border-[#DCE5ED] bg-white shadow-xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-mono block">24 Stops</span>
              <span className="text-xs font-medium text-slate-500 mt-1 block">12 UP + 12 DOWN</span>
            </div>
            <div className="p-5 rounded-xl border border-[#DCE5ED] bg-white shadow-xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-mono block">200 Trips</span>
              <span className="text-xs font-medium text-slate-500 mt-1 block">AC Bus Scheduled Trips (Avg)</span>
            </div>
            <div className="p-5 rounded-xl border border-[#DCE5ED] bg-white shadow-xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-mono block">250 Trips</span>
              <span className="text-xs font-medium text-slate-500 mt-1 block">Non-AC Bus Scheduled Trips (Avg)</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE5ED] p-6 max-w-4xl mx-auto space-y-4 shadow-xs">
            <h3 className="font-bold text-[#12233F] text-sm uppercase tracking-wider">
              Service Monitoring Anchor Points
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#12233F]">
                  <MapPin className="h-3.5 w-3.5 text-[#0F8278]" />
                  <span>Marathahalli UP (Control Point)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Morning Peak Anchor (08:24:00): Evaluates bus bunching (75s separation) and 300s holding intervention.
                </p>
              </div>
              <div className="p-3.5 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#12233F]">
                  <MapPin className="h-3.5 w-3.5 text-[#0F8278]" />
                  <span>Hebbal DOWN (Terminal Point)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Evening Peak Anchor (18:15:00): Evaluates 1,440s service void and standby relief deployment feasibility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: PILOT FRAMEWORK (WHITE BACKGROUND) */}
      <section id="pilot" className="py-16 sm:py-24 bg-white border-b border-[#DCE5ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F8278] bg-[#EAF4F7] border border-[#0F8278]/25 px-2.5 py-1 rounded">
              Implementation Roadmap
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#12233F]">
              6-Week Structured Transit Agency Pilot
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              Designed for zero-risk validation on a single high-frequency service area before wide-scale deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-[#F5F7FA] rounded-2xl border border-[#DCE5ED] p-6 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-[#0F8278] font-mono">PHASE 1: WEEKS 1–2</span>
              <h3 className="text-lg font-bold text-[#12233F]">Telemetry Ingestion &amp; Audit</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingest planned pilot GTFS schedule tables and vehicle telemetry inputs. Run automated 56-check data integrity verification to establish baseline reliability.
              </p>
            </div>

            <div className="bg-[#F5F7FA] rounded-2xl border border-[#DCE5ED] p-6 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-[#0F8278] font-mono">PHASE 2: WEEKS 3–4</span>
              <h3 className="text-lg font-bold text-[#12233F]">Headway Regularity Profiling</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Map headway coefficients of variation (CV) at peak bottlenecks. Benchmark actual on-time performance (±120s) and service gaps.
              </p>
            </div>

            <div className="bg-[#F5F7FA] rounded-2xl border border-[#DCE5ED] p-6 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-[#0F8278] font-mono">PHASE 3: WEEKS 5–6</span>
              <h3 className="text-lg font-bold text-[#12233F]">Dispatcher Decision Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deploy HOGANA to control room dispatchers. Evaluate advisory holding and relief proposals with human-in-the-loop audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: FREQUENTLY ASKED QUESTIONS (BACKGROUND COLOR) */}
      <section id="faq" className="py-16 sm:py-24 bg-[#F5F7FA] border-b border-[#DCE5ED]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F8278] bg-[#EAF4F7] border border-[#0F8278]/25 px-2.5 py-1 rounded">
              Clarifications
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#12233F]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-[#DCE5ED] border-y border-[#DCE5ED]">
            {faqItems.map((item, idx) => (
              <div key={idx} className="py-4">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-[#12233F] py-1"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      openFaq === idx ? "rotate-180 text-[#0F8278]" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed animate-in fade-in duration-150">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: CUSTOMER CARE & ENQUIRY */}
      <section id="enquiry" className="py-16 sm:py-24 bg-white relative">
        <span id="pilot-enquiry" className="absolute -top-20" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back to Overview button */}
          <div className="flex items-center justify-start mb-6">
            <a
              href="#top"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#12233F] hover:text-[#0F8278] bg-[#F5F7FA] hover:bg-[#EAF4F7] border border-[#DCE5ED] shadow-2xs transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#0F8278]" />
              <span>← Back to Overview</span>
            </a>
          </div>

          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F8278] bg-[#EAF4F7] border border-[#0F8278]/25 px-2.5 py-1 rounded">
              Get in Touch with Our Team
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#12233F]">
              Submit an Enquiry
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              Interested in deploying HOGANA for your bus fleet or operations? Fill out your details below and our customer care executive will contact you shortly.
            </p>
          </div>

          <form
            onSubmit={handleEnquirySubmit}
            className="bg-white rounded-2xl border border-[#DCE5ED] shadow-sm p-6 sm:p-8 space-y-5"
          >
            {formStatus && (
              <div
                className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
                  formStatus.type === "success"
                    ? "bg-emerald-50 text-emerald-950 border border-emerald-200"
                    : "bg-red-50 text-red-950 border border-red-200"
                }`}
              >
                {formStatus.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-[#DC2626] shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block font-semibold">{formStatus.message}</strong>
                  {formStatus.details && (
                    <span className="text-[11px] opacity-80 mt-0.5 block font-mono">
                      {formStatus.details}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#12233F] block">
                  Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#DCE5ED] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8278]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#12233F] block">
                  Company / Bus Fleet Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formOrg}
                  onChange={(e) => setFormOrg(e.target.value)}
                  placeholder="e.g. City Express Transit, SRS Lines"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#DCE5ED] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8278]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#12233F] block">
                  Work Email Address <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@buscompany.com"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#DCE5ED] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8278]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#12233F] block">
                  Contact Phone Number <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210 (Executive will call this number)"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#DCE5ED] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8278]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#12233F] block">
                Approximate Fleet Size <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={formFleetSize}
                onChange={(e) => setFormFleetSize(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#DCE5ED] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8278]"
              >
                <option value="1-50">1 – 50 buses</option>
                <option value="51-200">51 – 200 buses</option>
                <option value="201-1000">201 – 1,000 buses</option>
                <option value="1000+">1,000+ buses</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#12233F] block">
                Operational Requirements &amp; Message <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                placeholder="Tell us about your fleet routes, scheduling challenges, or questions for our customer care team..."
                className="w-full text-xs p-2.5 rounded-lg border border-[#DCE5ED] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8278]"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span className="text-[11px] text-slate-500">Our customer care team typically reaches out within 2–4 business hours.</span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <a
                  href="#top"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#12233F] hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Top</span>
                </a>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  rightIcon={<Send className="h-3.5 w-3.5" />}
                >
                  Submit Enquiry
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* FOOTER (PRIMARY NAVY BACKGROUND) */}
      <footer className="bg-[#12233F] text-slate-400 py-12 border-t border-[#12233F] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <HoganaBrand variant="dark" showTagline showLocation />

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <Link href="/dashboard" className="text-slate-300 hover:text-white">Operations Dashboard</Link>
              <Link href="/data" className="text-slate-300 hover:text-white">Data Centre</Link>
              <Link href="/interventions" className="text-slate-300 hover:text-white">Interventions</Link>
              <Link href="/simulation" className="text-slate-300 hover:text-white">Simulation</Link>
              <Link href="/reports" className="text-slate-300 hover:text-white">Reports</Link>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-400 text-[11px]">
            <p>
              © 2025–2026 HOGANA. Silk Board–Hebbal, Bengaluru Service Area. Built for urban transit operations.
            </p>
            <p className="text-slate-400">
              Illustrative synthetic operational data — not connected to live BMTC systems.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
