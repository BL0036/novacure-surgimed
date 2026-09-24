import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Crawler allow/block list — confirmed by the project owner (Phase 3
// plan §5). Allowed: Googlebot, Google-Extended, GPTBot, PerplexityBot,
// ClaudeBot/anthropic-ai (standard indexing + AI-assistant
// discoverability, the stated goal). Blocked: CCBot (feeds general AI
// training sets with no direct benefit back).
// Crawler allow/block list — confirmed by the project owner (Phase 3
// plan §5). Allowed: Googlebot, Google-Extended, GPTBot, PerplexityBot,
// ClaudeBot/anthropic-ai (standard indexing + AI-assistant
// discoverability, the stated goal). Blocked: CCBot (feeds general AI
// training sets with no direct benefit back). /admin is disallowed for
// everyone (Phase 7) — belt-and-braces alongside its own noindex
// metadata and session-gated layout.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Googlebot", allow: "/", disallow: "/admin" },
      { userAgent: "Google-Extended", allow: "/", disallow: "/admin" },
      { userAgent: "GPTBot", allow: "/", disallow: "/admin" },
      { userAgent: "PerplexityBot", allow: "/", disallow: "/admin" },
      { userAgent: "ClaudeBot", allow: "/", disallow: "/admin" },
      { userAgent: "anthropic-ai", allow: "/", disallow: "/admin" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "*", allow: "/", disallow: "/admin" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
