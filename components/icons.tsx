/**
 * One minimal icon set for the whole app: 24px grid, 1.5 stroke, round caps,
 * no fills. Everything inherits `currentColor` and sizes from the `className`
 * the caller passes, so icons always match the text they sit beside.
 *
 * Anything that used to be a literal glyph in copy (arrows, warning signs)
 * comes from here instead, so weight and alignment stay consistent.
 */
type IconProps = { className?: string };

function Svg({ className = "w-4 h-4", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/**
 * App mark: a full classroom with one student left standing outside it, which
 * is the whole premise of the tool. Vector twin of app/icon.png so the tab
 * icon and the in-app logo are the same drawing.
 */
export function LogoMark({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="2.6" y="2.6" width="16.6" height="16.6" rx="4.4" stroke="currentColor" strokeWidth="1.7" />
      <g fill="currentColor">
        <circle cx="7.4" cy="7.4" r="1.25" />
        <circle cx="10.9" cy="7.4" r="1.25" />
        <circle cx="14.4" cy="7.4" r="1.25" />
        <circle cx="7.4" cy="10.9" r="1.25" />
        <circle cx="10.9" cy="10.9" r="1.25" />
        <circle cx="14.4" cy="10.9" r="1.25" />
        <circle cx="7.4" cy="14.4" r="1.25" />
        <circle cx="10.9" cy="14.4" r="1.25" />
        <circle cx="14.4" cy="14.4" r="1.25" />
        <circle cx="20.9" cy="20.9" r="1.6" />
      </g>
    </svg>
  );
}

export function MapIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 20 3.5 17.5V4L9 6.5m0 13.5 6-2.5m-6 2.5V6.5m6 11L20.5 20V6.5L15 4m0 13.5V4m0 0L9 6.5" />
    </Svg>
  );
}

export function BookIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 6.5C10.4 5 8.3 4.2 6 4.2c-.9 0-1.8.1-2.6.4v13.6c.8-.3 1.7-.4 2.6-.4 2.3 0 4.4.8 6 2.2m0-13.5c1.6-1.5 3.7-2.3 6-2.3.9 0 1.8.1 2.6.4v13.6c-.8-.3-1.7-.4-2.6-.4-2.3 0-4.4.8-6 2.2m0-13.5V20" />
    </Svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.2-4.2" />
    </Svg>
  );
}

export function ArrowLeftIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
    </Svg>
  );
}

export function ArrowRightIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 12h14m0 0-6-6m6 6-6 6" />
    </Svg>
  );
}

export function ExternalIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M14 4h6v6M20 4l-9 9M18 14.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4.5" />
    </Svg>
  );
}

export function AlertIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.75v5M12 16.1h.01" />
    </Svg>
  );
}

export function InfoIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 16.25v-5M12 7.9h.01" />
    </Svg>
  );
}
