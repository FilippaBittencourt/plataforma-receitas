import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/site/Shell";
import { RecipeCard } from "@/components/site/RecipeCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, apiUrl } from "@/lib/api";
import { requestText, toast } from "@/lib/feedback";
import { toRecipe, type RecipeDto } from "@/lib/recipes-api";
import type { Recipe } from "@/lib/mock-data";

type PublicProfile = {
  id: number;
  nome: string;
  nomeUsuario: string;
  bio: string | null;
  fotoPerfil: string | null;
  moderador: boolean;
  dataCadastro: string;
  estatisticas: { receitasPublicadas: number; avaliacoes: number };
};

export const Route = createFileRoute("/usuarios/$nomeUsuario")({
  loader: async ({ params }) => {
    try {
      return await api<PublicProfile>(`/api/usuarios/${encodeURIComponent(params.nomeUsuario)}`);
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.nome ?? "Perfil"} — Mums!` },
      { name: "description", content: loaderData?.bio ?? "Perfil público da comunidade Mums!." },
    ],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const profile = Route.useLoaderData();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState("");
  const reportProfile = async () => {
    const motivo = await requestText({
      title: "Denunciar perfil",
      description: "Conte à moderação por que este perfil deve ser analisado.",
      placeholder: "Descreva o motivo da denúncia",
      maxLength: 500,
      confirmLabel: "Enviar denúncia",
    });
    if (!motivo?.trim()) return;
    try {
      await api("/api/denuncias", {
        method: "POST",
        body: JSON.stringify({
          nomeUsuario: profile.nomeUsuario,
          motivo: motivo.trim().slice(0, 500),
        }),
      });
      toast.success("Denúncia enviada para a moderação");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar a denúncia.");
    }
  };
  useEffect(() => {
    let active = true;
    api<RecipeDto[]>(`/api/usuarios/${encodeURIComponent(profile.nomeUsuario)}/receitas`)
      .then((items) => {
        if (active) setRecipes(items.map(toRecipe));
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Não foi possível carregar as receitas.");
      });
    return () => {
      active = false;
    };
  }, [profile.nomeUsuario]);
  return (
    <Shell>
      <main className="mx-auto max-w-5xl px-5 py-12">
        <section className="flex flex-col gap-5 rounded-[2rem] border border-border bg-warm p-8 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20 border border-border">
            <AvatarImage src={apiUrl(profile.fotoPerfil)} alt={profile.nome} />
            <AvatarFallback className="bg-card text-xl">
              {profile.nome
                .split(/\s+/)
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{profile.nome}</h1>
              {profile.moderador && <Badge variant="secondary">Moderação</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              @{profile.nomeUsuario.replace(/^@/, "")} · Membro desde{" "}
              {new Date(profile.dataCadastro).getFullYear()}
            </p>
            {profile.bio && (
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">{profile.bio}</p>
            )}
          </div>
          <div className="sm:ml-auto sm:text-right">
            <p className="text-2xl font-semibold">{profile.estatisticas.receitasPublicadas}</p>
            <p className="text-xs text-muted-foreground">receitas publicadas</p>
            <p className="mt-2 text-sm">{profile.estatisticas.avaliacoes} avaliações</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => void reportProfile()}
          >
            Denunciar perfil
          </Button>
        </section>
        <h2 className="mt-10 text-xl font-semibold">Receitas publicadas</h2>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        {recipes.length ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        ) : (
          !error && (
            <p className="mt-4 text-sm text-muted-foreground">
              Este perfil ainda não tem receitas públicas.
            </p>
          )
        )}
      </main>
    </Shell>
  );
}
