import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getEnquiryById, ENQUIRY_STATUSES } from "@/lib/admin/enquiries";
import { updateEnquiryStatusAction } from "@/lib/admin/actions/enquiries";
import { Label } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Enquiry" };

const SELECT_CLASSES =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default async function AdminEnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const enquiry = await getEnquiryById(id);

  if (!enquiry) {
    notFound();
  }

  const boundUpdateStatus = updateEnquiryStatusAction.bind(null, id);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <p className="text-small-muted">
        <Link href="/admin/enquiries" className="hover:underline">
          Enquiries
        </Link>
      </p>
      <h1 className="text-page-title mt-1">{enquiry.customerName}</h1>
      <p className="text-body-muted mt-1">
        Received {new Date(enquiry.createdAt).toLocaleString()}
        {enquiry.updatedAt !== enquiry.createdAt
          ? ` · Updated ${new Date(enquiry.updatedAt).toLocaleString()}`
          : ""}
      </p>

      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-eyebrow">Product</h2>
        {enquiry.productName ? (
          <p className="mt-2 text-sm">
            {enquiry.categorySlug && enquiry.productSlug ? (
              <Link
                href={`/craftscare/${enquiry.categorySlug}/${enquiry.productSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:underline"
              >
                {enquiry.productName}
              </Link>
            ) : (
              enquiry.productName
            )}
            {enquiry.variantSizeLabel ? ` — ${enquiry.variantSizeLabel}` : ""}
            {enquiry.variantSku ? (
              <span className="text-body-muted"> (SKU {enquiry.variantSku})</span>
            ) : null}
          </p>
        ) : (
          <p className="text-body-muted mt-2">
            General enquiry — not attached to a specific product (e.g. from the
            Hospitals &amp; Pharmacies page).
          </p>
        )}
        <p className="text-body-muted mt-1">Quantity: {enquiry.quantity}</p>
      </section>

      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-eyebrow">Contact</h2>
        <dl className="text-body-muted mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-foreground">Phone</dt>
            <dd className="mt-0.5">
              <a href={`tel:${enquiry.phone}`} className="hover:underline">
                {enquiry.phone}
              </a>
            </dd>
          </div>
          {enquiry.email ? (
            <div>
              <dt className="text-sm font-medium text-foreground">Email</dt>
              <dd className="mt-0.5">
                <a href={`mailto:${enquiry.email}`} className="hover:underline">
                  {enquiry.email}
                </a>
              </dd>
            </div>
          ) : null}
          {enquiry.organizationName ? (
            <div>
              <dt className="text-sm font-medium text-foreground">Organization</dt>
              <dd className="mt-0.5">{enquiry.organizationName}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-sm font-medium text-foreground">Address / area</dt>
            <dd className="mt-0.5">{enquiry.addressOrArea}</dd>
          </div>
        </dl>
        {enquiry.message ? (
          <div className="mt-3">
            <p className="text-sm font-medium text-foreground">Message</p>
            <p className="text-body-muted mt-0.5 whitespace-pre-line">
              {enquiry.message}
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-eyebrow">Status</h2>
        <form action={boundUpdateStatus} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="max-w-xs flex-1">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={enquiry.status}
              className={SELECT_CLASSES}
            >
              {ENQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Update status
          </Button>
        </form>
      </section>
    </div>
  );
}
