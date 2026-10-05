import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { Shell } from "@/components/site/Shell";
import { RecipeCard } from "@/components/site/RecipeCard";
import { Stars } from "@/components/site/Stars";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currentUser, recipes } from "@/lib/mock-data";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil de Júlia Ferraz — Cookie" },
      {
        name: "description",
        content: "Receitas publicadas, avaliações enviadas e resultados testados por Júlia Ferraz.",
      },
      { property: "og:title", content: "Perfil de Júlia Ferraz — Cookie" },
      { property: "og:description", content: "Histórico de receitas testadas e avaliadas." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const published = recipes.slice(0, 2);
  const tested = recipes.slice(2, 5);

  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="flex flex-col gap-6 rounded-[2rem] border border-border bg-warm p-8 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20 border border-border">
            <AvatarFallback className="bg-card text-xl font-semibold text-foreground">
              {currentUser.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">{currentUser.name}</h1>
            <p className="text-sm text-muted-foreground">
              {currentUser.handle} · {currentUser.since}
            </p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{currentUser.bio}</p>
          </div>
          <Button variant="outline" className="rounded-full bg-card">
            <Settings width={16} height={16} /> Editar perfil
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Receitas publicadas", value: currentUser.stats.publicadas },
            { label: "Avaliações enviadas", value: currentUser.stats.avaliacoes },
            { label: "Receitas testadas", value: currentUser.stats.testadas },
            { label: "Seguidores", value: currentUser.stats.seguidores.toLocaleString("pt-BR") },
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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {published.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="testadas" className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tested.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="avaliacoes" className="mt-6 space-y-4">
            {recipes.slice(0, 3).map((r) => (
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
    </Shell>
  );
}
