"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  User,
  Building2,
  Briefcase,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import HoganaBrand from "@/app/components/ui/HoganaBrand";

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"administrator" | "dispatcher" | "data_manager" | "analyst">("administrator");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    company?: string;
    email?: string;
    password?: string;
  }>({});
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Client-side validation
    const errors: { name?: string; company?: string; email?: string; password?: string } = {};

    if (!name.trim()) {
      errors.name = "Full name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    if (!company.trim()) {
      errors.company = "Company or bus fleet name is required.";
    }

    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid work email address.";
    }

    if (!password.trim()) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          email: email.trim(),
          password,
          role
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setAuthError(data.message || "Registration failed. Please check your details.");
        setIsSubmitting(false);
        return;
      }

      // Successful registration & auto-login -> Redirect to callbackUrl
      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-between selection:bg-[#EAF4F7] selection:text-[#0F8278]">
      {/* Top Navbar with HOGANA Branding Link */}
      <header className="bg-white border-b border-[#DCE5ED] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-2xs">
        <HoganaBrand variant="light" showTagline showLocation />
        <Link
          href="/"
          className="text-xs font-semibold text-slate-600 hover:text-[#0F8278] transition-colors"
        >
          ← Return to Public Home
        </Link>
      </header>

      {/* Main Signup Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-[#DCE5ED] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#12233F]">
              Register Bus Operations Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
              Join HOGANA to manage fleet operations, reduce bus bunching, eliminate service gaps, and optimize daily routes.
            </p>
          </div>

          {/* Registration Error Alert */}
          {authError && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in duration-150"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-950">Registration Failure</span>
                <span className="mt-0.5 block leading-relaxed">{authError}</span>
              </div>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name & Company in a responsive 2-col grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-xs font-bold text-[#12233F]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                    placeholder="e.g. Ramesh Kumar"
                    className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-sm text-[#12233F] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F8278] transition-all ${
                      fieldErrors.name ? "border-rose-300 bg-rose-50/30" : "border-[#DCE5ED]"
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-xs text-rose-600 font-medium">{fieldErrors.name}</p>
                )}
              </div>

              {/* Company / Fleet Name */}
              <div className="space-y-1.5">
                <label htmlFor="company" className="block text-xs font-bold text-[#12233F]">
                  Company / Bus Fleet Name
                </label>
                <div className="relative">
                  <Building2 className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="company"
                    type="text"
                    value={company}
                    onChange={(e) => {
                      setCompany(e.target.value);
                      if (fieldErrors.company) {
                        setFieldErrors((prev) => ({ ...prev, company: undefined }));
                      }
                    }}
                    placeholder="e.g. City Express Transit"
                    className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-sm text-[#12233F] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F8278] transition-all ${
                      fieldErrors.company ? "border-rose-300 bg-rose-50/30" : "border-[#DCE5ED]"
                    }`}
                  />
                </div>
                {fieldErrors.company && (
                  <p className="text-xs text-rose-600 font-medium">{fieldErrors.company}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-[#12233F]">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  placeholder="name@buscompany.com"
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-sm text-[#12233F] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F8278] transition-all ${
                    fieldErrors.email ? "border-rose-300 bg-rose-50/30" : "border-[#DCE5ED]"
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-[#12233F]">
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  placeholder="Create a strong password"
                  className={`w-full pl-9 pr-10 py-2 bg-slate-50 border rounded-lg text-sm text-[#12233F] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F8278] transition-all ${
                    fieldErrors.password ? "border-rose-300 bg-rose-50/30" : "border-[#DCE5ED]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-rose-600 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            {/* Role Field tailored for Bus Owners & Company Managers */}
            <div className="space-y-1.5">
              <label htmlFor="role" className="block text-xs font-bold text-[#12233F]">
                Your Role in the Company
              </label>
              <div className="relative">
                <Briefcase className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-[#DCE5ED] rounded-lg text-sm text-[#12233F] focus:outline-none focus:ring-2 focus:ring-[#0F8278] transition-all"
                >
                  <option value="administrator">
                    Bus Fleet Owner / Director (Full Fleet Oversight &amp; Analytics)
                  </option>
                  <option value="dispatcher">
                    Operations &amp; Dispatch Manager (Daily Service &amp; Real-Time Control)
                  </option>
                  <option value="data_manager">
                    Fleet &amp; Depot Maintenance Manager (Vehicle Availability &amp; Staging)
                  </option>
                  <option value="analyst">
                    Route &amp; Scheduling Manager (Timetables &amp; Service Frequency)
                  </option>
                </select>
              </div>
              <p className="text-[11px] text-slate-500 pt-0.5">
                Select your functional responsibility within the transit operator or bus company.
              </p>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-[#0F8278] hover:bg-[#0c6961] focus:outline-none focus:ring-2 focus:ring-[#0F8278] shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account &amp; Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Sign In */}
          <div className="text-center text-xs text-slate-600 pt-1">
            <span>Already have an account? </span>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-bold text-[#0F8278] hover:text-[#0c6961] underline underline-offset-2"
            >
              Sign In
            </Link>
          </div>

          {/* Security Features */}
          <div className="pt-2 border-t border-[#DCE5ED] flex items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0F8278]" />
              Secure HTTP-Only Session
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#0F8278]" />
              Persistent Credentials
            </span>
          </div>
        </div>
      </main>

      {/* Persistent Disclaimer Footer */}
      <footer className="py-4 border-t border-[#DCE5ED] bg-white text-center text-xs text-[#D97706] font-medium px-4">
        <span>Illustrative synthetic operational data — not connected to live BMTC systems.</span>
      </footer>
    </div>
  );
}
