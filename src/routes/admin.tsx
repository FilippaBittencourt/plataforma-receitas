import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Ban, Check, RotateCcw, ShieldCheck, X } from "lucide-react";
import { toast } from "@/lib/feedback";
import { RequireAuth } from "@/components/site/RequireAuth";
import { Shell } from "@/components/site/Shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { DeleteRecipeButton } from "@/components/site/DeleteRecipeButton";

type QueueItem = {
  id: number;
  titulo: string;
  origem: string;
  urlFonte: string | null;
  categoria: { nome: string };
  autor: { nome: string; nomeUsuario: string } | null;
  dataPublicacao: string;
};
type Report = {
  id: number;
  trechoComentario: string | null;
  motivo: string;
  idComentario: number | null;
  denunciado: { nome: string; nomeUsuario: string } | null;
  dataDenuncia: string;
};
type ManagedUser = {
  id: number;
  nome: string;
  nomeUsuario: string;
  email: string;
  status: string;
  tipo: string;
  dataCadastro: string;
};
type Summary = {
  receitasPendentes: number;
  aprovadasHoje: number;
  recusadasHoje: number;
  denunciasAbertas: number;
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Moderação — Mums!" },
      {
        name: "description",
        content:
          "Fila de curadoria: receitas, comentários, fotos e links externos aguardando revisão.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <Shell>
      <RequireAuth role="moderador">
        <Moderation />
      </RequireAuth>
    </Shell>
  );
}

function Moderation() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<Summary>({
    receitasPendentes: 0,
    aprovadasHoje: 0,
    recusadasHoje: 0,
    denunciasAbertas: 0,
  });
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      const [q, u, d, s] = await Promise.all([
        api<QueueItem[]>("/api/moderacao/receitas"),
        api<ManagedUser[]>(`/api/moderacao/usuarios/gestao?q=${encodeURIComponent(userQuery)}`),
        api<Report[]>("/api/moderacao/denuncias"),
        api<Summary>("/api/moderacao/resumo"),
      ]);
      setQueue(q);
      setUsers(u);
      setReports(d);
      setSummary(s);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar a moderação.");
    }
  }, [userQuery]);
  useEffect(() => {
    void reload();
  }, [reload]);

  const decideRecipe = async (id: number, approved: boolean) => {
    try {
      await api(`/api/moderacao/receitas/${id}/${approved ? "aprovar" : "recusar"}`, {
        method: "POST",
      });
      toast.success(approved ? "Receita aprovada" : "Receita recusada");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao moderar receita.");
    }
  };
  const deleteRecipe = async (item: QueueItem) => {
    await api(`/api/receitas/${item.id}`, { method: "DELETE" });
    toast.success("Receita excluída");
    await reload();
  };
  const decideReport = async (report: Report, hide: boolean) => {
    try {
      if (report.idComentario && hide)
        await api(`/api/moderacao/comentarios/${report.idComentario}/ocultar`, { method: "POST" });
      await api(`/api/moderacao/denuncias/${report.id}/resolver`, { method: "POST" });
      toast.success("Denúncia resolvida");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao resolver denúncia.");
    }
  };
  const restoreComment = async (id: number) => {
    try {
      await api(`/api/moderacao/comentarios/${id}/restaurar`, { method: "POST" });
      toast.success("Comentário restaurado");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao restaurar comentário.");
    }
  };
  const toggleSuspension = async (u: ManagedUser) => {
    try {
      await api(
        `/api/moderacao/usuarios/${u.id}/${u.status === "ATIVO" ? "suspender" : "reativar"}`,
        { method: "POST" },
      );
      toast.success(u.status === "ATIVO" ? "Conta suspensa" : "Conta reativada");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar conta.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex items-center gap-2">
        <ShieldCheck width={20} height={20} className="text-caramel" />
        <h1 className="text-3xl font-semibold text-foreground">Moderação</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Curadoria manual do que entra na plataforma — a base da confiança da Mums!.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Na fila", value: summary.receitasPendentes },
          { label: "Aprovadas hoje", value: summary.aprovadasHoje },
          { label: "Recusadas hoje", value: summary.recusadasHoje },
          { label: "Denúncias abertas", value: summary.denunciasAbertas },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="font-display text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs
        defaultValue="fila"
        className="mt-10"
        onValueChange={(tab) => {
          if (tab === "usuarios") void reload();
        }}
      >
        <TabsList className="rounded-full bg-secondary p-1">
          <TabsTrigger value="fila" className="rounded-full px-4">
            Fila de revisão ({queue.length})
          </TabsTrigger>
          <TabsTrigger value="denuncias" className="rounded-full px-4">
            Denúncias ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="rounded-full px-4">
            Usuários ({users.length})
          </TabsTrigger>
        </TabsList>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <TabsContent value="fila" className="mt-6">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            {queue.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                Nada pendente. Fila zerada.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {queue.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-4 px-6 py-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="rounded-full">
                          {item.origem === "EXTERNA" ? "Link externo" : "Receita"}
                        </Badge>
                        <p className="font-medium text-foreground">{item.titulo}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.autor?.nomeUsuario ?? "Autor removido"} · {item.categoria.nome} ·{" "}
                        {new Date(item.dataPublicacao).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <DeleteRecipeButton
                        recipeTitle={item.titulo}
                        onDelete={() => deleteRecipe(item)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => void decideRecipe(item.id, false)}
                      >
                        <X width={14} height={14} /> Recusar
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => void decideRecipe(item.id, true)}
                      >
                        <Check width={14} height={14} /> Aprovar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="denuncias" className="mt-6">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            {reports.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                Nenhuma denúncia aberta.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {reports.map((report) => (
                  <li key={report.id} className="flex flex-wrap items-center gap-4 px-6 py-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {report.denunciado?.nomeUsuario ?? "Usuário"} · {report.motivo}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {report.trechoComentario || "Denúncia de perfil"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => void decideReport(report, false)}
                    >
                      Manter e resolver
                    </Button>
                    {report.idComentario && (
                      <>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-full"
                          onClick={() => void decideReport(report, true)}
                        >
                          Ocultar comentário
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full"
                          onClick={() => void restoreComment(report.idComentario!)}
                        >
                          Restaurar comentário
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-6">
          <label htmlFor="busca-usuarios" className="sr-only">
            Buscar usuários
          </label>
          <input
            id="busca-usuarios"
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void reload();
              }
            }}
            placeholder="Buscar por nome, usuário ou e-mail"
            className="mb-4 h-11 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-ring"
          />
          <div className="mb-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => void reload()}
            >
              Buscar
            </Button>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <ul className="divide-y divide-border">
              {users.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center gap-4 px-6 py-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{u.nome}</p>
                      <span className="text-xs text-muted-foreground">{u.nomeUsuario}</span>
                      <Badge
                        variant={u.status === "SUSPENSO" ? "destructive" : "secondary"}
                        className="rounded-full"
                      >
                        {u.status === "SUSPENSO" ? "Suspenso" : "Ativo"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {u.email} · {u.tipo === "ADMINISTRADOR" ? "Administrador" : "Usuário"} ·
                      cadastro em {new Date(u.dataCadastro).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {u.tipo !== "ADMINISTRADOR" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => void toggleSuspension(u)}
                    >
                      {u.status === "SUSPENSO" ? (
                        <>
                          <RotateCcw width={14} height={14} /> Reativar
                        </>
                      ) : (
                        <>
                          <Ban width={14} height={14} /> Suspender
                        </>
                      )}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
