import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";
import { api } from "@/lib/api";
import { toast } from "@/lib/feedback";

export const favoriteIdsQueryKey = (userId: string | undefined) => ["favoritos", userId] as const;
export const favoriteRecipesQueryKey = (userId: string | undefined) =>
  ["receitas-favoritas", userId] as const;

export function useFavorite(recipeId: string) {
  const { ready, user } = useAuth();
  const queryClient = useQueryClient();
  const numericId = Number(recipeId);
  const queryKey = favoriteIdsQueryKey(user?.id);
  const favorites = useQuery({
    queryKey,
    queryFn: () => api<number[]>("/api/me/favoritos/ids"),
    enabled: Boolean(ready && user && user.role !== "moderador" && Number.isFinite(numericId)),
  });
  const mutation = useMutation({
    mutationFn: (favorite: boolean) =>
      api(`/api/receitas/${recipeId}/favorito`, { method: favorite ? "DELETE" : "PUT" }),
    onMutate: async (favorite) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<number[]>(queryKey) ?? [];
      queryClient.setQueryData<number[]>(
        queryKey,
        favorite ? previous.filter((id) => id !== numericId) : [numericId, ...previous],
      );
      return { previous };
    },
    onError: (error, _favorite, context) => {
      if (context) queryClient.setQueryData(queryKey, context.previous);
      toast.error(
        error instanceof Error ? error.message : "Não foi possível atualizar os favoritos.",
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
      if (user) void queryClient.invalidateQueries({ queryKey: favoriteRecipesQueryKey(user.id) });
    },
  });
  const ids = favorites.data ?? [];
  return {
    favorite: ids.includes(numericId),
    saving: mutation.isPending,
    ready: ready && (!user || user.role !== "moderador"),
    user,
    toggle: () => mutation.mutateAsync(ids.includes(numericId)),
  };
}
