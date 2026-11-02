import { Suspense } from "react";
import LoginClient from "./LoginClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — HOGANA Mobility Intelligence",
  description: "Sign in to access HOGANA service operations, interventions console, and analytics."
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
          <div className="h-8 w-8 border-2 border-[#0F8278]/30 border-t-[#0F8278] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
