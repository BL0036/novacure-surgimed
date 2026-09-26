import type { Metadata } from "next";
import Link from "next/link";
import {
  listEnquiriesAdmin,
  ENQUIRY_STATUSES,
  type EnquiryStatus,
} from "@/lib/admin/enquiries";

export const metadata: Metadata = { title: "Enquiries" };

const STATUS_BADGE: Record<EnquiryStatus, string> = {
  new: "text-brand",
  contacted: "text-warning",
  confirmed: "text-success",
  fulfilled: "text-success",
  cancelled: "text-muted",
};

function isEnquiryStatus(value: string | undefined): value is EnquiryStatus {
  return !!value && (ENQUIRY_STATUSES as string[]).includes(value);
}

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = isEnquiryStatus(statusParam) ? statusParam : undefined;

  const enquiries = await listEnquiriesAdmin({ status });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-page-title">Enquiries</h1>
      <p className="text-body-muted mt-2">
        Product and hospital/pharmacy requests submitted from the site — no orders
        or payments happen automatically; each one is followed up by hand.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 border-b border-border text-sm">
        <Link
          href="/admin/enquiries"
          className={`-mb-px border-b-2 px-1 pb-2 ${
            !status
              ? "border-brand font-medium text-brand"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          All
        </Link>
        {ENQUIRY_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/enquiries?status=${s}`}
            className={`-mb-px border-b-2 px-1 pb-2 ${
              status === s
                ? "border-brand font-medium text-brand"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-brand-tint text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2 font-semibold">Customer</th>
              <th className="px-4 py-2 font-semibold">Product</th>
              <th className="px-4 py-2 font-semibold">Qty</th>
              <th className="px-4 py-2 font-semibold">Status</th>
              <th className="px-4 py-2 font-semibold">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {enquiries.map((enquiry) => (
              <tr key={enquiry.id} className="hover:bg-brand-tint">
                <td className="px-4 py-2.5 font-medium text-foreground">
                  <Link
                    href={`/admin/enquiries/${enquiry.id}`}
                    className="hover:text-brand hover:underline"
                  >
                    {enquiry.customerName}
                  </Link>
                  {enquiry.organizationName ? (
                    <span className="text-body-muted font-normal">
                      {" "}
                      — {enquiry.organizationName}
                    </span>
                  ) : null}
                </td>
                <td className="text-body-muted px-4 py-2.5">
                  {enquiry.productName
                    ? `${enquiry.productName}${
                        enquiry.variantSizeLabel ? ` (${enquiry.variantSizeLabel})` : ""
                      }`
                    : "General enquiry"}
                </td>
                <td className="text-body-muted px-4 py-2.5">{enquiry.quantity}</td>
                <td
                  className={`px-4 py-2.5 font-medium ${STATUS_BADGE[enquiry.status]}`}
                >
                  {enquiry.status}
                </td>
                <td className="text-small-muted px-4 py-2.5">
                  {new Date(enquiry.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {enquiries.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-body-muted px-4 py-6 text-center">
                  No enquiries{status ? ` with status "${status}"` : ""} yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
