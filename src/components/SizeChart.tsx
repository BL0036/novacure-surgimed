// Phase 9 §2 — measurementData is free-form JSON per schema.prisma (it
// "varies by product type"), so this doesn't assume every variant's data
// matches the shape below — it checks first and renders nothing if it
// doesn't, rather than crashing or showing garbage. The one real example
// so far (Lumbar Sacro Belt, S/M/L/XL) is size -> { in, cm }, which is
// what this renders as a table.

interface SizeMeasurement {
  in?: string;
  cm?: string;
}

type SizeChartData = Record<string, SizeMeasurement>;

// Exported (Phase 13 §6) so this shape check can be unit tested directly
// against the range of measurementData shapes that can actually reach
// it — good/partial/malformed JSON, empty objects, arrays, etc. — rather
// than only indirectly through rendering the component.
export function isSizeChartData(data: unknown): data is SizeChartData {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length === 0) return false;
  return entries.every(([, value]) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const v = value as Record<string, unknown>;
    const hasIn = v.in === undefined || typeof v.in === "string";
    const hasCm = v.cm === undefined || typeof v.cm === "string";
    return hasIn && hasCm && (v.in !== undefined || v.cm !== undefined);
  });
}

export function SizeChart({ data }: { data: unknown }) {
  if (!isSizeChartData(data)) return null;

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-foreground">Size chart</h3>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="py-1.5 pr-4 font-medium">Size</th>
            <th className="py-1.5 pr-4 font-medium">Inches</th>
            <th className="py-1.5 font-medium">Centimeters</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([size, measurement]) => (
            <tr key={size} className="border-b border-border last:border-0">
              <td className="py-1.5 pr-4 font-medium text-foreground">{size}</td>
              <td className="py-1.5 pr-4 text-body-muted">{measurement.in ?? "—"}</td>
              <td className="py-1.5 text-body-muted">{measurement.cm ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
