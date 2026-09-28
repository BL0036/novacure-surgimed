import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { HERO_TRUST_POINTS, SITE_FULL_NAME, type HeroImage } from "@/lib/site";

// Visual upgrade — dark, two-column homepage hero. Copy is unchanged from
// the previous hero (eyebrow, headline, tagline, both button labels); only
// the trust row is new, and it restates facts already on the site.
export function Hero({ image }: { image: HeroImage | null }) {
  return (
    <section className="hero-dark relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 -z-10 h-80 w-80 rounded-full bg-white/[0.04]"
      />
      <div className="page-container grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-hero-muted">
            {SITE_FULL_NAME}
          </p>
          <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
            Quality you can rely on
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-hero-muted">
            Empowering hospitals with reliable surgical, orthopedic, and lab supplies.
            Trusted by professionals across Nepal.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/craftscare/knee" variant="inverse" className="px-5 py-2.5">
              Shop Craftscare
            </Button>
            <Button href="/product-finder" variant="inverseOutline" className="px-5 py-2.5">
              Find the right product
            </Button>
          </div>
          <ul className="mt-10 flex flex-col gap-2.5 text-sm text-hero-muted sm:flex-row sm:flex-wrap sm:gap-x-6">
            {HERO_TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-4 w-4 shrink-0 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* On mobile this stacks below the text (source order). */}
        <div>
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="h-auto w-full rounded-2xl object-cover shadow-2xl shadow-black/40 ring-1 ring-white/10"
            />
          ) : (
            <div
              role="img"
              aria-label="Craftscare product photo coming soon"
              className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/30 bg-white/[0.06] text-center text-hero-muted shadow-2xl shadow-black/30"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                className="h-10 w-10"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="8.5" cy="9.5" r="1.5" />
                <path d="M21 16l-5.5-5.5L3 20" />
              </svg>
              <p className="text-sm">Craftscare product photo — coming soon</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
