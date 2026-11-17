import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { api, apiUrl } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initialsOf } from "@/lib/mock-data";

export type ProfileHeaderStats = {
  receitas: number;
  seguidores: number;
  seguindo: number;
  avaliacoes: number;
  testes: number;
};

type ProfileHeaderProps = {
  name: string;
  handle: string;
  fotoPerfil?: string | null;
  bio?: string | null;
  since: string;
  moderator?: boolean;
  stats?: ProfileHeaderStats;
  actions?: ReactNode;
  emptyBioAction?: ReactNode;
};

export function ProfileHeader({
  name,
  handle,
  fotoPerfil,
  bio,
  since,
  moderator = false,
  stats,
  actions,
  emptyBioAction,
}: ProfileHeaderProps) {
  const [socialList, setSocialList] = useState<"seguidores" | "seguindo" | null>(null);
  const [people, setPeople] = useState<
    { id: number; nome: string; nomeUsuario: string; fotoPerfil: string | null }[]
  >([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  useEffect(() => {
    if (!socialList) return;
    let active = true;
    setListLoading(true);
    setListError("");
    api<{ id: number; nome: string; nomeUsuario: string; fotoPerfil: string | null }[]>(
      `/api/usuarios/${encodeURIComponent(handle)}/${socialList}`,
    )
      .then((items) => {
        if (active) setPeople(items);
      })
      .catch((error) => {
        if (active)
          setListError(
            error instanceof Error ? error.message : "Não foi possível carregar a lista.",
          );
      })
      .finally(() => {
        if (active) setListLoading(false);
      });
    return () => {
      active = false;
    };
  }, [handle, socialList]);

  return (
    <>
      <section className="mx-auto grid max-w-4xl grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-5 gap-y-5 border-b border-border/70 pb-8 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-x-12 sm:gap-y-6">
        <Avatar className="row-start-1 h-20 w-20 shrink-0 border border-border sm:row-span-3 sm:h-36 sm:w-36 sm:self-start">
          {fotoPerfil && <AvatarImage src={apiUrl(fotoPerfil)} alt={name} />}
          <AvatarFallback className="bg-warm text-2xl font-semibold text-foreground sm:text-4xl">
            {initialsOf(name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
          <h1 className="truncate text-xl font-medium text-foreground sm:text-2xl">
            @{handle.replace(/^@/, "")}
          </h1>
          {actions && <div className="flex h-9 w-36 shrink-0 items-center gap-2">{actions}</div>}
        </div>

        {stats && !moderator && (
          <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border/60 py-3 text-sm sm:col-span-1 sm:grid-cols-5 sm:gap-x-2 sm:border-0 sm:py-0">
            {[
              { label: "receitas", value: stats.receitas, list: null },
              { label: "seguidores", value: stats.seguidores, list: "seguidores" as const },
              { label: "seguindo", value: stats.seguindo, list: "seguindo" as const },
              { label: "avaliações", value: stats.avaliacoes, list: null },
              { label: "testes", value: stats.testes, list: null },
            ].map((stat) => (
              <p key={stat.label} className="whitespace-nowrap">
                {stat.list ? (
                  <button
                    type="button"
                    className="rounded-sm text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setSocialList(stat.list)}
                    aria-label={`Ver ${stat.label} de ${name}`}
                  >
                    <strong className="font-semibold text-foreground">
                      {stat.value.toLocaleString("pt-BR")}
                    </strong>{" "}
                    {stat.label}
                  </button>
                ) : (
                  <>
                    <strong className="font-semibold text-foreground">
                      {stat.value.toLocaleString("pt-BR")}
                    </strong>{" "}
                    {stat.label}
                  </>
                )}
              </p>
            ))}
          </div>
        )}

        <div className="col-span-2 min-w-0 sm:col-span-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{name}</p>
            {moderator && <Badge variant="secondary">Moderação</Badge>}
          </div>
          {bio ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{bio}</p>
          ) : (
            emptyBioAction
          )}
          <p className="mt-1 text-xs text-muted-foreground">{since}</p>
        </div>
      </section>
      <Dialog open={socialList !== null} onOpenChange={(open) => !open && setSocialList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{socialList === "seguidores" ? "Seguidores" : "Seguindo"}</DialogTitle>
            <DialogDescription>@{handle.replace(/^@+/, "")}</DialogDescription>
          </DialogHeader>
          {listError ? (
            <p role="alert" className="text-sm text-destructive">
              {listError}
            </p>
          ) : listLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Carregando…</p>
          ) : people.length ? (
            <ul className="max-h-96 space-y-1 overflow-y-auto">
              {people.map((person) => (
                <li key={person.id}>
                  <Link
                    to="/usuarios/$nomeUsuario"
                    params={{ nomeUsuario: person.nomeUsuario }}
                    className="flex items-center gap-3 rounded-xl p-2 hover:bg-secondary/60"
                    onClick={() => setSocialList(null)}
                  >
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={apiUrl(person.fotoPerfil)} alt={person.nome} />
                      <AvatarFallback className="bg-warm">{initialsOf(person.nome)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {person.nome}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        @{person.nomeUsuario.replace(/^@+/, "")}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {socialList === "seguidores"
                ? "Ainda não há seguidores."
                : "Ainda não segue ninguém."}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
