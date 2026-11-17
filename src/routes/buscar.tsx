import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle, Search, SlidersHorizontal } from "lucide-react";
import { Shell } from "@/components/site/Shell";
import { RecipeCard } from "@/components/site/RecipeCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRecipeCategories, type RecipeCategory } from "@/lib/categories-api";
import { searchRecipesPage, toRecipe } from "@/lib/recipes-api";
import type { Recipe } from "@/lib/mock-data";

type SearchParams = { q: string };

export const Route = createFileRoute("/buscar")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Buscar receitas testadas — Mums!" },
      {
        name: "description",
        content:
          "Filtre receitas por categoria, tempo, dificuldade e taxa de sucesso da comunidade.",
      },
      { property: "og:title", content: "Buscar receitas testadas — Mums!" },
      { property: "og:description", content: "Filtros por sucesso real, tempo e dificuldade." },
    ],
  }),
  component: BuscarPage,
});

function BuscarPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);
  const [cats, setCats] = useState<string[]>([]);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [minSuccess, setMinSuccess] = useState(0);
  const [ingredient, setIngredient] = useState("");
  const [sort, setSort] = useState("relevancia");
  const [results, setResults] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [categoryError, setCategoryError] = useState("");
  const [pagina, setPagina] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getRecipeCategories()
      .then((items) => {
        if (active) setCategories(items);
      })
      .catch((e) => {
        if (active)
          setCategoryError(
            e instanceof Error ? e.message : "Não foi possível carregar categorias.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const order =
      sort === "nota" || sort === "relevancia"
        ? "melhores"
        : sort === "testadas"
          ? "mais-testadas"
          : sort === "sucesso"
            ? "taxa-sucesso"
            : sort === "tempo"
              ? "menor-tempo"
              : "recentes";
    setLoading(true);
    searchRecipesPage({
      q,
      categoria: cats.length ? cats.join(",") : undefined,
      ingrediente: ingredient.trim() || undefined,
      verificadas: onlyVerified,
      taxaSucessoMinima: minSuccess,
      ordem: order,
      pagina,
      tamanho: 12,
    })
      .then((page) => {
        if (active) {
          setResults(page.itens.map(toRecipe));
          setTotal(page.total);
          setTotalPaginas(page.totalPaginas);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Erro ao buscar receitas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [q, cats, onlyVerified, minSuccess, sort, ingredient, pagina]);

  const changeFilters = (update: () => void) => {
    setPagina(0);
    update();
  };

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-3xl font-semibold text-foreground">
          {q ? `Resultados para “${q}”` : "Explorar receitas"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString("pt-BR")} receitas encontradas · ordenadas por experiência real da
          comunidade
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <form
          className="relative mt-6 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            setPagina(0);
            navigate({ to: "/buscar", search: { q: term } });
          }}
        >
          <Search
            width={18}
            height={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar por prato, ingrediente ou autor"
            className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-28 text-sm shadow-soft outline-none focus:border-ring"
          />
          <Button type="submit" className="absolute right-1.5 top-1.5 h-9 rounded-full px-4">
            Buscar
          </Button>
        </form>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <SlidersHorizontal width={16} height={16} className="text-caramel" />
              <p className="text-sm font-semibold text-foreground">Filtros</p>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categoria
              </p>
              <div className="mt-3 space-y-2.5">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5">
                    <Checkbox
                      id={c.id}
                      checked={cats.includes(c.id)}
                      onCheckedChange={(v) =>
                        changeFilters(() =>
                          setCats((prev) => (v ? [...prev, c.id] : prev.filter((x) => x !== c.id))),
                        )
                      }
                    />
                    <Label htmlFor={c.id} className="text-sm font-normal text-foreground">
                      {c.label}
                    </Label>
                  </div>
                ))}
                {categoryError && (
                  <p role="alert" className="text-xs text-destructive">
                    {categoryError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Label htmlFor="ingrediente-busca">Ingrediente</Label>
              <Input
                id="ingrediente-busca"
                value={ingredient}
                onChange={(e) => changeFilters(() => setIngredient(e.target.value))}
                placeholder="Ex.: farinha de trigo"
                className="mt-2 rounded-xl bg-background"
              />
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confiabilidade
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <Checkbox
                  id="verificada"
                  checked={onlyVerified}
                  onCheckedChange={(v) => changeFilters(() => setOnlyVerified(Boolean(v)))}
                />
                <Label htmlFor="verificada" className="text-sm font-normal text-foreground">
                  Somente verificadas
                </Label>
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">Taxa de sucesso mínima</span>
                  <span className="font-semibold text-foreground">{minSuccess}%</span>
                </div>
                <Slider
                  className="mt-3"
                  value={[minSuccess]}
                  max={100}
                  step={5}
                  onValueChange={(v) => changeFilters(() => setMinSuccess(v[0] ?? 0))}
                />
              </div>
            </div>

            <Button
              variant="ghost"
              className="mt-6 w-full rounded-full"
              onClick={() => {
                changeFilters(() => {
                  setCats([]);
                  setIngredient("");
                  setOnlyVerified(false);
                  setMinSuccess(0);
                });
              }}
            >
              Limpar filtros
            </Button>
          </aside>

          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {total.toLocaleString("pt-BR")} receitas
              </p>
              <Select value={sort} onValueChange={(value) => changeFilters(() => setSort(value))}>
                <SelectTrigger className="w-56 rounded-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevancia">Mais avaliadas</SelectItem>
                  <SelectItem value="nota">Maior nota média</SelectItem>
                  <SelectItem value="sucesso">Maior taxa de sucesso</SelectItem>
                  <SelectItem value="testadas">Mais testadas</SelectItem>
                  <SelectItem value="tempo">Menor tempo de preparo</SelectItem>
                  <SelectItem value="recentes">Mais recentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Carregando receitas…
              </div>
            ) : results.length === 0 ? (
              <div className="mt-10 rounded-3xl border border-dashed border-border p-12 text-center">
                <p className="font-semibold text-foreground">Nenhuma receita com esses filtros</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tente reduzir a taxa de sucesso mínima ou remover categorias.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((r) => (
                  <RecipeCard key={r.id} recipe={r} />
                ))}
              </div>
            )}
            {!loading && totalPaginas > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Paginação">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={pagina === 0}
                  onClick={() => setPagina((current) => Math.max(0, current - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {pagina + 1} de {totalPaginas}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={pagina + 1 >= totalPaginas}
                  onClick={() => setPagina((current) => Math.min(totalPaginas - 1, current + 1))}
                >
                  Próxima <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
