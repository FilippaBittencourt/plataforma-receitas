import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Ban, Check, RotateCcw, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/site/RequireAuth";
import { Shell } from "@/components/site/Shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { moderationQueue, moderationUsers } from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Moderação — Cookie" },
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
  const [queue, setQueue] = useState(moderationQueue);
  const [users, setUsers] = useState(moderationUsers);
  const [resolved, setResolved] = useState({ approved: 34, rejected: 6 });

  const resolve = (id: string, approved: boolean) => {
    setQueue((q) => q.filter((item) => item.id !== id));
    setResolved((r) =>
      approved ? { ...r, approved: r.approved + 1 } : { ...r, rejected: r.rejected + 1 },
    );
    toast.success(approved ? "Item aprovado" : "Item recusado");
  };

  const toggleSuspension = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const status = target.status === "ativo" ? "suspenso" : "ativo";
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, status } : u)));
    toast.success(
      status === "suspenso" ? `${target.handle} foi suspenso` : `${target.handle} foi reativado`,
    );
  };

  const openReports = users.filter((u) => u.status === "ativo").length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex items-center gap-2">
        <ShieldCheck width={20} height={20} className="text-caramel" />
        <h1 className="text-3xl font-semibold text-foreground">Moderação</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Curadoria manual do que entra na plataforma — a base da confiança do Cookie.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Na fila", value: queue.length },
          { label: "Aprovadas hoje", value: resolved.approved },
          { label: "Recusadas hoje", value: resolved.rejected },
          { label: "Denúncias abertas", value: openReports },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="font-display text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="fila" className="mt-10">
        <TabsList className="rounded-full bg-secondary p-1">
          <TabsTrigger value="fila" className="rounded-full px-4">
            Fila de revisão ({queue.length})
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="rounded-full px-4">
            Usuários denunciados ({users.length})
          </TabsTrigger>
        </TabsList>

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
                          {item.type}
                        </Badge>
                        <p className="font-medium text-foreground">{item.title}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.author} · {item.reason} · {item.date}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => resolve(item.id, false)}
                      >
                        <X width={14} height={14} /> Recusar
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => resolve(item.id, true)}
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

        <TabsContent value="usuarios" className="mt-6">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <ul className="divide-y divide-border">
              {users.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center gap-4 px-6 py-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{u.name}</p>
                      <span className="text-xs text-muted-foreground">{u.handle}</span>
                      <Badge
                        variant={u.status === "suspenso" ? "destructive" : "secondary"}
                        className="rounded-full"
                      >
                        {u.status === "suspenso" ? "Suspenso" : "Ativo"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {u.reports} {u.reports === 1 ? "denúncia" : "denúncias"} · {u.reason}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => toggleSuspension(u.id)}
                  >
                    {u.status === "suspenso" ? (
                      <>
                        <RotateCcw width={14} height={14} /> Reativar
                      </>
                    ) : (
                      <>
                        <Ban width={14} height={14} /> Suspender
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
