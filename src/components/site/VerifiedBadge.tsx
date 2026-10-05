import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({ className, label = "Receita Verificada" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-verified/12 px-2.5 py-1 text-xs font-semibold text-verified",
        className,
      )}
    >
      <BadgeCheck width={14} height={14} strokeWidth={2} />
      {label}
    </span>
  );
}
