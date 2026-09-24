interface JsonLdProps {
  data: object;
}

// Renders a schema.org JSON-LD <script> tag.
// Usage: <JsonLd data={organizationJsonLd()} />
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
