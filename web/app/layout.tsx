import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./components/AppShell";

export const metadata: Metadata = {
  title: "HOGANA — Smart Bus Operations & Mobility Intelligence",
  description:
    "Silk Board–Hebbal, Bengaluru service area operational intelligence, headway control, and data centre",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
