import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Settings, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Shell } from "@/components/site/Shell";
import { RecipeCard } from "@/components/site/RecipeCard";
import { RequireAuth } from "@/components/site/RequireAuth";
import { Stars } from "@/components/site/Stars";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { initialsOf, recipes } from "@/lib/mock-data";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Cookie" },
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
  if (!user) return null;
  const published = recipes.filter((r) => user.publishedIds.includes(r.id));
  const tested = recipes.filter((r) => user.testedIds.includes(r.id));

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-col gap-6 rounded-[2rem] border border-border bg-warm p-8 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20 border border-border">
          <AvatarFallback className="bg-card text-xl font-semibold text-foreground">
            {initialsOf(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{user.name}</h1>
            {user.role === "moderador" && (
              <Badge variant="secondary" className="gap-1 rounded-full">
                <ShieldCheck width={12} height={12} /> Moderação
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
              {published.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          ) : (
            <EmptyTab
              action={
                <Button asChild size="sm" className="mt-4 rounded-full">
                  <Link to="/publicar">
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
                  <Stars value={r.rating} size={12} />
                  <span className="text-xs text-muted-foreground">avaliada em agosto de 2026</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  “Medidas confiáveis, segui à risca e o resultado saiu como na foto.”
                </p>
              </div>
            </Link>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
