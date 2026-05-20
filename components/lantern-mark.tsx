/** The Lantern brand glyph — a stroked lantern that sits inline with
 *  the lucide icon set used across the UI. Colour follows currentColor. */
export function LanternMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6.1a3 2.7 0 0 1 6 0" />
      <path d="M7.4 8.3h9.2" />
      <rect x="8" y="9.6" width="8" height="9" rx="2.4" />
      <path d="M9.6 18.9h4.8" />
      <path
        d="M12 12.4c2 1.7 2 3.8 0 5.4c-2-1.6-2-3.7 0-5.4z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
