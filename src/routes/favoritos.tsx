import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Shell } from "@/components/site/Shell";
import { RequireAuth } from "@/components/site/RequireAuth";
import { RecipeCard } from "@/components/site/RecipeCard";
import { api } from "@/lib/api";
import { favoriteRecipesQueryKey } from "@/lib/favorites";
import type { Recipe } from "@/lib/mock-data";
import { toRecipe, type RecipeDto } from "@/lib/recipes-api";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Receitas favoritas — Mums!" },
      { name: "description", content: "As receitas que você salvou para preparar depois." },
    ],
  }),
  component: FavoritosPage,
});

function FavoritosPage() {
  return (
    <Shell>
      <RequireAuth disallowRole="moderador">
        <FavoritosContent />
      </RequireAuth>
    </Shell>
  );
}

function FavoritosContent() {
  const { user } = useAuth();
  const favorites = useQuery({
    queryKey: favoriteRecipesQueryKey(user?.id),
    queryFn: async (): Promise<Recipe[]> =>
      (await api<RecipeDto[]>("/api/me/favoritos")).map(toRecipe),
    enabled: Boolean(user),
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-warm text-caramel">
          <Heart width={21} height={21} fill="currentColor" />
        </span>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Receitas favoritas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            As receitas que você salvou para preparar depois.
          </p>
        </div>
      </div>

      {favorites.isError && (
        <p role="alert" className="mt-8 text-sm text-destructive">
          {favorites.error instanceof Error
            ? favorites.error.message
            : "Não foi possível carregar os favoritos."}
        </p>
      )}

      {favorites.isPending ? (
        <p className="mt-10 text-sm text-muted-foreground">Carregando favoritos…</p>
      ) : favorites.data?.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.data.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : !favorites.isError ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border p-12 text-center">
          <Heart width={28} height={28} className="mx-auto text-caramel" />
          <p className="mt-4 font-semibold text-foreground">Você ainda não favoritou receitas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Toque no coração de uma receita para encontrá-la aqui.
          </p>
        </div>
      ) : null}
    </div>
  );
}
