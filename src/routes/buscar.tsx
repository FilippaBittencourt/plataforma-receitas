import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Shell } from "@/components/site/Shell";
import { RecipeCard } from "@/components/site/RecipeCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories, recipes } from "@/lib/mock-data";

type SearchParams = { q: string };

export const Route = createFileRoute("/buscar")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Buscar receitas testadas — Cookie" },
      {
        name: "description",
        content:
          "Filtre receitas por categoria, tempo, dificuldade e taxa de sucesso da comunidade.",
      },
      { property: "og:title", content: "Buscar receitas testadas — Cookie" },
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
  const [sort, setSort] = useState("relevancia");

  const results = useMemo(() => {
    const t = q.toLowerCase().trim();
    let list = recipes.filter((r) => {
      const matches =
        !t ||
        r.title.toLowerCase().includes(t) ||
        r.category.toLowerCase().includes(t) ||
        r.author.toLowerCase().includes(t);
      const catOk = cats.length === 0 || cats.includes(r.category);
      return matches && catOk && (!onlyVerified || r.verified) && r.successRate >= minSuccess;
    });
    list = [...list].sort((a, b) => {
      if (sort === "nota") return b.rating - a.rating;
      if (sort === "sucesso") return b.successRate - a.successRate;
      if (sort === "testadas") return b.testedCount - a.testedCount;
      if (sort === "tempo") return a.timeMinutes - b.timeMinutes;
      return b.reviewsCount - a.reviewsCount;
    });
    return list;
  }, [q, cats, onlyVerified, minSuccess, sort]);

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-3xl font-semibold text-foreground">
          {q ? `Resultados para “${q}”` : "Explorar receitas"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {results.length} receitas encontradas · ordenadas por experiência real da comunidade
        </p>

        <form
          className="relative mt-6 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
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
                      checked={cats.includes(c.label)}
                      onCheckedChange={(v) =>
                        setCats((prev) =>
                          v ? [...prev, c.label] : prev.filter((x) => x !== c.label),
                        )
                      }
                    />
                    <Label htmlFor={c.id} className="text-sm font-normal text-foreground">
                      {c.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confiabilidade
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <Checkbox
                  id="verificada"
                  checked={onlyVerified}
                  onCheckedChange={(v) => setOnlyVerified(Boolean(v))}
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
                  onValueChange={(v) => setMinSuccess(v[0] ?? 0)}
                />
              </div>
            </div>

            <Button
              variant="ghost"
              className="mt-6 w-full rounded-full"
              onClick={() => {
                setCats([]);
                setOnlyVerified(false);
                setMinSuccess(0);
              }}
            >
              Limpar filtros
            </Button>
          </aside>

          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">{results.length} receitas</p>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-56 rounded-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevancia">Mais avaliadas</SelectItem>
                  <SelectItem value="nota">Maior nota média</SelectItem>
                  <SelectItem value="sucesso">Maior taxa de sucesso</SelectItem>
                  <SelectItem value="testadas">Mais testadas</SelectItem>
                  <SelectItem value="tempo">Menor tempo de preparo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {results.length === 0 ? (
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
          </div>
        </div>
      </div>
    </Shell>
  );
}
