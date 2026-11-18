import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Ellipsis, UsersRound } from "lucide-react";
import { Shell } from "@/components/site/Shell";
import { ProfileHeader } from "@/components/site/ProfileHeader";
import { RecipeCard } from "@/components/site/RecipeCard";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { requestText, toast } from "@/lib/feedback";
import { toRecipe, type RecipeDto } from "@/lib/recipes-api";
import type { Recipe } from "@/lib/mock-data";
import { useAuth } from "@/lib/use-auth";

type PublicProfile = {
  id: number;
  nome: string;
  nomeUsuario: string;
  bio: string | null;
  fotoPerfil: string | null;
  moderador: boolean;
  dataCadastro: string;
  estatisticas: {
    receitasPublicadas: number;
    avaliacoes: number;
    receitasTestadas: number;
    seguidores?: number;
    seguindo?: number;
  };
};

export const Route = createFileRoute("/usuarios/$nomeUsuario")({
  loader: async ({ params }) => {
    try {
      return await api<PublicProfile>(`/api/usuarios/${encodeURIComponent(params.nomeUsuario)}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
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
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(profile.estatisticas.seguidores ?? 0);
  const [followBusy, setFollowBusy] = useState(false);
  const isOwnProfile =
    user?.handle.replace(/^@/, "").toLowerCase() === profile.nomeUsuario.toLowerCase();
  const canFollow = !!user && user.role !== "moderador" && !isOwnProfile && !profile.moderador;
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
  useEffect(() => {
    let active = true;
    setFollowerCount(profile.estatisticas.seguidores ?? 0);
    if (!canFollow) {
      setIsFollowing(false);
      return () => {
        active = false;
      };
    }
    api<{ seguindo: boolean }>(`/api/usuarios/${encodeURIComponent(profile.nomeUsuario)}/seguir`)
      .then(({ seguindo }) => {
        if (active) setIsFollowing(seguindo);
      })
      .catch(() => {
        if (active) setIsFollowing(false);
      });
    return () => {
      active = false;
    };
  }, [profile.nomeUsuario, profile.estatisticas.seguidores, canFollow]);
  const toggleFollow = async () => {
    if (!canFollow || followBusy) return;
    setFollowBusy(true);
    const next = !isFollowing;
    setIsFollowing(next);
    setFollowerCount((count) => Math.max(0, count + (next ? 1 : -1)));
    try {
      await api(`/api/usuarios/${encodeURIComponent(profile.nomeUsuario)}/seguir`, {
        method: next ? "PUT" : "DELETE",
      });
    } catch (e) {
      setIsFollowing(!next);
      setFollowerCount((count) => Math.max(0, count + (next ? -1 : 1)));
      toast.error(e instanceof Error ? e.message : "Não foi possível atualizar seguidores.");
    } finally {
      setFollowBusy(false);
    }
  };
  return (
    <Shell>
      <main className="mx-auto max-w-5xl px-5 py-12">
        <ProfileHeader
          name={profile.nome}
          handle={profile.nomeUsuario}
          fotoPerfil={profile.fotoPerfil}
          bio={profile.bio}
          since={`Membro desde ${new Date(profile.dataCadastro).getFullYear()}`}
          moderator={profile.moderador}
          stats={{
            receitas: profile.estatisticas.receitasPublicadas,
            seguidores: followerCount,
            seguindo: profile.estatisticas.seguindo ?? 0,
            avaliacoes: profile.estatisticas.avaliacoes,
            testes: profile.estatisticas.receitasTestadas,
          }}
          actions={
            <>
              {canFollow && (
                <Button
                  type="button"
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className="w-24 shrink-0 justify-center rounded-lg px-4"
                  disabled={followBusy}
                  onClick={() => void toggleFollow()}
                >
                  {isFollowing ? "Seguindo" : "Seguir"}
                </Button>
              )}
              {!user && !profile.moderador && (
                <Button asChild type="button" size="sm" className="rounded-lg px-4">
                  <Link to="/entrar">Seguir</Link>
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground"
                onClick={() => void reportProfile()}
                aria-label="Denunciar perfil"
                title="Denunciar perfil"
              >
                <Ellipsis className="h-5 w-5" />
              </Button>
            </>
          }
        />
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
