import { Geist, Geist_Mono } from "next/font/google";

// Phase 7 — split into its own module so both root layouts ((site) and
// admin — see "Phase 7 decisions" in README for why there are two) load
// the exact same font instances instead of each calling next/font/google
// separately.
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
