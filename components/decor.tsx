import type { CSSProperties, ReactNode } from "react";

/** Solid orange circle accent, like the one next to the title in the reference. */
export function OrangeDot({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`inline-block rounded-full bg-accent ${className}`} />;
}

/** Red wavy underline wrapper (see .wavy-underline in globals.css). */
export function Wavy({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`wavy-underline ${className}`}>{children}</span>;
}

/** Hand-drawn style straight line segment (dark blue), absolutely positioned by the caller. */
export function Connector({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <span aria-hidden style={style} className={`absolute rounded-full bg-ink ${className}`} />;
}

/** Hand-drawn wavy vertical arrow, like the connectors in the reference slide. */
export function SquigglyArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 96" fill="none" aria-hidden className={className}>
      <path
        d="M25 6C11 18 39 30 25 44C13 55 36 66 25 82"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M13 70L25 86L37 69"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
