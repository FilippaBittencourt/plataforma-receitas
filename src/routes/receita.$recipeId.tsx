import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Camera,
  ChefHat,
  Clock,
  Flame,
  MessageCircle,
  ThumbsDown,
  ThumbsUp,
  Users,
  Utensils,
} from "lucide-react";
import { Shell } from "@/components/site/Shell";
import { Stars } from "@/components/site/Stars";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";
import { CriteriaBars } from "@/components/site/CriteriaBars";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getRecipe, recipes } from "@/lib/mock-data";

export const Route = createFileRoute("/receita/$recipeId")({
  loader: ({ params }) => {
    const recipe = getRecipe(params.recipeId);
    if (!recipe) throw notFound();
    return { recipe };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Receita indisponível — Cookie" }, { name: "robots", content: "noindex" }],
      };
    }
    const { recipe } = loaderData;
    return {
      meta: [
        { title: `${recipe.title} — Cookie` },
        { name: "description", content: recipe.summary },
        { property: "og:title", content: `${recipe.title} — Cookie` },
        { property: "og:description", content: recipe.summary },
      ],
    };
  },
  component: RecipePage,
  notFoundComponent: RecipeNotFound,
});

function RecipeNotFound() {
  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Receita não encontrada</h1>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/buscar" search={{ q: "" }}>
            Explorar receitas
          </Link>
        </Button>
      </div>
    </Shell>
  );
}

function RecipePage() {
  const { recipe } = Route.useLoaderData();
  const related = recipes.filter((r) => r.id !== recipe.id).slice(0, 3);

  return (
    <Shell>
      <article className="mx-auto max-w-6xl px-5 py-8">
        <Link
          to="/buscar"
          search={{ q: "" }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft width={14} height={14} /> Voltar para a busca
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <img
            src={recipe.image}
            alt={recipe.title}
            width={1024}
            height={768}
            className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-lifted"
          />

          <div>
            {recipe.verified && <VerifiedBadge />}
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {recipe.title}
            </h1>
            <div className="mt-3 flex items-center gap-2.5">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                  {recipe.author.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                por <span className="font-medium text-foreground">{recipe.author}</span>{" "}
                {recipe.authorHandle}
              </p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{recipe.summary}</p>

            {/* Recipe facts (o que o autor publicou) */}
            <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Informado pelo autor
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: Clock, label: "Tempo", value: `${recipe.timeMinutes} min` },
                  { icon: Utensils, label: "Rendimento", value: recipe.yield },
                  { icon: Flame, label: "Dificuldade", value: recipe.difficulty },
                ].map((f) => (
                  <div key={f.label} className="rounded-2xl bg-secondary/70 px-2 py-3">
                    <f.icon width={16} height={16} className="mx-auto text-caramel" />
                    <p className="mt-1.5 text-xs text-muted-foreground">{f.label}</p>
                    <p className="text-sm font-semibold leading-tight text-foreground">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Community experience */}
            <div className="mt-4 rounded-3xl border border-caramel/30 bg-warm p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-cocoa">
                Experiência real da comunidade
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-4xl font-semibold text-foreground">
                      {recipe.rating.toFixed(1)}
                    </span>
                    <Stars value={recipe.rating} size={16} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {recipe.reviewsCount.toLocaleString("pt-BR")} avaliações
                  </p>
                </div>
                <div>
                  <p className="font-display text-4xl font-semibold text-verified">
                    {recipe.successRate}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">tiveram sucesso</p>
                </div>
                <div>
                  <p className="font-display text-4xl font-semibold text-foreground">
                    {recipe.testedCount.toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users width={12} height={12} /> pessoas testaram
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-card">
                <div
                  className="h-full rounded-full bg-verified"
                  style={{ width: `${recipe.successRate}%` }}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild className="h-11 rounded-full px-6">
                <Link to="/receita/$recipeId/avaliar" params={{ recipeId: recipe.id }}>
                  Avaliar receita
                </Link>
              </Button>
              <Button variant="outline" className="h-11 rounded-full px-6">
                <Camera width={16} height={16} /> Enviar foto do resultado
              </Button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <section>
              <h2 className="text-2xl font-semibold text-foreground">Ingredientes</h2>
              <ul className="mt-5 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
                {recipe.ingredients.map((i) => (
                  <li key={i} className="flex items-start gap-3 px-5 py-3.5 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-caramel" />
                    {i}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="text-2xl font-semibold text-foreground">Modo de preparo</h2>
              <ol className="mt-5 space-y-4">
                {recipe.steps.map((s, idx) => (
                  <li
                    key={s}
                    className="flex gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
                      {idx + 1}
                    </span>
                    <p className="pt-1 text-sm leading-relaxed text-foreground">{s}</p>
                  </li>
                ))}
              </ol>
            </section>

            {/* Community photos */}
            <section className="mt-12">
              <div className="flex items-center gap-2">
                <Camera width={18} height={18} className="text-caramel" />
                <h2 className="text-2xl font-semibold text-foreground">Fotos da comunidade</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Resultados enviados por quem cozinhou — sem edição de estúdio.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {recipe.communityPhotos.map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    alt={`Resultado enviado pela comunidade ${i + 1}`}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="aspect-square w-full rounded-2xl object-cover shadow-soft"
                  />
                ))}
              </div>
            </section>

            {/* Comments */}
            <section className="mt-12">
              <div className="flex items-center gap-2">
                <MessageCircle width={18} height={18} className="text-caramel" />
                <h2 className="text-2xl font-semibold text-foreground">
                  Comentários e avaliações
                </h2>
              </div>
              <div className="mt-5 space-y-4">
                {recipe.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-3xl border border-border bg-card p-5 shadow-soft"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                          {rev.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="text-sm font-semibold text-foreground">{rev.author}</p>
                          <Stars value={rev.rating} />
                          <span className="text-xs text-muted-foreground">{rev.date}</span>
                          <span
                            className={
                              rev.success
                                ? "ml-auto inline-flex items-center gap-1 rounded-full bg-verified/12 px-2.5 py-1 text-xs font-semibold text-verified"
                                : "ml-auto inline-flex items-center gap-1 rounded-full bg-terracotta/15 px-2.5 py-1 text-xs font-semibold text-terracotta"
                            }
                          >
                            {rev.success ? (
                              <ThumbsUp width={12} height={12} />
                            ) : (
                              <ThumbsDown width={12} height={12} />
                            )}
                            {rev.success ? "Deu certo" : "Não deu certo"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-foreground">{rev.text}</p>
                        {rev.photo && (
                          <img
                            src={rev.photo}
                            alt="Foto do resultado"
                            loading="lazy"
                            width={1024}
                            height={768}
                            className="mt-3 h-28 w-40 rounded-2xl object-cover"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-foreground">Avaliação por critérios</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Média de {recipe.reviewsCount.toLocaleString("pt-BR")} avaliações
              </p>
              <div className="mt-5">
                <CriteriaBars criteria={recipe.criteria} />
              </div>
              <Button asChild className="mt-6 w-full rounded-full">
                <Link to="/receita/$recipeId/avaliar" params={{ recipeId: recipe.id }}>
                  Avaliar receita
                </Link>
              </Button>
            </div>

            <div className="rounded-3xl border border-border bg-cream p-6">
              <div className="flex items-center gap-2">
                <ChefHat width={16} height={16} className="text-caramel" />
                <p className="text-sm font-semibold text-foreground">Você também pode gostar</p>
              </div>
              <div className="mt-4 space-y-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to="/receita/$recipeId"
                    params={{ recipeId: r.id }}
                    className="flex items-center gap-3 rounded-2xl bg-card p-2.5 transition-colors hover:bg-secondary"
                  >
                    <img
                      src={r.image}
                      alt={r.title}
                      loading="lazy"
                      width={1024}
                      height={768}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.rating.toFixed(1)} · {r.successRate}% de sucesso
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </article>
    </Shell>
  );
}
