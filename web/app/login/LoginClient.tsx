"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Info
} from "lucide-react";
import HoganaBrand from "@/app/components/ui/HoganaBrand";
import Button from "@/app/components/ui/Button";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Client-side validation
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password.trim()) {
      errors.password = "Password is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setAuthError(data.message || "Authentication failed. Please verify your credentials.");
        setIsSubmitting(false);
        return;
      }

      // Successful login -> Redirect to callbackUrl
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

      {/* Main Login Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#DCE5ED] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#12233F]">
              Sign In to HOGANA
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Access the operations control center, interventions console, and service analytics.
            </p>
          </div>

          {/* Authentication Failure Alert */}
          {authError && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in duration-150"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-950">Authentication Failure</span>
                <span className="mt-0.5 block leading-relaxed">{authError}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                  placeholder="operator@hogana.transit"
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold text-[#12233F]">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  placeholder="Enter your password"
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

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-[#0F8278] hover:bg-[#0c6961] focus:outline-none focus:ring-2 focus:ring-[#0F8278] shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Operations</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Pilot Evaluation Credentials Notice */}
          <div className="p-3 bg-[#EAF4F7] border border-[#0F8278]/25 rounded-xl text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-[#0F8278]">
                <Info className="h-3.5 w-3.5" />
                <span>Pilot Evaluation Access</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail("operator@hogana.transit");
                  setPassword("HoganaOps@2025!");
                  setFieldErrors({});
                  setAuthError(null);
                }}
                className="text-[11px] font-bold text-[#0F8278] hover:text-[#0c6961] underline cursor-pointer"
              >
                Auto-fill credentials
              </button>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              For pilot verification, use authorized credentials:
              <br />
              Email: <code className="font-mono text-[#12233F] font-semibold">operator@hogana.transit</code>
              <br />
              Password: <code className="font-mono text-[#12233F] font-semibold">HoganaOps@2025!</code>{" "}
              <span className="text-[10px] text-slate-500">(Letter 'O', not number zero)</span>
            </p>
          </div>

          {/* Security Features */}
          <div className="pt-2 border-t border-[#DCE5ED] flex items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0F8278]" />
              HTTP-Only Cookies
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#0F8278]" />
              Scrypt Hashed
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
