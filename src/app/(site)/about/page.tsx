import type { Metadata } from "next";
import { SITE_FULL_NAME } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: `About ${SITE_FULL_NAME}.`,
  path: "/about",
});

// Phase 12 §3 — static page, revalidates hourly rather than the 300s
// product/category window.
export const revalidate = 3600;

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <p className="text-eyebrow">About</p>
      <h1 className="text-page-title mt-2">{SITE_FULL_NAME}</h1>
      <p className="text-body-muted mt-4 max-w-2xl">
        At NovaCure SurgiMed, we are dedicated to providing reliable and high-quality
        surgical, orthopedic, and lab reagent products to healthcare institutions
        across Nepal. Based in Mahalaxmi, Lalitpur, our company combines experience
        and innovation to meet the evolving needs of hospitals and medical
        professionals. With a focus on customer satisfaction and product integrity,
        we aim to support better healthcare delivery through trusted medical
        supplies.
      </p>
      <p className="text-small-muted mt-6">Founded by Deepmala Lamichhane.</p>
    </div>
  );
}
