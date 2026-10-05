import { Link } from "@tanstack/react-router";
import { Clock, Users } from "lucide-react";
import type { Recipe } from "@/lib/mock-data";
import { Stars } from "./Stars";
import { VerifiedBadge } from "./VerifiedBadge";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      to="/receita/$recipeId"
      params={{ recipeId: recipe.id }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={recipe.image}
          alt={recipe.title}
          loading="lazy"
          width={1024}
          height={768}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {recipe.verified && (
          <span className="absolute left-3 top-3">
            <VerifiedBadge className="bg-card/95 backdrop-blur" label="Verificada" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {recipe.category}
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-snug text-foreground">{recipe.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">por {recipe.author}</p>
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-2">
            <Stars value={recipe.rating} />
            <span className="text-sm font-semibold text-foreground">{recipe.rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({recipe.reviewsCount})</span>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-cream px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-verified">{recipe.successRate}% deu certo</span>
            <span className="flex items-center gap-1">
              <Users width={12} height={12} /> {recipe.testedCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock width={12} height={12} /> {recipe.timeMinutes} min
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
