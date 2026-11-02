"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bus,
  ArrowRight,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Send,
  MapPin,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import Button from "../ui/Button";

export default function LandingPageClient() {
  // Feature demo preview tab
  const [activeFeatureTab, setActiveFeatureTab] = useState<"dashboard" | "interventions" | "simulation">("dashboard");

  // Pilot enquiry form state
  const [formName, setFormName] = useState("");
  const [formOrg, setFormOrg] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formFleetSize, setFormFleetSize] = useState("101-500");
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    type: "success" | "error";
    message: string;
    details?: string;
  } | null>(null);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
      a: "HOGANA operates on standard GTFS or GTFS-Realtime feeds: static route schedules, stop sequences, and periodic AVL/GPS position telemetry. Passenger load observations (APC) are optional but enable occupancy threshold tracking."
    },
    {
      q: "Does HOGANA replace our existing CAD/AVL or dispatch software?",
      a: "No. HOGANA is designed as an operational intelligence and decision-support layer that integrates alongside existing dispatch infrastructure. It computes headway regularity, bunching physics, and relief feasibility to empower human controllers."
    },
    {
      q: "How does HOGANA prevent bus bunching before it occurs?",
      a: "By monitoring trailing separation at critical control stops in real time. When headway degrades below the corridor bunching threshold, HOGANA calculates the exact feasible hold duration (up to the maximum allowable delay) to restore scheduled spacing."
    },
    {
      q: "Is HOGANA currently deployed on live BMTC systems?",
      a: "No. The live demonstration is calibrated strictly on approved synthetic demonstration data for Bengaluru's Silk Board ↔ Hebbal corridor (10 March 2025). It is designed to demonstrate operational capabilities for transit agency pilot evaluations."
    },
    {
      q: "How long does an agency pilot take to set up?",
      a: "A structured pilot typically runs over 6 weeks: Week 1-2 for GTFS and telemetry feed validation, Week 3-4 for corridor baseline headway auditing, and Week 5-6 for simulated intervention evaluation with control room dispatchers."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* 1. PUBLIC MARKETING NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">HOGANA</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                Mobility Intelligence
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#problem" className="hover:text-slate-900 transition-colors">The Problem</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Capabilities</a>
            <a href="#corridor" className="hover:text-slate-900 transition-colors">Corridor Demo</a>
            <a href="#pilot" className="hover:text-slate-900 transition-colors">Pilot Programme</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#pilot-enquiry"
              className="hidden sm:inline-flex text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Discuss a Pilot
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3.5 py-2 rounded-lg shadow-xs transition-colors"
            >
              <span>Explore Corridor Demo</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* SYNTHETIC DEMONSTRATION DISCLOSURE BANNER */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900 font-medium">
        <span>Synthetic demonstration platform — calibrated for Bengaluru’s Silk Board ↔ Hebbal corridor. Not connected to live BMTC dispatch systems.</span>
      </div>

      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
              <span>Bengaluru Outer Ring Road Corridor | 19.8 km Demonstration</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              &ldquo;A bus can be tracked.<br className="hidden sm:inline" />
              <span className="text-teal-700"> A service gap needs to be managed.&rdquo;</span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
              HOGANA turns transport operations data into clear headway, bunching, crowding and service-gap insights—helping operations teams evaluate practical responses and make better-informed decisions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all"
              >
                <span>Explore Corridor Demo</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#pilot-enquiry"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition-all"
              >
                <span>Discuss a Pilot</span>
              </a>
            </div>

            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span>Deterministic Headway Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span>Automated Bunching Physics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span>Standby Relief Feasibility</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE URBAN BUS OPERATIONS PROBLEM */}
      <section id="problem" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded">
              The Operational Reality
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Why Traditional GPS Tracking Leaves Control Rooms Blind
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Transit agencies invest millions in vehicle GPS tracking, yet dispatchers still face erratic service gaps, passenger complaints, and severe bus bunching every peak hour.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900">The Bus Bunching Loop</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When a leading bus is delayed by just 2 minutes, it encounters more waiting passengers. Dwell times expand, slowing it further until the trailing bus catches up, arriving empty just seconds behind a packed vehicle.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cascading Service Voids</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                A single cancelled trip or terminal bottleneck creates an unmanaged 24-minute service void. Waiting passengers accumulate along the entire corridor, turning scheduled 12-minute headways into chaotic crowding.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900">Standby Resource Guesswork</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When gaps occur, dispatchers lack instant visibility into whether standby buses and on-shift drivers are physically staged and available to deploy, leading to missed backfill windows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: WHY BUNCHING & SERVICE GAPS HAPPEN (VISUAL PHYSICS) */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded">
              Transit Physics
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              The Instability of Unregulated Bus Headways
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Without active control-point holding, equal bus spacing is mathematically unstable. Minor traffic friction amplifies into full corridor collapse.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  Without Intervention (Degradation)
                </span>
                <h3 className="text-xl font-bold text-slate-900">Leading Bus Delay Compounds Trailing Bus Bunching</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Trailing bus arrives only 75 seconds after the leading bus at Marathahalli UP. The leading bus is crush-loaded (153% capacity), while the trailing bus runs with empty seats. Downstream passengers face 20+ minute waits.
                </p>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 space-y-1">
                  <div>• Scheduled Headway: 720s (12 min)</div>
                  <div>• Measured Separation: 75s (Severe Bunching)</div>
                  <div>• Result: Headway CV jumps to 0.46 (High Irregularity)</div>
                </div>
              </div>

              <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-8">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  With HOGANA Holding Advisory
                </span>
                <h3 className="text-xl font-bold text-slate-900">Calculated Holding at Designated Control Points</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  HOGANA detects the 75s violation and advises a 300s hold on the trailing bus at Marathahalli UP control point before departure, expanding separation to 375s and restoring 52.1% of nominal headway.
                </p>
                <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 font-mono text-xs text-teal-900 space-y-1">
                  <div>• Advisory Hold Duration: 300s (Capped at allowance)</div>
                  <div>• Projected Separation: 375s (Bunching Cleared)</div>
                  <div>• Headway Restoration: 52.1% of nominal target</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW HOGANA ADDRESSES THE PROBLEM */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded">
              The HOGANA Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Four Operational Engines for Real-Time Decision Support
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              HOGANA processes timetable schedules, vehicle GPS traces, fleet allocations, and boarding observations through four synchronized operational engines.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Headway Regularity Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calculates actual stop arrival intervals, coefficients of variation (CV), and On-Time Performance (±120s) across all monitoring points.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Bus Bunching & Holding</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Identifies trailing arrivals within 120s of leading departures. Calculates feasible hold seconds capped at maximum delay allowance.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                <Bus className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Service Gaps & Relief</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Detects gaps exceeding 1.5× nominal headway (1,080s). Verifies physical bus staging and driver duty shifts before proposing standby deployment.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Crowding & Capacity</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tracks occupancy against 60-passenger design capacity. Evaluates policy eligibility for peak timetable frequency increases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: PRODUCT FEATURE DEMONSTRATIONS (INTERACTIVE PREVIEWS) */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded">
              Platform Preview
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Interactive Tools Built for Operational Dispatchers
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Explore the five integrated application workflows designed for real transit control rooms.
            </p>
          </div>

          {/* Feature switcher tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 rounded-xl bg-slate-200/80 border border-slate-300 gap-1 text-xs sm:text-sm font-semibold">
              <button
                onClick={() => setActiveFeatureTab("dashboard")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeFeatureTab === "dashboard"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                1. Operations Dashboard
              </button>
              <button
                onClick={() => setActiveFeatureTab("interventions")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeFeatureTab === "interventions"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                2. Dispatcher Interventions
              </button>
              <button
                onClick={() => setActiveFeatureTab("simulation")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeFeatureTab === "simulation"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                3. Scenario Sandbox
              </button>
            </div>
          </div>

          {/* Interactive Feature Mockup Display */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-5xl mx-auto">
            {activeFeatureTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Corridor Operations Command Center</h3>
                    <p className="text-xs text-slate-500">Live replay at 08:24:00 (Morning Peak) — Marathahalli UP Monitoring Point</p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    <span>Open in App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Operated Trips</span>
                    <span className="text-xl font-bold font-mono text-slate-900 block mt-1">77 / 86</span>
                    <span className="text-[11px] text-emerald-700 font-medium">89.5% Fulfillment</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Headway CV</span>
                    <span className="text-xl font-bold font-mono text-slate-900 block mt-1">0.31</span>
                    <span className="text-[11px] text-teal-700 font-medium">Acceptable Irregularity</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Bunching Alert</span>
                    <span className="text-xl font-bold font-mono text-rose-900 block mt-1">75s Sep</span>
                    <span className="text-[11px] text-rose-700 font-medium">&lt; 120s Threshold</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Peak Occupancy</span>
                    <span className="text-xl font-bold font-mono text-amber-950 block mt-1">153.3%</span>
                    <span className="text-[11px] text-amber-800 font-medium">92 Pax / 60 Cap</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                    <div>
                      <strong className="text-rose-950 font-bold block">Active Bunching Incident at Marathahalli UP</strong>
                      <span className="text-rose-800">Trailing BUS-07 arrived 75s after BUS-06 departed. Advisory: 300s hold recommended.</span>
                    </div>
                  </div>
                  <Link
                    href="/interventions"
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shrink-0"
                  >
                    Review Proposal
                  </Link>
                </div>
              </div>
            )}

            {activeFeatureTab === "interventions" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Human-in-the-Loop Dispatcher Workflow</h3>
                    <p className="text-xs text-slate-500">Advisory intervention proposals with evidence, threshold metrics, and mandatory notes</p>
                  </div>
                  <Link
                    href="/interventions"
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    <span>Open in App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold font-mono text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      PROPOSAL: REC-HOLD-0824
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      High Priority Advisory
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">
                    Hold Trailing Bus BUS-07 for 300s at Marathahalli UP Control Point
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Measured Separation</span>
                      <span className="font-mono font-bold text-rose-700 text-sm">75 seconds</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Target Headway</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">720s (12 min)</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Projected Separation</span>
                      <span className="font-mono font-bold text-teal-700 text-sm">375 seconds</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
                    <span>Rejection requires mandatory operational justification. Decisions stored locally.</span>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs">Reject</span>
                      <span className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-semibold text-xs">Approve</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === "simulation" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Deterministic Scenario Simulator</h3>
                    <p className="text-xs text-slate-500">Test holding durations and standby relief feasibility without guessing</p>
                  </div>
                  <Link
                    href="/simulation"
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    <span>Open in App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Interactive Inputs</span>
                    <div className="space-y-2 p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Hold Duration Slider</span>
                        <span className="font-mono font-bold text-teal-700">300 seconds</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="300"
                        step="30"
                        defaultValue="300"
                        disabled
                        className="w-full accent-teal-600 cursor-not-allowed"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>0s (No Hold)</span>
                        <span>150s</span>
                        <span>300s (Max Cap)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Deterministic Projection</span>
                    <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Baseline Separation:</span>
                        <span className="font-mono font-bold">75s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Projected Separation:</span>
                        <span className="font-mono font-bold text-teal-900">375s (75s + 300s)</span>
                      </div>
                      <div className="flex justify-between border-t border-teal-200 pt-2 font-semibold">
                        <span className="text-slate-700">Headway Restoration:</span>
                        <span className="font-mono text-teal-800">52.1% of nominal 720s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 7: SILK BOARD ↔ HEBBAL CORRIDOR DEMONSTRATION */}
      <section id="corridor" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded">
              Bengaluru Reference Corridor
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Outer Ring Road: Silk Board ↔ Hebbal
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              One of India’s most critical arterial transport spines, connecting major tech hubs with dense commuter traffic and heavy peak-hour congestion.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10 text-center">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono block">19.8 km</span>
              <span className="text-xs font-medium text-slate-500 mt-1 block">Corridor Length</span>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono block">24 Stops</span>
              <span className="text-xs font-medium text-slate-500 mt-1 block">12 UP + 12 DOWN</span>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono block">86 Slots</span>
              <span className="text-xs font-medium text-slate-500 mt-1 block">Daily Scheduled Trips</span>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono block">13 Buses</span>
              <span className="text-xs font-medium text-slate-500 mt-1 block">11 Active + 2 Standby</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 max-w-4xl mx-auto space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Corridor Monitoring Anchor Points
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  <span>Marathahalli UP (Control Point)</span>
                </div>
                <p className="text-slate-600">
                  Morning Peak Anchor (08:24:00): Evaluates bus bunching (75s separation) and 300s holding intervention.
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  <span>Hebbal DOWN (Terminal Point)</span>
                </div>
                <p className="text-slate-600">
                  Evening Peak Anchor (18:15:00): Evaluates 1,440s service void and standby relief deployment feasibility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: PILOT PROGRAMME (6-WEEK TRANSIT AGENCY STRUCTURE) */}
      <section id="pilot" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded">
              Implementation Roadmap
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              6-Week Structured Transit Agency Pilot
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Designed for zero-risk validation on a single high-frequency corridor before wide-scale deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <span className="text-xs font-bold text-teal-700 font-mono">PHASE 1: WEEKS 1–2</span>
              <h3 className="text-lg font-bold text-slate-900">Telemetry Ingestion &amp; Audit</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect agency GTFS schedule tables and vehicle GPS feed. Run automated 56-check data integrity verification to establish baseline reliability.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <span className="text-xs font-bold text-teal-700 font-mono">PHASE 2: WEEKS 3–4</span>
              <h3 className="text-lg font-bold text-slate-900">Headway Regularity Profiling</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Map corridor headway coefficients of variation (CV) at peak bottlenecks. Benchmark actual on-time performance (±120s) and service gaps.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <span className="text-xs font-bold text-teal-700 font-mono">PHASE 3: WEEKS 5–6</span>
              <h3 className="text-lg font-bold text-slate-900">Dispatcher Decision Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deploy HOGANA to control room dispatchers. Evaluate advisory holding and relief proposals with human-in-the-loop audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
              Clarifications
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {faqItems.map((item, idx) => (
              <div key={idx} className="py-4">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-900 py-1"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      openFaq === idx ? "rotate-180 text-teal-600" : ""
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

      {/* SECTION 10: CONTACT & PILOT ENQUIRY */}
      <section id="pilot-enquiry" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded">
              Partner with HOGANA
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Discuss a Corridor Pilot
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Interested in deploying HOGANA on your high-frequency transit corridor? Submit your enquiry below.
            </p>
          </div>

          <form
            onSubmit={handleEnquirySubmit}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5"
          >
            {formStatus && (
              <div
                className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
                  formStatus.type === "success"
                    ? "bg-emerald-50 text-emerald-950 border border-emerald-200"
                    : "bg-rose-50 text-rose-950 border border-rose-200"
                }`}
              >
                {formStatus.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
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
                <label className="text-xs font-semibold text-slate-700 block">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Agency / Organisation <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formOrg}
                  onChange={(e) => setFormOrg(e.target.value)}
                  placeholder="e.g. BMTC, BEST, KSRTC"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Work Email <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@agency.gov.in"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Contact Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Approximate Fleet Size <span className="text-rose-600">*</span>
              </label>
              <select
                value={formFleetSize}
                onChange={(e) => setFormFleetSize(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="1-50">1 – 50 buses (Corridor trial)</option>
                <option value="51-200">51 – 200 buses (Depot level)</option>
                <option value="201-1000">201 – 1,000 buses (Division level)</option>
                <option value="1000+">1,000+ buses (Citywide fleet)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Pilot Objectives &amp; Message <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                placeholder="Describe your current headway challenges, corridors of interest, or pilot timeline..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span>Configurable destination via PILOT_ENQUIRY_WEBHOOK_URL.</span>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                rightIcon={<Send className="h-3.5 w-3.5" />}
              >
                Submit Pilot Enquiry
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-teal-600 flex items-center justify-center text-white font-bold">
                <Bus className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">HOGANA</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">Smart Bus Operations &amp; Mobility Intelligence</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <Link href="/dashboard" className="text-slate-300 hover:text-white">Operations Dashboard</Link>
              <Link href="/data" className="text-slate-300 hover:text-white">Data Centre</Link>
              <Link href="/interventions" className="text-slate-300 hover:text-white">Interventions</Link>
              <Link href="/simulation" className="text-slate-300 hover:text-white">Simulation</Link>
              <Link href="/reports" className="text-slate-300 hover:text-white">Reports</Link>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-500 text-[11px]">
            <p>
              © 2025–2026 HOGANA. Silk Board ↔ Hebbal Corridor Demonstration. Built for urban transit operations.
            </p>
            <p className="text-slate-400">
              Synthetic demonstration dataset — not an official BMTC or government deployment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
