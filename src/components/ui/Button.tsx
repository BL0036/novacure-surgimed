import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Visually marks this as the active/selected option in a toggle
   * group (e.g. the current sort or size filter). Purely presentational
   * — pair it with aria-current on the caller's side where relevant. */
  active?: boolean;
  className?: string;
  children: ReactNode;
}

type LinkButtonProps = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "color"> & {
    href: string;
  };

type NativeButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "color"> & {
    href?: undefined;
  };

export type ButtonProps = LinkButtonProps | NativeButtonProps;

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "transition-colors focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-brand focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background disabled:pointer-events-none " +
  "disabled:opacity-50";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-sm",
  md: "px-4 py-2 text-sm",
};

// primary/secondary/ghost per Master Plan Phase 5 §3. "active" swaps a
// variant to its filled/selected look — used by CategoryFilterBar so the
// same three variants cover both CTA buttons and toggle chips instead of
// inventing a fourth "toggle" variant.
function variantClasses(variant: ButtonVariant, active?: boolean): string {
  if (active) {
    return "bg-brand text-white hover:bg-brand-dark";
  }
  switch (variant) {
    case "primary":
      return "bg-brand text-white hover:bg-brand-dark";
    case "secondary":
      return "border border-border text-foreground hover:bg-brand-tint hover:border-brand";
    case "ghost":
      return "text-foreground hover:bg-brand-tint";
  }
}

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    fullWidth,
    active,
    className,
    children,
    ...rest
  } = props;

  const classes = [
    BASE_CLASSES,
    variantClasses(variant, active),
    SIZE_CLASSES[size],
    fullWidth ? "w-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in rest && rest.href) {
    const { href, ...anchorProps } =
      rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
