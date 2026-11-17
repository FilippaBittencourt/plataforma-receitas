import { api } from "@/lib/api";

export type RecipeCategory = { id: string; label: string; count: number };

export async function getRecipeCategories(): Promise<RecipeCategory[]> {
  const categories =
    await api<{ slug: string; nome: string; totalReceitas: number }[]>("/api/categorias");
  return categories.map((category) => ({
    id: category.slug,
    label: category.nome,
    count: category.totalReceitas,
  }));
}
