import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function RecipePhotoPlaceholder({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Foto não adicionada"
      className={cn(
        "flex items-center justify-center gap-2 bg-cream text-muted-foreground",
        className,
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-caramel shadow-soft">
        <ImageOff width={18} height={18} />
      </span>
      <span className="text-xs font-medium">Foto não adicionada</span>
    </div>
  );
}
