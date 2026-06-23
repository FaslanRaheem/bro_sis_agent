// ============================================================
// src/app/layout.tsx — Root layout rebranded to BROSIS
// ============================================================

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BROSIS — Agentic AI for the Workplace",
    template: "%s | BROSIS",
  },
  description:
    "BROSIS — Agentic AI for the Workplace. Manage leaves, grievances, documents, and get instant HR policy answers.",
  keywords: ["BROSIS", "HR", "Agentic AI", "Leave Management", "AI Assistant"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable} data-scroll-behavior="smooth">
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
