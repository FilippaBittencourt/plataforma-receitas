import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Camera, Ruler, Search, Timer } from "lucide-react";
import heroImage from "@/assets/hero-cookies.jpg";
import { Shell } from "@/components/site/Shell";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { RecipeCard } from "@/components/site/RecipeCard";
import { Button } from "@/components/ui/button";
import type { Recipe } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { searchRecipes, searchRecipesPage } from "@/lib/recipes-api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mums! — Receitas que realmente funcionam" },
      {
        name: "description",
        content:
          "Descubra receitas avaliadas por medidas, tempo, rendimento e resultado real. Só o que a comunidade testou e aprovou.",
      },
      { property: "og:title", content: "Mums! — Receitas que realmente funcionam" },
      {
        property: "og:description",
        content: "Receitas avaliadas por critérios objetivos e testadas pela comunidade.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [q, setQ] = useState("");
  const [featured, setFeatured] = useState<Recipe[]>([]);
  const [verified, setVerified] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string; count: number }[]>([]);
  const [totals, setTotals] = useState({ recipes: 0, verified: 0 });
  const [error, setError] = useState("");
  const reviewableRecipe = ready
    ? featured.find((recipe) => recipe.authorId !== user?.id)
    : undefined;
  useEffect(() => {
    Promise.all([
      searchRecipes({ ordem: "mais-testadas", tamanho: 6 }),
      searchRecipes({ verificadas: true, ordem: "melhores", tamanho: 6 }),
      api<{ slug: string; nome: string; totalReceitas: number }[]>("/api/categorias"),
      searchRecipesPage({ tamanho: 1 }),
      searchRecipesPage({ verificadas: true, tamanho: 1 }),
    ])
      .then(([f, v, c, all, verifiedPage]) => {
        setFeatured(f);
        setVerified(v);
        setCategories(
          c.map((item) => ({ id: item.slug, label: item.nome, count: item.totalReceitas })),
        );
        setTotals({ recipes: all.total, verified: verifiedPage.total });
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Não foi possível carregar as receitas."),
      );
  }, []);

  return (
    <Shell>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-10 sm:pt-16">
        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
              <BadgeCheck width={14} height={14} className="text-verified" />
              Receitas avaliadas pela comunidade
            </span>
            <h1 className="mt-6 text-4xl leading-[1.08] font-semibold text-foreground sm:text-5xl lg:text-[3.4rem]">
              Em meio a milhares de receitas, mostramos quais{" "}
              <span className="text-terracotta">realmente funcionam</span>.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
              Cada receita é avaliada por precisão das medidas, tempo de preparo, rendimento,
              clareza das instruções e resultado final — por quem cozinhou de verdade.
            </p>

            <form
              className="relative mt-8 max-w-lg"
              onSubmit={(e) => {
                e.preventDefault();
                navigate({ to: "/buscar", search: { q } });
              }}
            >
              <Search
                width={18}
                height={18}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Buscar receitas"
                placeholder="O que você quer cozinhar hoje?"
                className="h-14 w-full rounded-full border border-border bg-card pl-13 pr-36 text-sm shadow-soft outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <Button type="submit" className="absolute right-2 top-2 h-10 rounded-full px-5">
                Buscar
              </Button>
            </form>

            <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              {[
                { value: totals.recipes.toLocaleString("pt-BR"), label: "receitas aprovadas" },
                { value: totals.verified.toLocaleString("pt-BR"), label: "receitas verificadas" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-2xl font-semibold text-foreground">{s.value}</p>
                  <p className="max-w-[9rem] text-xs leading-snug text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <img
              src={heroImage}
              alt="Bolo caseiro sendo fatiado sobre toalha de linho"
              width={1408}
              height={1008}
              className="aspect-[4/3] w-full rounded-[2rem] object-cover object-center shadow-lifted"
            />
            {featured[0] && (
              <Link
                to="/receita/$recipeId"
                params={{ recipeId: featured[0].id }}
                className="absolute -bottom-6 left-6 right-10 rounded-2xl border border-border bg-card/95 p-4 shadow-lifted backdrop-blur sm:right-auto sm:w-64"
              >
                <p className="text-xs text-muted-foreground">Mais testada pela comunidade</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{featured[0].title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {featured[0].testedCount.toLocaleString("pt-BR")} avaliações ·{" "}
                  {featured[0].successRate}% de sucesso
                </p>
              </Link>
            )}
          </div>
        </div>
      </section>
      {error && (
        <p role="alert" className="mx-auto mt-6 max-w-6xl px-5 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Criteria strip */}
      <section className="mx-auto mt-24 max-w-6xl px-5">
        <div className="grid gap-4 rounded-3xl border border-border bg-cream p-6 sm:grid-cols-3 sm:p-8">
          {[
            {
              icon: Ruler,
              title: "Medidas conferidas",
              text: "Quem cozinhou diz se as quantidades batem.",
            },
            {
              icon: Timer,
              title: "Tempo real",
              text: "Comparação entre o tempo informado e o praticado.",
            },
            {
              icon: Camera,
              title: "Fotos do resultado",
              text: "Sem foto de estúdio: o prato como ele sai.",
            },
          ].map((f) => (
            <div key={f.title} className="flex gap-3">
              <f.icon width={20} height={20} className="mt-0.5 shrink-0 text-caramel" />
              <div>
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <h2 className="text-2xl font-semibold text-foreground">Categorias</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/buscar"
              search={{ q: c.label }}
              className="group rounded-2xl border border-border bg-card p-4 text-center shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lifted"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cream text-primary transition-colors group-hover:bg-sand/60">
                <CategoryIcon id={c.id} size={26} />
              </span>
              <p className="mt-2 text-sm font-semibold text-foreground">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.count} receitas</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Mais testadas pela comunidade
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              As receitas aprovadas mais testadas pela comunidade.
            </p>
          </div>
          <Link
            to="/buscar"
            search={{ q: "" }}
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
          >
            Ver todas <ArrowRight width={14} height={14} />
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 3).map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </section>

      {/* Verified */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <div className="rounded-[2rem] bg-warm p-6 sm:p-10">
          <div className="flex items-center gap-2">
            <BadgeCheck width={18} height={18} className="text-verified" />
            <h2 className="text-2xl font-semibold text-foreground">Receitas verificadas</h2>
          </div>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Pelo menos 10 avaliações, nota média mínima de 4,0 e sucesso em 80% dos testes.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {verified.slice(0, 3).map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <div className="flex flex-col items-center gap-5 rounded-[2rem] border border-border bg-card p-10 text-center shadow-soft">
          <h2 className="max-w-md text-2xl font-semibold text-foreground">
            Cozinhou algo recentemente? Conte se a receita funcionou.
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Sua avaliação por critérios ajuda outras pessoas a não perderem ingredientes e tempo.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full px-6">
              {reviewableRecipe ? (
                <Link to="/receita/$recipeId/avaliar" params={{ recipeId: reviewableRecipe.id }}>
                  Avaliar uma receita
                </Link>
              ) : (
                <Link to="/buscar" search={{ q: "" }}>
                  Explorar receitas
                </Link>
              )}
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <Link to="/publicar" search={{ editar: undefined }}>
                Publicar receita
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Shell>
  );
}
