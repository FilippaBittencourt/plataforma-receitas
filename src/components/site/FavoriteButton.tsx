import { useNavigate } from "@tanstack/react-router";
import { Heart, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorite } from "@/lib/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  recipeId,
  className,
  showLabel = false,
}: {
  recipeId: string;
  className?: string;
  showLabel?: boolean;
}) {
  const navigate = useNavigate();
  const { favorite, saving, ready, user, toggle } = useFavorite(recipeId);
  if (user?.role === "moderador") return null;
  const label = favorite ? "Remover dos favoritos" : "Adicionar aos favoritos";

  return (
    <Button
      type="button"
      size={showLabel ? "default" : "icon"}
      variant="outline"
      aria-label={label}
      aria-pressed={favorite}
      title={label}
      disabled={!ready || saving}
      className={cn(
        "rounded-full bg-card/95 shadow-soft backdrop-blur hover:bg-card",
        favorite && "border-caramel text-caramel hover:text-caramel",
        className,
      )}
      onClick={async () => {
        if (!user) {
          const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`;
          await navigate({ to: "/entrar", search: { redirect } });
          return;
        }
        await toggle();
      }}
    >
      {saving ? (
        <LoaderCircle width={18} height={18} className="animate-spin" />
      ) : (
        <Heart
          width={18}
          height={18}
          fill={favorite ? "currentColor" : "none"}
          aria-hidden="true"
        />
      )}
      {showLabel && <span>{favorite ? "Favoritada" : "Favoritar"}</span>}
    </Button>
  );
}
