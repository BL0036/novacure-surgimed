import type { Metadata } from "next";
import Link from "next/link";
import { listVerificationFlags } from "@/lib/admin/verification-flags";

export const metadata: Metadata = { title: "Verification flags" };

export default async function VerificationFlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show } = await searchParams;
  const showResolved = show === "resolved";

  const flags = await listVerificationFlags({ resolved: showResolved });

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-page-title">Verification flags</h1>
      <p className="text-body-muted mt-2">
        Data-quality issues surfaced by the Phase 1 catalogue import — price
        discrepancies, missing ref codes, missing photos, and the remaining open
        questions from the original CSV.
      </p>

      <div className="mt-4 flex gap-4 border-b border-border text-sm">
        <Link
          href="/admin/verification-flags"
          className={`-mb-px border-b-2 px-1 pb-2 ${
            !showResolved
              ? "border-brand font-medium text-link"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Open
        </Link>
        <Link
          href="/admin/verification-flags?show=resolved"
          className={`-mb-px border-b-2 px-1 pb-2 ${
            showResolved
              ? "border-brand font-medium text-link"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Resolved
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {flags.map((flag) => (
          <Link
            key={flag.id}
            href={`/admin/products/${flag.productId}`}
            className="block rounded-lg border border-border p-4 transition-colors hover:border-brand hover:bg-brand-tint"
          >
            <p className="text-sm font-medium text-foreground">
              {flag.productName}{" "}
              <span className="text-body-muted font-normal">— {flag.issueType}</span>
            </p>
            {flag.note ? <p className="text-body-muted mt-1">{flag.note}</p> : null}
          </Link>
        ))}

        {flags.length === 0 ? (
          <p className="text-body-muted">
            {showResolved
              ? "No resolved flags yet."
              : "No open flags — everything's resolved."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
