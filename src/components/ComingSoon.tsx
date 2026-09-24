import type { ReactNode } from "react";

interface ComingSoonProps {
  title: string;
  note: string;
  children?: ReactNode;
}

// Used by placeholder routes so every "not built yet" page reads the same
// way, rather than each page inventing its own copy. Phase 8/9 replace
// these with real listing/detail pages backed by the database.
export function ComingSoon({ title, note, children }: ComingSoonProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <h1 className="text-page-title">{title}</h1>
      <p className="text-body-muted mt-3">{note}</p>
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  );
}
