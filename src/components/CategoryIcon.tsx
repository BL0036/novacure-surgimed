import type { ReactElement } from "react";

// Visual upgrade — one consistent line-icon set for the "Shop by body
// area" tiles. All icons share the same 24x24 grid, 1.5 stroke, round caps
// and joins, and no fill, so they read as a family. They are purely
// decorative (aria-hidden): the tile's text label stays the accessible
// name. Drawn inline rather than pulling in an icon library — 11 small
// paths don't justify a dependency.

const ICONS: Record<string, ReactElement> = {
  // head + shoulders with a collar band at the neck
  "Cervical & Neck": (
    <>
      <circle cx="12" cy="6.5" r="3" />
      <path d="M9.2 12.2h5.6" />
      <path d="M5 21v-2.5a7 7 0 0 1 14 0V21" />
    </>
  ),
  // stacked vertebrae
  "Back & Lumbar/Abdominal": (
    <>
      <rect x="9" y="3" width="6" height="3.4" rx="1.2" />
      <rect x="9" y="8" width="6" height="3.4" rx="1.2" />
      <rect x="9" y="13" width="6" height="3.4" rx="1.2" />
      <rect x="9" y="18" width="6" height="3" rx="1.2" />
    </>
  ),
  // joint + upper arm / forearm
  "Shoulder & Arm": (
    <>
      <path d="M3.5 4.5V12" />
      <circle cx="9" cy="8" r="3" />
      <rect x="7.6" y="11.6" width="3.2" height="9" rx="1.6" transform="rotate(-18 9.2 12)" />
    </>
  ),
  // bent limb with the joint circled
  Elbow: (
    <>
      <rect x="5.5" y="3" width="3.2" height="8.5" rx="1.6" />
      <circle cx="7.1" cy="14" r="2.5" />
      <rect x="10.6" y="12.4" width="9.4" height="3.2" rx="1.6" />
    </>
  ),
  // open hand
  "Wrist & Hand": (
    <>
      <path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V13" />
      <path d="M17 13v-1.5a1.5 1.5 0 0 1 3 0V15c0 4-2.5 6.5-6.5 6.5-2.5 0-4-1-5.2-3L4.6 13.3a1.5 1.5 0 0 1 2.5-1.6L8 13" />
    </>
  ),
  // femur, kneecap, tibia
  Knee: (
    <>
      <rect x="10.4" y="3" width="3.2" height="6.4" rx="1.6" />
      <circle cx="12" cy="12" r="2.6" />
      <rect x="10.4" y="14.7" width="3.2" height="6.3" rx="1.6" />
    </>
  ),
  // foot in profile
  "Ankle & Foot": (
    <>
      <path d="M8 3v9l-3.6 5.2A2 2 0 0 0 6 20.5h11.5a2.5 2.5 0 0 0 0-5H15L12.5 12V3" />
      <path d="M8 7.5h4.5" />
    </>
  ),
  // overhead bar, pulley, hanging weight
  "Traction & Immobilization Equipment": (
    <>
      <path d="M4 3.5h16" />
      <circle cx="12" cy="8" r="2.5" />
      <path d="M12 10.5V15" />
      <rect x="9" y="15" width="6" height="5.5" rx="1.2" />
    </>
  ),
  // blood drop
  Vascular: <path d="M12 3s6.2 6.6 6.2 11.2a6.2 6.2 0 0 1-12.4 0C5.8 9.6 12 3 12 3Z" />,
  // sternum + rib arcs
  Chest: (
    <>
      <path d="M12 3.5v17" />
      <path d="M12 7.5c-3 0-5.5 1-7 3M12 7.5c3 0 5.5 1 7 3" />
      <path d="M12 12c-3 0-5.5 1-7 3M12 12c3 0 5.5 1 7 3" />
      <path d="M12 16.5c-2.4 0-4.4.8-5.8 2.4M12 16.5c2.4 0 4.4.8 5.8 2.4" />
    </>
  ),
  // shipping box
  "Consumables & Equipment": (
    <>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
      <path d="M3.5 7.5 12 12l8.5-4.5" />
      <path d="M12 12v9" />
    </>
  ),
};

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[category] ?? ICONS["Consumables & Equipment"]}
    </svg>
  );
}
