import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo-cookie.png";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src={logo} alt="Cookie" width={32} height={32} className="h-8 w-8" />
      {!compact && (
        <span className="font-display text-xl font-semibold tracking-tight text-foreground">
          Cookie
        </span>
      )}
    </Link>
  );
}
