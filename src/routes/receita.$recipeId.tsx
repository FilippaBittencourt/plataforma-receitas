import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Camera,
  ChefHat,
  Clock,
  CircleDollarSign,
  Flame,
  LoaderCircle,
  MessageCircle,
  MoreVertical,
  Pencil,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Users,
  Utensils,
} from "lucide-react";
import { Shell } from "@/components/site/Shell";
import { Stars } from "@/components/site/Stars";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";
import { CriteriaBars } from "@/components/site/CriteriaBars";
import { PhotoPicker } from "@/components/site/PhotoPicker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/use-auth";
import { api, apiUrl } from "@/lib/api";
import { requestText, toast } from "@/lib/feedback";
import { getRecipe, searchRecipes } from "@/lib/recipes-api";
import type { Recipe } from "@/lib/mock-data";
import { RecipePhotoPlaceholder } from "@/components/site/RecipePhotoPlaceholder";
import { getRecipeIngredientSectionTitle, getRecipeSectionTitle } from "@/lib/recipe-steps";
import { DeleteRecipeButton } from "@/components/site/DeleteRecipeButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        meta: [{ title: "Receita indisponível — Mums!" }, { name: "robots", content: "noindex" }],
      };
    }
    const { recipe } = loaderData;
    return {
      meta: [
        { title: `${recipe.title} — Mums!` },
        { name: "description", content: recipe.summary },
        { property: "og:title", content: `${recipe.title} — Mums!` },
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
  const podeAvaliar = ready && recipe.status === "APROVADA" && user?.id !== recipe.authorId;
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
      avaliacao: { media: number; funcionou: boolean } | null;
    }[]
  >([]);
  const [comment, setComment] = useState("");
  const [commentPhoto, setCommentPhoto] = useState<string | null>(null);
  const [commentPhotoUploading, setCommentPhotoUploading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);
  const [communityPhotos, setCommunityPhotos] = useState<
    {
      id: number;
      fotoResultado: string;
      dataComentario: string;
    }[]
  >([]);
  const [communityPhotosPage, setCommunityPhotosPage] = useState(0);
  const [communityPhotosHasMore, setCommunityPhotosHasMore] = useState(false);
  const [communityPhotosLoading, setCommunityPhotosLoading] = useState(false);
  const [communityPhotosError, setCommunityPhotosError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<{ src: string; label: string } | null>(null);
  const loadComments = useCallback(
    () =>
      api<{ itens: typeof comments }>(`/api/receitas/${recipe.id}/comentarios?tamanho=50`)
        .then((r) => {
          setComments(r.itens);
          setCommentError("");
        })
        .catch((e) =>
          setCommentError(e instanceof Error ? e.message : "Erro ao carregar comentários."),
        ),
    [recipe.id],
  );
  useEffect(() => {
    if (recipe.status === "APROVADA") void loadComments();
  }, [loadComments, recipe.status]);
  const loadCommunityPhotos = useCallback(
    async (page = 0, append = false) => {
      setCommunityPhotosLoading(true);
      setCommunityPhotosError("");
      try {
        const result = await api<{
          itens: typeof communityPhotos;
          pagina: number;
          totalPaginas: number;
        }>(`/api/receitas/${recipe.id}/fotos?pagina=${page}&tamanho=24`);
        setCommunityPhotos((current) => (append ? [...current, ...result.itens] : result.itens));
        setCommunityPhotosPage(result.pagina);
        setCommunityPhotosHasMore(result.pagina + 1 < result.totalPaginas);
      } catch (error) {
        setCommunityPhotosError(
          error instanceof Error ? error.message : "Erro ao carregar fotos da comunidade.",
        );
      } finally {
        setCommunityPhotosLoading(false);
      }
    },
    [recipe.id],
  );
  useEffect(() => {
    if (recipe.status === "APROVADA") void loadCommunityPhotos();
  }, [loadCommunityPhotos, recipe.status]);
  const galleryPhotos = [
    ...recipe.communityPhotos.map((src, index) => ({
      id: `recipe-${index}`,
      src,
    })),
    ...communityPhotos.map((photo) => ({
      id: `comment-${photo.id}`,
      src: apiUrl(photo.fotoResultado),
    })),
  ];
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || commentPhotoUploading || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await api(`/api/receitas/${recipe.id}/comentarios`, {
        method: "POST",
        body: JSON.stringify({ texto: comment.trim(), fotoResultado: commentPhoto }),
      });
      setComment("");
      setCommentPhoto(null);
      await Promise.all([loadComments(), loadCommunityPhotos()]);
      toast.success("Comentário publicado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível comentar.");
    } finally {
      setCommentSubmitting(false);
    }
  };
  const reportComment = async (id: number) => {
    const motivo = await requestText({
      title: "Denunciar comentário",
      description: "Conte à moderação por que este comentário deve ser analisado.",
      placeholder: "Descreva o motivo da denúncia",
      maxLength: 500,
      confirmLabel: "Enviar denúncia",
    });
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
  const deleteComment = async (id: number) => {
    setDeletingComment(true);
    try {
      await api(`/api/comentarios/${id}`, { method: "DELETE" });
      setCommentToDelete(null);
      await Promise.all([loadComments(), loadCommunityPhotos()]);
      toast.success("Comentário excluído");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir o comentário.");
    } finally {
      setDeletingComment(false);
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

  let stepNumber = 0;

  return (
    <Shell assistantRecipe={recipe}>
      <article className="mx-auto max-w-6xl px-5 py-8">
        <Link
          to="/buscar"
          search={{ q: "" }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft width={14} height={14} /> Voltar para a busca
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-stretch">
          <div className="relative aspect-[4/3] min-w-0 w-full overflow-hidden rounded-[2rem] shadow-lifted lg:aspect-auto lg:min-h-0">
            {recipe.hasPhoto === false ? (
              <RecipePhotoPlaceholder className="absolute inset-0 h-full w-full" />
            ) : (
              <img
                src={recipe.image}
                alt={recipe.title}
                width={1024}
                height={768}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>

          <div className="min-w-0">
            {recipe.verified && <VerifiedBadge />}
            <div className="mt-3 flex items-start justify-between gap-3 lg:mt-2">
              <h1 className="min-w-0 flex-1 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                {recipe.title}
              </h1>
              {(user?.id === recipe.authorId || user?.role === "moderador") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Opções da receita"
                      title="Opções da receita"
                      className="h-9 w-9 shrink-0 rounded-md text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical width={18} height={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5">
                    {user?.id === recipe.authorId && (
                      <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
                        <Link to="/publicar" search={{ editar: recipe.id }}>
                          <Pencil width={16} height={16} /> Editar receita
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {podeExcluir && (
                      <DeleteRecipeButton
                        recipeTitle={recipe.title}
                        buttonLabel="Excluir receita"
                        menuItem
                        onDelete={excluirReceita}
                      />
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
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

            {/* Recipe facts (o que o autor publicou) */}
            <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft lg:mt-4 lg:p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Informado pelo autor
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4 lg:mt-3 lg:gap-2">
                {[
                  {
                    icon: Clock,
                    label: "Tempo",
                    value: recipe.timeMinutes == null ? "-" : `${recipe.timeMinutes} min`,
                  },
                  { icon: Utensils, label: "Rendimento", value: recipe.yield },
                  { icon: Flame, label: "Dificuldade", value: recipe.difficulty },
                  { icon: CircleDollarSign, label: "Custo", value: recipe.cost ?? "-" },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-secondary/70 px-2 py-4 text-center"
                  >
                    <f.icon width={16} height={16} className="mx-auto text-caramel" />
                    <p className="text-xs text-muted-foreground">{f.label}</p>
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
              <div className="mt-4 grid grid-cols-3 items-end gap-3 lg:mt-3 lg:gap-4">
                <div>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="font-display text-4xl font-semibold text-foreground lg:text-3xl">
                      {recipe.rating.toFixed(1)}
                    </span>
                    <Stars value={recipe.rating} size={12} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {recipe.reviewsCount.toLocaleString("pt-BR")} avaliações
                  </p>
                </div>
                <div>
                  <p className="font-display text-4xl font-semibold text-verified lg:text-3xl">
                    {recipe.successRate}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">tentativas deram certo</p>
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
                    Registrar avaliação
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-full px-6">
                  <Link
                    to="/receita/$recipeId"
                    params={{ recipeId: recipe.id }}
                    hash="novo-comentario"
                  >
                    <Camera width={16} height={16} /> Comentar com foto
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
                {recipe.ingredients.map((i, idx) =>
                  getRecipeIngredientSectionTitle(i) ? (
                    <li
                      key={`${recipe.id}-ingrediente-secao-${idx}`}
                      className="bg-warm px-5 py-3.5 text-sm font-semibold text-foreground"
                    >
                      {getRecipeIngredientSectionTitle(i)}
                    </li>
                  ) : (
                    <li
                      key={`${recipe.id}-ingrediente-${idx}`}
                      className="flex items-start gap-3 px-5 py-3.5 text-sm text-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-caramel" />
                      {i}
                    </li>
                  ),
                )}
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="text-2xl font-semibold text-foreground">Modo de preparo</h2>
              <ol className="mt-5 space-y-4">
                {recipe.steps.map((s, idx) => {
                  const sectionTitle = getRecipeSectionTitle(s);
                  if (sectionTitle) {
                    return (
                      <li
                        key={`${recipe.id}-secao-${idx}`}
                        className="rounded-2xl border border-caramel/20 bg-warm px-5 py-3"
                      >
                        <h3 className="font-semibold text-foreground">{sectionTitle}</h3>
                      </li>
                    );
                  }
                  stepNumber += 1;
                  return (
                    <li
                      key={`${recipe.id}-passo-${idx}`}
                      className="flex min-w-0 gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
                        {stepNumber}
                      </span>
                      <p className="min-w-0 flex-1 pt-1 text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
                        {s}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* Community photos */}
            <section className="mt-12">
              <div className="flex items-center gap-2">
                <Camera width={18} height={18} className="text-caramel" />
                <h2 className="text-2xl font-semibold text-foreground">Fotos da comunidade</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Resultados enviados por quem cozinhou.
              </p>
              {communityPhotosError && (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  {communityPhotosError}
                </p>
              )}
              {galleryPhotos.length ? (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {galleryPhotos.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      aria-label={`Abrir foto ${index + 1} da comunidade`}
                      className="overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
                      onClick={() =>
                        setSelectedPhoto({
                          src: photo.src,
                          label: `Foto ${index + 1} da comunidade`,
                        })
                      }
                    >
                      <img
                        src={photo.src}
                        alt=""
                        loading="lazy"
                        width={1024}
                        height={768}
                        className="aspect-square w-full rounded-2xl object-cover shadow-soft"
                      />
                    </button>
                  ))}
                </div>
              ) : !communityPhotosLoading && !communityPhotosError ? (
                <p className="mt-5 text-sm text-muted-foreground">
                  Ainda não há fotos da comunidade nesta receita.
                </p>
              ) : null}
              {communityPhotosHasMore && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 rounded-full"
                  disabled={communityPhotosLoading}
                  onClick={() => void loadCommunityPhotos(communityPhotosPage + 1, true)}
                >
                  {communityPhotosLoading ? "Carregando fotos…" : "Ver mais fotos"}
                </Button>
              )}
              <Dialog
                open={selectedPhoto !== null}
                onOpenChange={(open) => !open && setSelectedPhoto(null)}
              >
                <DialogContent className="w-[calc(100vw-2rem)] max-w-5xl justify-items-center border-0 bg-transparent p-0 shadow-none [&>button]:-top-10 [&>button]:right-0 [&>button]:text-white [&>button]:opacity-100">
                  <DialogTitle className="sr-only">{selectedPhoto?.label}</DialogTitle>
                  {selectedPhoto && (
                    <img
                      src={selectedPhoto.src}
                      alt={selectedPhoto.label}
                      className="max-h-[85vh] max-w-full rounded-xl object-contain"
                    />
                  )}
                </DialogContent>
              </Dialog>
            </section>

            {/* Comments */}
            <section className="mt-12">
              <div className="flex items-center gap-2">
                <MessageCircle width={18} height={18} className="text-caramel" />
                <h2 className="text-2xl font-semibold text-foreground">Comentários</h2>
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
                {comments.map((rev) => {
                  const rating = rev.avaliacao;
                  return (
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
                            {rating && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-warm px-2.5 py-1 text-xs text-foreground">
                                <Stars value={rating.media} size={11} />
                                <span>{rating.media.toFixed(1)}/5</span>
                                <span className="text-muted-foreground">
                                  · {rating.funcionou ? "Deu certo" : "Não deu certo"}
                                </span>
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-foreground">
                            {rev.texto}
                          </p>
                          {user && user.id !== String(rev.autor?.id) && (
                            <button
                              type="button"
                              className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
                              onClick={() => void reportComment(rev.id)}
                            >
                              Denunciar comentário
                            </button>
                          )}
                          {user?.id === String(rev.autor?.id) && (
                            <button
                              type="button"
                              className="mt-2 inline-flex items-center gap-1 text-xs text-destructive underline hover:text-destructive/80"
                              onClick={() => setCommentToDelete(rev.id)}
                            >
                              <Trash2 size={13} aria-hidden="true" />
                              Excluir meu comentário
                            </button>
                          )}
                          {rev.fotoResultado && (
                            <button
                              type="button"
                              aria-label="Abrir foto do resultado do comentário"
                              className="mt-3 block h-28 w-40 overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
                              onClick={() =>
                                setSelectedPhoto({
                                  src: apiUrl(rev.fotoResultado),
                                  label: "Foto do resultado do comentário",
                                })
                              }
                            >
                              <img
                                src={apiUrl(rev.fotoResultado)}
                                alt=""
                                loading="lazy"
                                width={1024}
                                height={768}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    <PhotoPicker
                      key={commentPhoto ?? "sem-foto"}
                      className="mt-4"
                      icon={<Camera width={20} height={20} className="text-caramel" />}
                      title="Anexar foto do resultado (opcional)"
                      hint="PNG, JPG ou WEBP · até 5 MB"
                      currentImage={commentPhoto ? apiUrl(commentPhoto) : null}
                      onUploaded={setCommentPhoto}
                      onUploadingChange={setCommentPhotoUploading}
                    />
                    <Button
                      type="submit"
                      className="mt-3 rounded-full"
                      disabled={!comment.trim() || commentPhotoUploading || commentSubmitting}
                    >
                      {commentPhotoUploading
                        ? "Enviando foto…"
                        : commentSubmitting
                          ? "Publicando…"
                          : "Publicar comentário"}
                    </Button>
                  </form>
                )}
              </div>
            </section>
            <AlertDialog
              open={commentToDelete !== null}
              onOpenChange={(open) => !deletingComment && !open && setCommentToDelete(null)}
            >
              <AlertDialogContent className="max-w-md rounded-[1.75rem] border-border bg-card p-6 shadow-soft sm:p-7">
                <AlertDialogHeader className="items-center text-center sm:items-start sm:text-left">
                  <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-warm text-caramel">
                    <Trash2 width={21} height={21} />
                  </div>
                  <AlertDialogTitle className="font-display text-2xl text-foreground">
                    Excluir seu comentário?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="pt-1 text-sm leading-relaxed">
                    Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 gap-2 sm:gap-2">
                  <AlertDialogCancel disabled={deletingComment} className="h-10 rounded-full px-5">
                    Manter comentário
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deletingComment}
                    onClick={(event) => {
                      event.preventDefault();
                      if (commentToDelete !== null) void deleteComment(commentToDelete);
                    }}
                    className="h-10 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                  >
                    {deletingComment ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <Trash2 width={15} height={15} />
                    )}
                    {deletingComment ? "Excluindo…" : "Sim, excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                    Registrar avaliação
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
