import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ClipboardCheck,
  MessageSquareWarning,
  Plus,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Shell } from "@/components/site/Shell";
import { ProfileHeader } from "@/components/site/ProfileHeader";
import { RecipeCard } from "@/components/site/RecipeCard";
import { RequireAuth } from "@/components/site/RequireAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/use-auth";
import type { Recipe } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { toRecipe, type RecipeDto } from "@/lib/recipes-api";
import { apiUrl } from "@/lib/api";
import { RecipePhotoPlaceholder } from "@/components/site/RecipePhotoPlaceholder";
import { Clock, Users } from "lucide-react";
import { Stars } from "@/components/site/Stars";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Mums!" },
      {
        name: "description",
        content: "Suas receitas publicadas, avaliações enviadas e resultados testados.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  return (
    <Shell>
      <RequireAuth>
        <Profile />
      </RequireAuth>
    </Shell>
  );
}

function EmptyTab({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-border px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
      {action}
    </div>
  );
}

function PublishedRecipeCard({
  item,
  authorName,
}: {
  item: {
    id: string;
    title: string;
    status: string;
    fotoPrincipal?: string | null;
    recipe?: Recipe;
  };
  authorName: string;
}) {
  const recipe = item.recipe;
  const hasPhoto = recipe ? recipe.hasPhoto !== false : Boolean(item.fotoPrincipal);
  const image = recipe?.image ?? (item.fotoPrincipal ? apiUrl(item.fotoPrincipal) : "");
  const statusLabel =
    item.status === "RECUSADA"
      ? "Recusada"
      : item.status === "PENDENTE"
        ? "Em curadoria"
        : "Publicada";
  const statusColor =
    item.status === "RECUSADA"
      ? "border-destructive/35 bg-card text-destructive"
      : item.status === "PENDENTE"
        ? "border-caramel/35 bg-card text-caramel"
        : "border-verified/35 bg-card text-verified";
  const showFooter = Boolean(recipe);
  const content = (
    <>
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-cream">
        {hasPhoto ? (
          <img
            src={image}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <RecipePhotoPlaceholder className="h-full w-full flex-col" />
        )}
        {recipe?.verified && (
          <span className="absolute left-3 top-3">
            <VerifiedBadge className="bg-card/95 backdrop-blur" label="Verificada" />
          </span>
        )}
        <Badge
          variant="secondary"
          role="status"
          className={`absolute right-3 top-3 rounded-full border px-3 py-1 shadow-soft backdrop-blur ${statusColor}`}
        >
          {statusLabel}
        </Badge>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
        <div className="min-h-[5.25rem]">
          <p className="line-clamp-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {recipe?.category ?? "Receita publicada"}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-[3.25rem] text-lg font-semibold leading-snug text-foreground">
            {item.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">por {authorName}</p>
        </div>
        {recipe ? (
          <div className="flex items-center gap-2">
            <Stars value={recipe.rating} />
            <span className="text-sm font-semibold text-foreground">
              {recipe.rating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">({recipe.reviewsCount})</span>
          </div>
        ) : null}
        {showFooter && (
          <div className="mt-auto rounded-2xl bg-cream px-3 py-2 text-xs text-muted-foreground">
            {recipe && (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-verified">{recipe.successRate}% deu certo</span>
                <span className="flex items-center gap-1">
                  <Users width={12} height={12} /> {recipe.testedCount}
                </span>
                <span className="flex items-center gap-1">
                  <Clock width={12} height={12} /> {recipe.timeMinutes} min
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
  const className =
    "group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted";
  return recipe ? (
    <Link to="/receita/$recipeId" params={{ recipeId: recipe.id }} className={className}>
      {content}
    </Link>
  ) : (
    <article className={className}>{content}</article>
  );
}

function Profile() {
  const { user, refreshUser } = useAuth();
  const [published, setPublished] = useState<
    { id: string; title: string; status: string; fotoPrincipal?: string | null; recipe?: Recipe }[]
  >([]);
  const [tested, setTested] = useState<Recipe[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    void refreshUser().catch(() => undefined);
  }, [refreshUser, user?.id]);
  useEffect(() => {
    if (user?.role === "moderador") return;
    let active = true;
    Promise.all([
      api<{ id: number; titulo: string; status: string; fotoPrincipal: string | null }[]>(
        "/api/me/receitas",
      ),
      api<{ idReceita: number }[]>("/api/me/avaliacoes"),
    ])
      .then(async ([myRecipes, reviews]) => {
        const recipesWithDetails = await Promise.all(
          myRecipes.map(async (r) => {
            try {
              return {
                id: String(r.id),
                title: r.titulo,
                status: r.status,
                fotoPrincipal: r.fotoPrincipal,
                recipe: toRecipe(await api<RecipeDto>(`/api/receitas/${r.id}`)),
              };
            } catch {
              return {
                id: String(r.id),
                title: r.titulo,
                status: r.status,
                fotoPrincipal: r.fotoPrincipal,
              };
            }
          }),
        );
        const reviewed = await Promise.all(
          reviews.map(async (r) => {
            try {
              return toRecipe(await api<RecipeDto>(`/api/receitas/${r.idReceita}`));
            } catch {
              return null;
            }
          }),
        );
        if (active) {
          setPublished(recipesWithDetails);
          const uniqueRecipes = new Map<string, Recipe>();
          reviewed.forEach((r) => {
            if (r && !uniqueRecipes.has(r.id)) uniqueRecipes.set(r.id, r);
          });
          setTested([...uniqueRecipes.values()]);
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Erro ao carregar perfil.");
      });
    return () => {
      active = false;
    };
  }, [user?.role]);
  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <ProfileHeader
        name={user.name}
        handle={user.handle}
        fotoPerfil={user.fotoPerfil}
        bio={user.bio}
        since={user.since}
        moderator={user.role === "moderador"}
        stats={{
          receitas: user.stats.publicadas,
          seguidores: user.stats.seguidores,
          seguindo: user.stats.seguindo,
          avaliacoes: user.stats.avaliacoes,
          testes: user.stats.testadas,
        }}
        actions={
          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-full justify-center rounded-lg px-4"
          >
            <Link to="/configuracoes">
              <Settings width={15} height={15} /> Editar perfil
            </Link>
          </Button>
        }
        emptyBioAction={
          <Link
            to="/configuracoes"
            className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
          >
            Adicionar uma bio
          </Link>
        }
      />
      {user.role === "moderador" && (
        <section className="mt-6 rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-caramel">
                <ShieldCheck width={18} height={18} />
                <p className="text-xs font-semibold uppercase tracking-wider">Seu papel na Mums!</p>
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
                Área de moderação
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Ajude a manter receitas confiáveis e a comunidade segura. Estas são as ações
                disponíveis para sua conta:
              </p>
            </div>
            <Button asChild className="rounded-full">
              <Link to="/admin">
                Abrir painel <ArrowRight width={15} height={15} />
              </Link>
            </Button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              {
                icon: ClipboardCheck,
                title: "Receitas",
                description: "Revisar, aprovar, recusar ou excluir publicações.",
              },
              {
                icon: MessageSquareWarning,
                title: "Denúncias",
                description: "Analisar relatos e ocultar ou restaurar comentários.",
              },
              {
                icon: UsersRound,
                title: "Usuários",
                description: "Localizar contas e suspender ou reativar membros.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-border bg-warm p-4">
                <Icon width={17} height={17} className="text-caramel" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {user.role !== "moderador" && error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {user.role !== "moderador" && (
        <>
          <Tabs defaultValue="publicadas" className="mt-10">
            <TabsList className="rounded-full bg-secondary p-1">
              <TabsTrigger value="publicadas" className="rounded-full px-4">
                Publicadas
              </TabsTrigger>
              <TabsTrigger value="testadas" className="rounded-full px-4">
                Testadas
              </TabsTrigger>
              <TabsTrigger value="avaliacoes" className="rounded-full px-4">
                Minhas avaliações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="publicadas" className="mt-6">
              {published.length > 0 ? (
                <div className="grid auto-rows-fr items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {published.map((item) => (
                    <PublishedRecipeCard key={item.id} item={item} authorName={user.name} />
                  ))}
                </div>
              ) : (
                <EmptyTab
                  action={
                    user.role === "moderador" ? undefined : (
                      <Button asChild size="sm" className="mt-4 rounded-full">
                        <Link to="/publicar">
                          <Plus width={14} height={14} /> Publicar receita
                        </Link>
                      </Button>
                    )
                  }
                >
                  Você ainda não publicou nenhuma receita.
                </EmptyTab>
              )}
            </TabsContent>

            <TabsContent value="testadas" className="mt-6">
              {tested.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {tested.map((r) => (
                    <RecipeCard key={r.id} recipe={r} />
                  ))}
                </div>
              ) : (
                <EmptyTab
                  action={
                    <Button asChild size="sm" variant="outline" className="mt-4 rounded-full">
                      <Link to="/ranking">Ver receitas mais bem avaliadas</Link>
                    </Button>
                  }
                >
                  Quando você avaliar uma receita que testou, ela aparece aqui.
                </EmptyTab>
              )}
            </TabsContent>

            <TabsContent value="avaliacoes" className="mt-6 space-y-4">
              {tested.length === 0 && <EmptyTab>Você ainda não enviou avaliações.</EmptyTab>}
              {tested.map((r) => (
                <Link
                  key={r.id}
                  to="/receita/$recipeId"
                  params={{ recipeId: r.id }}
                  className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft transition-colors hover:bg-secondary/40"
                >
                  <img
                    src={r.image}
                    alt={r.title}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                  <div>
                    <p className="font-semibold text-foreground">{r.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Sua avaliação registrada
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Receita testada por você.</p>
                  </div>
                </Link>
              ))}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
