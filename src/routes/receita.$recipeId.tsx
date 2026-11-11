import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Camera,
  ChefHat,
  Clock,
  Flame,
  MessageCircle,
  Pencil,
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { api, apiUrl } from "@/lib/api";
import { toast } from "sonner";
import { getRecipe, searchRecipes } from "@/lib/recipes-api";
import type { Recipe } from "@/lib/mock-data";
import { RecipePhotoPlaceholder } from "@/components/site/RecipePhotoPlaceholder";
import { DeleteRecipeButton } from "@/components/site/DeleteRecipeButton";

export const Route = createFileRoute("/receita/$recipeId")({
  loader: async ({ params }) => {
    try {
      return { recipe: await getRecipe(params.recipeId) };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Receita indisponível — Lipapa" }, { name: "robots", content: "noindex" }],
      };
    }
    const { recipe } = loaderData;
    return {
      meta: [
        { title: `${recipe.title} — Lipapa` },
        { name: "description", content: recipe.summary },
        { property: "og:title", content: `${recipe.title} — Lipapa` },
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
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const podeAvaliar = ready && user?.id !== recipe.authorId;
  const podeExcluir = user?.role === "moderador" || user?.id === recipe.authorId;
  const excluirReceita = async () => {
    await api(`/api/receitas/${recipe.id}`, { method: "DELETE" });
    toast.success("Receita excluída");
    await navigate({ to: "/buscar", search: { q: "" } });
  };
  const [comments, setComments] = useState<
    {
      id: number;
      texto: string;
      fotoResultado: string | null;
      dataComentario: string;
      autor: { id: number; nome: string; nomeUsuario: string } | null;
    }[]
  >([]);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const loadComments = useCallback(
    () =>
      api<{ itens: typeof comments }>(`/api/receitas/${recipe.id}/comentarios`)
        .then((r) => setComments(r.itens))
        .catch((e) =>
          setCommentError(e instanceof Error ? e.message : "Erro ao carregar comentários."),
        ),
    [recipe.id],
  );
  useEffect(() => {
    void loadComments();
  }, [loadComments]);
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await api(`/api/receitas/${recipe.id}/comentarios`, {
        method: "POST",
        body: JSON.stringify({ texto: comment.trim(), fotoResultado: null }),
      });
      setComment("");
      await loadComments();
      toast.success("Comentário publicado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível comentar.");
    }
  };
  const reportComment = async (id: number) => {
    const motivo = window.prompt(
      "Por que você está denunciando este comentário? (até 500 caracteres)",
    );
    if (!motivo?.trim()) return;
    try {
      await api("/api/denuncias", {
        method: "POST",
        body: JSON.stringify({ idComentario: id, motivo: motivo.trim().slice(0, 500) }),
      });
      toast.success("Denúncia enviada para a moderação");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar a denúncia.");
    }
  };
  const [related, setRelated] = useState<Recipe[]>([]);
  useEffect(() => {
    let active = true;
    Promise.all([
      searchRecipes({ categoria: recipe.categorySlug, ordem: "mais-testadas", tamanho: 8 }),
      searchRecipes({ ordem: "mais-testadas", tamanho: 8 }),
    ])
      .then(([sameCategory, popular]) => {
        const candidates = [...sameCategory, ...popular].filter(
          (item, index, all) =>
            item.id !== recipe.id &&
            all.findIndex((candidate) => candidate.id === item.id) === index,
        );
        if (active) setRelated(candidates.slice(0, 3));
      })
      .catch(() => {
        if (active) setRelated([]);
      });
    return () => {
      active = false;
    };
  }, [recipe.id, recipe.category, recipe.categorySlug]);

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
          {recipe.hasPhoto === false ? (
            <RecipePhotoPlaceholder className="aspect-[4/3] w-full rounded-[2rem] shadow-lifted" />
          ) : (
            <img
              src={recipe.image}
              alt={recipe.title}
              width={1024}
              height={768}
              className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-lifted"
            />
          )}

          <div>
            {recipe.verified && <VerifiedBadge />}
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {recipe.title}
            </h1>
            <div className="mt-3 flex items-center gap-2.5 lg:mt-2">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                  {recipe.author.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                por{" "}
                {recipe.authorId ? (
                  <Link
                    to="/usuarios/$nomeUsuario"
                    params={{ nomeUsuario: recipe.authorHandle.replace(/^@/, "") }}
                    className="font-medium text-foreground hover:underline"
                  >
                    {recipe.author}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{recipe.author}</span>
                )}{" "}
                {recipe.authorHandle}
              </p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground lg:mt-3">
              {recipe.summary}
            </p>
            {(user?.id === recipe.authorId || user?.role === "moderador") && (
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {user?.id === recipe.authorId && (
                  <Button
                    asChild
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 rounded-full border-border bg-card text-foreground hover:text-caramel"
                  >
                    <Link to="/publicar" search={{ editar: recipe.id }}>
                      <Pencil width={16} height={16} />
                      <span className="sr-only">Editar receita</span>
                    </Link>
                  </Button>
                )}
                {podeExcluir && (
                  <DeleteRecipeButton
                    recipeTitle={recipe.title}
                    buttonLabel="Excluir receita"
                    iconOnly
                    onDelete={excluirReceita}
                  />
                )}
              </div>
            )}

            {/* Recipe facts (o que o autor publicou) */}
            <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft lg:mt-4 lg:p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Informado pelo autor
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center lg:mt-3 lg:gap-2">
                {[
                  { icon: Clock, label: "Tempo", value: `${recipe.timeMinutes} min` },
                  { icon: Utensils, label: "Rendimento", value: recipe.yield },
                  { icon: Flame, label: "Dificuldade", value: recipe.difficulty },
                ].map((f) => (
                  <div key={f.label} className="rounded-2xl bg-secondary/70 px-2 py-3 lg:py-2">
                    <f.icon width={16} height={16} className="mx-auto text-caramel" />
                    <p className="mt-1.5 text-xs text-muted-foreground">{f.label}</p>
                    <p className="text-sm font-semibold leading-tight text-foreground">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Community experience */}
            <div className="mt-4 rounded-3xl border border-caramel/30 bg-warm p-5 lg:mt-3 lg:p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-cocoa">
                Experiência real da comunidade
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-6 lg:mt-3 lg:gap-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-4xl font-semibold text-foreground lg:text-3xl">
                      {recipe.rating.toFixed(1)}
                    </span>
                    <Stars value={recipe.rating} size={16} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {recipe.reviewsCount.toLocaleString("pt-BR")} avaliações
                  </p>
                </div>
                <div>
                  <p className="font-display text-4xl font-semibold text-verified lg:text-3xl">
                    {recipe.successRate}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">tiveram sucesso</p>
                </div>
                <div>
                  <p className="font-display text-4xl font-semibold text-foreground lg:text-3xl">
                    {recipe.testedCount.toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users width={12} height={12} /> pessoas testaram
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-card lg:mt-3">
                <div
                  className="h-full rounded-full bg-verified"
                  style={{ width: `${recipe.successRate}%` }}
                />
              </div>
            </div>

            {podeAvaliar && (
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild className="h-11 rounded-full px-6">
                  <Link to="/receita/$recipeId/avaliar" params={{ recipeId: recipe.id }}>
                    Avaliar receita
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-full px-6">
                  <Link
                    to="/receita/$recipeId/avaliar"
                    params={{ recipeId: recipe.id }}
                    hash="foto"
                  >
                    <Camera width={16} height={16} /> Enviar foto do resultado
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <section>
              <h2 className="text-2xl font-semibold text-foreground">Ingredientes</h2>
              <ul className="mt-5 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
                {recipe.ingredients.map((i, idx) => (
                  <li
                    key={`${recipe.id}-ingrediente-${idx}`}
                    className="flex items-start gap-3 px-5 py-3.5 text-sm text-foreground"
                  >
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
                    key={`${recipe.id}-passo-${idx}`}
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
                <h2 className="text-2xl font-semibold text-foreground">Comentários e avaliações</h2>
              </div>
              <div className="mt-5 space-y-4">
                {commentError && (
                  <p role="alert" className="text-sm text-destructive">
                    {commentError}
                  </p>
                )}
                {!comments.length && (
                  <p className="text-sm text-muted-foreground">
                    Ainda não há comentários nesta receita.
                  </p>
                )}
                {comments.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-3xl border border-border bg-card p-5 shadow-soft"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                          {(rev.autor?.nome ?? "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {rev.autor?.nome ?? "Conta removida"}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(rev.dataComentario).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-foreground">{rev.texto}</p>
                        {user && (
                          <button
                            type="button"
                            className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
                            onClick={() => void reportComment(rev.id)}
                          >
                            Denunciar comentário
                          </button>
                        )}
                        {rev.fotoResultado && (
                          <img
                            src={apiUrl(rev.fotoResultado)}
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
                {user && (
                  <form
                    onSubmit={submitComment}
                    className="rounded-3xl border border-border bg-card p-5"
                  >
                    <label htmlFor="novo-comentario" className="text-sm font-semibold">
                      Compartilhe sua experiência
                    </label>
                    <Textarea
                      id="novo-comentario"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={2000}
                      rows={3}
                      className="mt-3 rounded-xl"
                      placeholder="Conte como foi preparar esta receita"
                    />
                    <Button type="submit" className="mt-3 rounded-full" disabled={!comment.trim()}>
                      Publicar comentário
                    </Button>
                  </form>
                )}
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
              {podeAvaliar && (
                <Button asChild className="mt-6 w-full rounded-full">
                  <Link to="/receita/$recipeId/avaliar" params={{ recipeId: recipe.id }}>
                    Avaliar receita
                  </Link>
                </Button>
              )}
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
