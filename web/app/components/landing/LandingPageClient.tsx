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
    <div className="min-h-screen bg-[#F5F7FA] text-[#12233F] font-sans selection:bg-[#EAF4F7] selection:text-[#0F8278]">
      {/* 1. PUBLIC MARKETING NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DCE5ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#0F8278] flex items-center justify-center text-white shadow-xs">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#12233F]">HOGANA</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold uppercase tracking-wider text-[#0F8278] bg-[#EAF4F7] border border-[#0F8278]/25 px-2 py-0.5 rounded">
                Mobility Intelligence
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#problem" className="hover:text-[#0F8278] transition-colors">The Problem</a>
            <a href="#how-it-works" className="hover:text-[#0F8278] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#0F8278] transition-colors">Capabilities</a>
            <a href="#corridor" className="hover:text-[#0F8278] transition-colors">Corridor Demo</a>
            <a href="#pilot" className="hover:text-[#0F8278] transition-colors">Pilot Programme</a>
            <a href="#faq" className="hover:text-[#0F8278] transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#pilot-enquiry"
              className="hidden sm:inline-flex text-xs font-semibold text-[#12233F] hover:text-[#0F8278] px-3.5 py-2 rounded-lg border border-[#DCE5ED] bg-white hover:bg-[#F5F7FA] transition-colors"
            >
              Discuss a Pilot
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-[#0F8278] hover:bg-[#0c6961] px-4 py-2 rounded-lg shadow-xs transition-colors"
            >
              <span>Explore Corridor Demo</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* SYNTHETIC DEMONSTRATION DISCLOSURE BANNER */}
      <div className="bg-amber-50 border-b border-[#D97706]/30 px-4 py-2 text-center text-xs text-[#D97706] font-medium">
        <span>Synthetic demonstration platform — calibrated for Bengaluru’s Silk Board ↔ Hebbal corridor. Not connected to live BMTC dispatch systems.</span>
      </div>

      {/* SECTION 1: HERO (WHITE BACKGROUND) */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 bg-white border-b border-[#DCE5ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF4F7] border border-[#DCE5ED] text-xs font-semibold text-[#12233F]">
              <span className="h-2 w-2 rounded-full bg-[#0F8278] animate-pulse"></span>
              <span>Bengaluru Outer Ring Road Corridor | 19.8 km Demonstration</span>
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
                <span>Explore Corridor Demo</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#pilot-enquiry"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-[#12233F] bg-white hover:bg-[#F5F7FA] border border-[#DCE5ED] shadow-2xs transition-all"
              >
                <span>Discuss a Pilot</span>
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
                A single cancelled trip or terminal bottleneck creates an unmanaged 24-minute service void. Waiting passengers accumulate along the entire corridor, turning scheduled 12-minute headways into chaotic crowding.
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
              Without active control-point holding, equal bus spacing is mathematically unstable. Minor traffic friction amplifies into full corridor collapse.
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

      {/* SECTION 4: FOUR OPERATIONAL ENGINES (BACKGROUND COLOR) */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-[#F5F7FA] border-b border-[#DCE5ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F8278] bg-[#EAF4F7] border border-[#0F8278]/25 px-2.5 py-1 rounded">
              The HOGANA Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#12233F]">
              Four Operational Engines for Real-Time Decision Support
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
              <h3 className="font-bold text-[#12233F] text-base">Crowding &amp; Capacity</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tracks occupancy against 60-passenger design capacity. Evaluates policy eligibility for peak timetable frequency increases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: PRODUCT FEATURE DEMONSTRATIONS (WHITE BACKGROUND) */}
      <section id="features" className="py-16 sm:py-24 bg-white border-b border-[#DCE5ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F8278] bg-[#EAF4F7] border border-[#0F8278]/25 px-2.5 py-1 rounded">
              Platform Preview
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#12233F]">
              Interactive Tools Built for Operational Dispatchers
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              Explore the five integrated application workflows designed for real transit control rooms.
            </p>
          </div>

          {/* Feature switcher tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 rounded-xl bg-[#EAF4F7] border border-[#DCE5ED] gap-1 text-xs sm:text-sm font-semibold">
              <button
                onClick={() => setActiveFeatureTab("dashboard")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeFeatureTab === "dashboard"
                    ? "bg-[#0F8278] text-white shadow-xs"
                    : "text-[#12233F] hover:text-[#0F8278]"
                }`}
              >
                1. Operations Dashboard
              </button>
              <button
                onClick={() => setActiveFeatureTab("interventions")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeFeatureTab === "interventions"
                    ? "bg-[#0F8278] text-white shadow-xs"
                    : "text-[#12233F] hover:text-[#0F8278]"
                }`}
              >
                2. Dispatcher Interventions
              </button>
              <button
                onClick={() => setActiveFeatureTab("simulation")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeFeatureTab === "simulation"
                    ? "bg-[#0F8278] text-white shadow-xs"
                    : "text-[#12233F] hover:text-[#0F8278]"
                }`}
              >
                3. Scenario Sandbox
              </button>
            </div>
          </div>

          {/* Interactive Feature Mockup Display */}
          <div className="bg-[#F5F7FA] rounded-2xl border border-[#DCE5ED] shadow-sm p-6 sm:p-8 max-w-5xl mx-auto">
            {activeFeatureTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-[#DCE5ED]">
                  <div>
                    <h3 className="text-lg font-bold text-[#12233F]">Corridor Operations Command Center</h3>
                    <p className="text-xs text-slate-500">Live replay at 08:24:00 (Morning Peak) — Marathahalli UP Monitoring Point</p>
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
                  <div className="p-3.5 rounded-xl border border-[#DCE5ED] bg-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Operated Trips</span>
                    <span className="text-xl font-bold font-mono text-[#12233F] block mt-1">77 / 86</span>
                    <span className="text-[11px] text-emerald-700 font-medium">89.5% Fulfillment</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#DCE5ED] bg-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Headway CV</span>
                    <span className="text-xl font-bold font-mono text-[#12233F] block mt-1">0.31</span>
                    <span className="text-[11px] text-[#0F8278] font-medium">Acceptable Irregularity</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#DC2626]/30 bg-red-50/30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#DC2626]">Bunching Alert</span>
                    <span className="text-xl font-bold font-mono text-[#DC2626] block mt-1">75s Sep</span>
                    <span className="text-[11px] text-[#DC2626] font-medium">&lt; 120s Threshold</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#D97706]/30 bg-amber-50/30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706]">Peak Occupancy</span>
                    <span className="text-xl font-bold font-mono text-[#D97706] block mt-1">153.3%</span>
                    <span className="text-[11px] text-[#D97706] font-medium">92 Pax / 60 Cap</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#DC2626]/40 bg-red-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="h-5 w-5 text-[#DC2626] shrink-0" />
                    <div>
                      <strong className="text-[#12233F] font-bold block">Active Bunching Incident at Marathahalli UP</strong>
                      <span className="text-slate-700">Trailing BUS-07 arrived 75s after BUS-06 departed. Advisory: 300s hold recommended.</span>
                    </div>
                  </div>
                  <Link
                    href="/interventions"
                    className="px-3.5 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#b91c1c] text-white font-semibold text-xs shrink-0"
                  >
                    Review Proposal
                  </Link>
                </div>
              </div>
            )}

            {activeFeatureTab === "interventions" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-[#DCE5ED]">
                  <div>
                    <h3 className="text-lg font-bold text-[#12233F]">Human-in-the-Loop Dispatcher Workflow</h3>
                    <p className="text-xs text-slate-500">Advisory intervention proposals with evidence, threshold metrics, and mandatory notes</p>
                  </div>
                  <Link
                    href="/interventions"
                    className="text-xs font-semibold text-[#0F8278] hover:text-[#0c6961] flex items-center gap-1"
                  >
                    <span>Open in App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="p-5 rounded-xl border border-[#DCE5ED] bg-white shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold font-mono text-[#0F8278] bg-[#EAF4F7] border border-[#0F8278]/30 px-2 py-0.5 rounded">
                      PROPOSAL: REC-HOLD-0824
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#DC2626] bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      High Priority Advisory
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#12233F]">
                    Hold Trailing Bus BUS-07 for 300s at Marathahalli UP Control Point
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#F5F7FA] border border-[#DCE5ED]">
                      <span className="text-slate-500 block">Measured Separation</span>
                      <span className="font-mono font-bold text-[#DC2626] text-sm">75 seconds</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F5F7FA] border border-[#DCE5ED]">
                      <span className="text-slate-500 block">Target Headway</span>
                      <span className="font-mono font-bold text-[#12233F] text-sm">720s (12 min)</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F5F7FA] border border-[#DCE5ED]">
                      <span className="text-slate-500 block">Projected Separation</span>
                      <span className="font-mono font-bold text-[#0F8278] text-sm">375 seconds</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-[#DCE5ED] text-xs text-slate-500">
                    <span>Rejection requires mandatory operational justification. Decisions stored locally.</span>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-[#F5F7FA] text-[#12233F] border border-[#DCE5ED] font-semibold text-xs">Reject</span>
                      <span className="px-3.5 py-1.5 rounded-lg bg-[#0F8278] text-white font-semibold text-xs">Approve</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === "simulation" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-[#DCE5ED]">
                  <div>
                    <h3 className="text-lg font-bold text-[#12233F]">Deterministic Scenario Simulator</h3>
                    <p className="text-xs text-slate-500">Test holding durations and standby relief feasibility without guessing</p>
                  </div>
                  <Link
                    href="/simulation"
                    className="text-xs font-semibold text-[#0F8278] hover:text-[#0c6961] flex items-center gap-1"
                  >
                    <span>Open in App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Interactive Inputs</span>
                    <div className="space-y-2 p-4 rounded-xl border border-[#DCE5ED] bg-white">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#12233F]">Hold Duration Slider</span>
                        <span className="font-mono font-bold text-[#0F8278]">300 seconds</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="300"
                        step="30"
                        defaultValue="300"
                        disabled
                        className="w-full accent-[#0F8278] cursor-not-allowed"
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
                    <div className="p-4 rounded-xl border border-[#0F8278]/30 bg-[#EAF4F7]/40 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Baseline Separation:</span>
                        <span className="font-mono font-bold text-[#DC2626]">75s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Projected Separation:</span>
                        <span className="font-mono font-bold text-[#0F8278]">375s (75s + 300s)</span>
                      </div>
                      <div className="flex justify-between border-t border-[#DCE5ED] pt-2 font-semibold">
                        <span className="text-[#12233F]">Headway Restoration:</span>
                        <span className="font-mono text-[#0F8278]">52.1% of nominal 720s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 6: SILK BOARD ↔ HEBBAL CORRIDOR DEMONSTRATION (SOFT BLUE BACKGROUND) */}
      <section id="corridor" className="py-16 sm:py-24 bg-[#EAF4F7] border-b border-[#DCE5ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F8278] bg-white border border-[#DCE5ED] px-2.5 py-1 rounded">
              Bengaluru Reference Corridor
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#12233F]">
              Outer Ring Road: Silk Board ↔ Hebbal
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              One of India’s most critical arterial transport spines, connecting major tech hubs with dense commuter traffic and heavy peak-hour congestion.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10 text-center">
            <div className="p-5 rounded-xl border border-[#DCE5ED] bg-white shadow-xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-mono block">19.8 km</span>
              <span className="text-xs font-medium text-slate-500 mt-1 block">Corridor Length</span>
            </div>
            <div className="p-5 rounded-xl border border-[#DCE5ED] bg-white shadow-xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-mono block">24 Stops</span>
              <span className="text-xs font-medium text-slate-500 mt-1 block">12 UP + 12 DOWN</span>
            </div>
            <div className="p-5 rounded-xl border border-[#DCE5ED] bg-white shadow-xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-mono block">86 Slots</span>
              <span className="text-xs font-medium text-slate-500 mt-1 block">Daily Scheduled Trips</span>
            </div>
            <div className="p-5 rounded-xl border border-[#DCE5ED] bg-white shadow-xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-mono block">13 Buses</span>
              <span className="text-xs font-medium text-slate-500 mt-1 block">11 Active + 2 Standby</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE5ED] p-6 max-w-4xl mx-auto space-y-4 shadow-xs">
            <h3 className="font-bold text-[#12233F] text-sm uppercase tracking-wider">
              Corridor Monitoring Anchor Points
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

      {/* SECTION 7: PILOT PROGRAMME (WHITE BACKGROUND) */}
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
              Designed for zero-risk validation on a single high-frequency corridor before wide-scale deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-[#F5F7FA] rounded-2xl border border-[#DCE5ED] p-6 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-[#0F8278] font-mono">PHASE 1: WEEKS 1–2</span>
              <h3 className="text-lg font-bold text-[#12233F]">Telemetry Ingestion &amp; Audit</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect agency GTFS schedule tables and vehicle GPS feed. Run automated 56-check data integrity verification to establish baseline reliability.
              </p>
            </div>

            <div className="bg-[#F5F7FA] rounded-2xl border border-[#DCE5ED] p-6 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-[#0F8278] font-mono">PHASE 2: WEEKS 3–4</span>
              <h3 className="text-lg font-bold text-[#12233F]">Headway Regularity Profiling</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Map corridor headway coefficients of variation (CV) at peak bottlenecks. Benchmark actual on-time performance (±120s) and service gaps.
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

      {/* SECTION 9: CONTACT & PILOT ENQUIRY (WHITE BACKGROUND) */}
      <section id="pilot-enquiry" className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F8278] bg-[#EAF4F7] border border-[#0F8278]/25 px-2.5 py-1 rounded">
              Partner with HOGANA
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#12233F]">
              Discuss a Corridor Pilot
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Interested in deploying HOGANA on your high-frequency transit corridor? Submit your enquiry below.
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
                  Agency / Organisation <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formOrg}
                  onChange={(e) => setFormOrg(e.target.value)}
                  placeholder="e.g. BMTC, BEST, KSRTC"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#DCE5ED] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8278]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#12233F] block">
                  Work Email <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@agency.gov.in"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#DCE5ED] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8278]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#12233F] block">
                  Contact Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210"
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
                <option value="1-50">1 – 50 buses (Corridor trial)</option>
                <option value="51-200">51 – 200 buses (Depot level)</option>
                <option value="201-1000">201 – 1,000 buses (Division level)</option>
                <option value="1000+">1,000+ buses (Citywide fleet)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#12233F] block">
                Pilot Objectives &amp; Message <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                placeholder="Describe your current headway challenges, corridors of interest, or pilot timeline..."
                className="w-full text-xs p-2.5 rounded-lg border border-[#DCE5ED] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8278]"
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

      {/* FOOTER (PRIMARY NAVY BACKGROUND) */}
      <footer className="bg-[#12233F] text-slate-400 py-12 border-t border-[#12233F] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-[#0F8278] flex items-center justify-center text-white font-bold">
                <Bus className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">HOGANA</span>
              <span className="text-slate-500">|</span>
              <span className="text-[#EAF4F7]">Smart Bus Operations &amp; Mobility Intelligence</span>
            </div>

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
