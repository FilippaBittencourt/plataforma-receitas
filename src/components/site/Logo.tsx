import { Link } from "@tanstack/react-router";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className} fill="none">
      <path
        d="M14.7 2.4a13.7 13.7 0 1 0 14.9 14.9c-2.3.7-4.6-.9-4.6-3.2 0-.7.2-1.3.6-1.9-2.8.8-5.3-1.3-5.3-4 0-.7.2-1.4.5-2-2.6.6-5.2-.9-6.1-3.8Z"
        fill="#D08A3C"
      />
      <g fill="#6A3520">
        <ellipse cx="10.1" cy="10.3" rx="1.5" ry="2" transform="rotate(28 10.1 10.3)" />
        <ellipse cx="16.3" cy="8.3" rx="1.1" ry="1.5" transform="rotate(-18 16.3 8.3)" />
        <ellipse cx="8.2" cy="17.2" rx="1.2" ry="1.6" transform="rotate(-24 8.2 17.2)" />
        <ellipse cx="15.6" cy="16.1" rx="1.7" ry="2.1" transform="rotate(16 15.6 16.1)" />
        <ellipse cx="12.2" cy="23" rx="1.4" ry="1.8" transform="rotate(28 12.2 23)" />
        <ellipse cx="21.1" cy="22.1" rx="1.1" ry="1.5" transform="rotate(-20 21.1 22.1)" />
      </g>
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" aria-label="Mums!, página inicial" className="flex items-center gap-2.5">
      <LogoMark className="h-7 w-7" />
      {!compact && (
        <span className="font-display text-xl font-semibold tracking-tight text-foreground">
          Mums!
        </span>
      )}
    </Link>
  );
}
