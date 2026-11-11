import { Link } from "@tanstack/react-router";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <circle cx="16" cy="16" r="14" fill="#D08A3C" />
      <g fill="#6A3520">
        <circle cx="12.4" cy="7.8" r="2.3" />
        <circle cx="19.8" cy="7.3" r="1.1" />
        <circle cx="7" cy="14" r="1.2" />
        <circle cx="15.9" cy="16.7" r="1.6" />
        <circle cx="23.1" cy="14" r="2.5" />
        <circle cx="8.9" cy="22" r="2.5" />
        <circle cx="23.4" cy="22.2" r="1.3" />
      </g>
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" aria-label="Lipapa, página inicial" className="flex items-center gap-2.5">
      <LogoMark className="h-7 w-7" />
      {!compact && (
        <span className="font-display text-xl font-semibold tracking-tight text-foreground">
          Lipapa
        </span>
      )}
    </Link>
  );
}
