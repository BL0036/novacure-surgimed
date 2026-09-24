import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

// Phase 5 §7 — styling-only primitives. No form on the site actually
// submits data yet (that's Phase 11); these exist so Phase 11 doesn't
// have to invent input/label/error styling from scratch, and so any
// input built before then (like SearchForm) can share one look.

const FIELD_BASE_CLASSES =
  "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground " +
  "placeholder:text-muted transition-colors focus:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background disabled:cursor-not-allowed " +
  "disabled:opacity-50";

function fieldStateClasses(invalid?: boolean): string {
  return invalid
    ? "border-danger focus:border-danger focus-visible:ring-danger"
    : "border-border focus:border-brand focus-visible:ring-brand";
}

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  /** Visually hide the label while keeping it in the accessibility tree
   * (e.g. a search box next to a visible page heading). */
  srOnly?: boolean;
}

export function Label({ children, srOnly, className, ...rest }: LabelProps) {
  const classes = srOnly
    ? "sr-only"
    : ["mb-1.5 block text-sm font-medium text-foreground", className ?? ""]
        .filter(Boolean)
        .join(" ");
  return (
    <label className={classes} {...rest}>
      {children}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className, ...rest }: InputProps) {
  const classes = [FIELD_BASE_CLASSES, fieldStateClasses(invalid), className ?? ""]
    .filter(Boolean)
    .join(" ");
  return <input className={classes} aria-invalid={invalid || undefined} {...rest} />;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid, className, ...rest }: TextareaProps) {
  const classes = [
    FIELD_BASE_CLASSES,
    fieldStateClasses(invalid),
    "min-h-28 resize-y",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return <textarea className={classes} aria-invalid={invalid || undefined} {...rest} />;
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger">
      {children}
    </p>
  );
}

export function FieldHelperText({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs text-muted">{children}</p>;
}
