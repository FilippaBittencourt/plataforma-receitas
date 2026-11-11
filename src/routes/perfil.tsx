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
import { RecipeCard } from "@/components/site/RecipeCard";
import { RequireAuth } from "@/components/site/RequireAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { initialsOf, type Recipe } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { toRecipe, type RecipeDto } from "@/lib/recipes-api";
import { apiUrl } from "@/lib/api";
import { RecipePhotoPlaceholder } from "@/components/site/RecipePhotoPlaceholder";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Lipapa" },
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

function Profile() {
  const { user } = useAuth();
  const [published, setPublished] = useState<
    { id: string; title: string; status: string; fotoPrincipal?: string | null; recipe?: Recipe }[]
  >([]);
  const [tested, setTested] = useState<Recipe[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
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
            if (r.status !== "APROVADA")
              return {
                id: String(r.id),
                title: r.titulo,
                status: r.status,
                fotoPrincipal: r.fotoPrincipal,
              };
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
          setTested(reviewed.filter((r): r is Recipe => Boolean(r)));
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Erro ao carregar perfil.");
      });
    return () => {
      active = false;
    };
  }, []);
  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-col gap-6 rounded-[2rem] border border-border bg-warm p-8 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20 border border-border">
          {user.fotoPerfil && <AvatarImage src={apiUrl(user.fotoPerfil)} alt={user.name} />}
          <AvatarFallback className="bg-card text-xl font-semibold text-foreground">
            {initialsOf(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{user.name}</h1>
            {user.role === "moderador" && (
              <Badge variant="secondary" className="gap-1 rounded-full">
                <ShieldCheck width={12} height={12} /> Moderador
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {user.handle} · {user.since}
          </p>
          {user.bio ? (
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{user.bio}</p>
          ) : (
            <Link
              to="/configuracoes"
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              Adicionar uma bio
            </Link>
          )}
        </div>
        <Button asChild variant="outline" className="rounded-full bg-card">
          <Link to="/configuracoes">
            <Settings width={16} height={16} /> Editar perfil
          </Link>
        </Button>
      </div>
      {user.role === "moderador" && (
        <section className="mt-6 rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-caramel">
                <ShieldCheck width={18} height={18} />
                <p className="text-xs font-semibold uppercase tracking-wider">Seu papel na Lipapa</p>
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
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Receitas publicadas", value: user.stats.publicadas },
          { label: "Avaliações enviadas", value: user.stats.avaliacoes },
          { label: "Receitas testadas", value: user.stats.testadas },
          { label: "Seguidores", value: user.stats.seguidores.toLocaleString("pt-BR") },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card p-4 text-center shadow-soft"
          >
            <p className="font-display text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {published.map((r) =>
                r.recipe ? (
                  <RecipeCard key={r.id} recipe={r.recipe} />
                ) : (
                  <div
                    key={r.id}
                    className="flex h-full flex-col rounded-2xl border border-border bg-card p-5"
                  >
                    <p className="font-medium">{r.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Status: {r.status === "PENDENTE" ? "Em análise" : "Recusada"}
                    </p>
                    {r.status !== "RECUSADA" && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="mt-3 w-fit rounded-full"
                      >
                        <Link to="/publicar" search={{ editar: r.id }}>
                          Editar receita
                        </Link>
                      </Button>
                    )}
                    {r.fotoPrincipal ? (
                      <img
                        src={apiUrl(r.fotoPrincipal)}
                        alt={r.title}
                        className="mt-4 aspect-[4/3] w-full flex-1 rounded-xl object-cover"
                      />
                    ) : (
                      <RecipePhotoPlaceholder className="mt-4 min-h-40 flex-1 flex-col rounded-xl" />
                    )}
                  </div>
                ),
              )}
            </div>
          ) : (
            <EmptyTab
              action={
                <Button asChild size="sm" className="mt-4 rounded-full">
                  <Link to="/publicar" search={{ editar: undefined }}>
                    <Plus width={14} height={14} /> Publicar receita
                  </Link>
                </Button>
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
                  <span className="text-xs text-muted-foreground">Sua avaliação registrada</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Receita testada por você.</p>
              </div>
            </Link>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
