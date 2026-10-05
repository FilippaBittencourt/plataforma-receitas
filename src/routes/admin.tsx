import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/site/Shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { moderationQueue } from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Moderação — Cookie" },
      {
        name: "description",
        content: "Fila de curadoria: receitas, comentários, fotos e links externos aguardando revisão.",
      },
      { property: "og:title", content: "Moderação — Cookie" },
      { property: "og:description", content: "Área administrativa simples de moderação." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [queue, setQueue] = useState(moderationQueue);

  const resolve = (id: string, approved: boolean) => {
    setQueue((q) => q.filter((item) => item.id !== id));
    toast.success(approved ? "Item aprovado" : "Item recusado");
  };

  return (
    <Shell>
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
            { label: "Aprovadas hoje", value: 34 },
            { label: "Recusadas hoje", value: 6 },
            { label: "Denúncias abertas", value: 2 },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <p className="font-display text-2xl font-semibold text-foreground">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div className="border-b border-border px-6 py-4">
            <p className="font-semibold text-foreground">Fila de revisão</p>
          </div>
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
                    <Button size="sm" className="rounded-full" onClick={() => resolve(item.id, true)}>
                      <Check width={14} height={14} /> Aprovar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Shell>
  );
}
