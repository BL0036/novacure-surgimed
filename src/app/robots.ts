import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Crawler allow/block list — confirmed by the project owner (Phase 3
// plan §5). Allowed: Googlebot, Google-Extended, GPTBot, PerplexityBot,
// ClaudeBot/anthropic-ai (standard indexing + AI-assistant
// discoverability, the stated goal). Blocked: CCBot (feeds general AI
// training sets with no direct benefit back).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "*", allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
