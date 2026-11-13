import { api, apiUrl } from "@/lib/api";
import type { Criteria, Recipe } from "@/lib/mock-data";
import placeholder from "@/assets/recipe-1.jpg";
import { encodeIngredientSection, getRecipeIngredientSectionTitle } from "@/lib/recipe-steps";

export type RecipeDto = {
  id: number;
  titulo: string;
  resumo: string | null;
  fotoPrincipal: string | null;
  tempoPreparo: number;
  rendimento: string | null;
  dificuldade: string | null;
  faixaCusto: string | null;
  origem: string;
  urlFonte: string | null;
  status?: "APROVADA" | "PENDENTE" | "RECUSADA";
  categoria: { nome: string; slug: string };
  autor: { id?: number; nome: string; nomeUsuario: string } | null;
  estatisticas: {
    totalAvaliacoes: number;
    totalTestadores: number;
    mediaGeral: number | null;
    taxaSucesso: number | null;
    verificada: boolean;
    criterios?: Partial<Criteria>;
  };
  ingredientes?: {
    ingrediente: string;
    quantidade: number | null;
    unidadeMedida: string | null;
    observacao?: string | null;
  }[];
  passos?: string[];
};

const emptyCriteria: Criteria = { medidas: 0, tempo: 0, rendimento: 0, clareza: 0, resultado: 0 };
export function toRecipe(r: RecipeDto): Recipe {
  const criterios = r.estatisticas.criterios;
  const criteria: Criteria = {
    medidas: criterios?.medidas ?? emptyCriteria.medidas,
    tempo: criterios?.tempo ?? emptyCriteria.tempo,
    rendimento: criterios?.rendimento ?? emptyCriteria.rendimento,
    clareza: criterios?.clareza ?? emptyCriteria.clareza,
    resultado: criterios?.resultado ?? emptyCriteria.resultado,
  };
  return {
    id: String(r.id),
    title: r.titulo,
    author: r.autor?.nome ?? "Autor removido",
    authorHandle: r.autor?.nomeUsuario ?? "",
    authorId: r.autor?.id == null ? null : String(r.autor.id),
    status: r.status,
    image: r.fotoPrincipal ? apiUrl(r.fotoPrincipal) : placeholder,
    hasPhoto: Boolean(r.fotoPrincipal),
    category: r.categoria.nome,
    categorySlug: r.categoria.slug,
    difficulty:
      r.dificuldade === "CHEF"
        ? "Chef"
        : r.dificuldade === "DIFICIL" || r.dificuldade === "AVANCADO"
          ? "Difícil"
          : r.dificuldade === "MEDIO"
            ? "Médio"
            : r.dificuldade === "FACIL"
              ? "Fácil"
              : "-",
    cost:
      r.faixaCusto === "MUITO_ALTO"
        ? "Muito alto"
        : r.faixaCusto === "BAIXO"
          ? "Baixo"
          : r.faixaCusto === "MEDIO"
            ? "Médio"
            : r.faixaCusto === "ALTO"
              ? "Alto"
              : "-",
    rating: r.estatisticas.mediaGeral ?? 0,
    reviewsCount: r.estatisticas.totalAvaliacoes,
    successRate: r.estatisticas.taxaSucesso ?? 0,
    testedCount: r.estatisticas.totalTestadores,
    verified: r.estatisticas.verificada,
    timeMinutes: r.tempoPreparo,
    yield: r.rendimento?.trim() || "-",
    summary: r.resumo ?? "",
    ingredients: (r.ingredientes ?? []).flatMap((i, index, list) => {
      const title = getRecipeIngredientSectionTitle(i.observacao);
      const previousTitle =
        index > 0 ? getRecipeIngredientSectionTitle(list[index - 1]?.observacao) : null;
      return [
        ...(title && title !== previousTitle ? [encodeIngredientSection(title)] : []),
        [i.quantidade, i.unidadeMedida, i.ingrediente].filter(Boolean).join(" "),
      ];
    }),
    steps: r.passos ?? [],
    criteria,
    communityPhotos: [],
    reviews: [],
  };
}

export async function searchRecipes(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== "") query.set(key, String(value));
  const result = await api<{ itens: RecipeDto[] }>(`/api/receitas?${query}`);
  return result.itens.map(toRecipe);
}
export async function searchRecipesPage(
  params: Record<string, string | number | boolean | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== "") query.set(key, String(value));
  return api<{ itens: RecipeDto[]; total: number }>(`/api/receitas?${query}`);
}
export async function getRecipe(id: string) {
  return toRecipe(await api<RecipeDto>(`/api/receitas/${id}`));
}
