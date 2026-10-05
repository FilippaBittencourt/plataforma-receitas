import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { Shell } from "@/components/site/Shell";
import { Stars } from "@/components/site/Stars";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";
import { recipes } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking das receitas mais confiáveis — Cookie" },
      {
        name: "description",
        content:
          "As receitas com maior nota, maior taxa de sucesso e maior número de testes da comunidade.",
      },
      { property: "og:title", content: "Ranking das receitas mais confiáveis — Cookie" },
      { property: "og:description", content: "Classificação por sucesso real, não por popularidade." },
    ],
  }),
  component: RankingPage,
});

const tabs = [
  { id: "nota", label: "Melhor nota" },
  { id: "sucesso", label: "Maior taxa de sucesso" },
  { id: "testadas", label: "Mais testadas" },
] as const;

function RankingPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("nota");

  const list = [...recipes].sort((a, b) => {
    if (tab === "sucesso") return b.successRate - a.successRate;
    if (tab === "testadas") return b.testedCount - a.testedCount;
    return b.rating - a.rating;
  });

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-5 py-12">
        <div className="flex items-center gap-2">
          <Trophy width={20} height={20} className="text-caramel" />
          <h1 className="text-3xl font-semibold text-foreground">Ranking da comunidade</h1>
        </div>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Classificação baseada em experiência real: nota média por critérios, percentual de sucesso
          e volume de testes.
        </p>

        <div className="mt-8 inline-flex rounded-full border border-border bg-card p-1 shadow-soft">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <ol className="mt-8 space-y-3">
          {list.map((r, i) => (
            <li key={r.id}>
              <Link
                to="/receita/$recipeId"
                params={{ recipeId: r.id }}
                className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lifted"
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold",
                    i === 0
                      ? "bg-caramel text-primary-foreground"
                      : "bg-secondary text-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <img
                  src={r.image}
                  alt={r.title}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{r.title}</p>
                    {r.verified && <VerifiedBadge label="Verificada" />}
                  </div>
                  <p className="text-sm text-muted-foreground">por {r.author}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Stars value={r.rating} size={12} />
                    <span className="text-xs text-muted-foreground">
                      {r.reviewsCount.toLocaleString("pt-BR")} avaliações
                    </span>
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-display text-2xl font-semibold text-verified">
                    {r.successRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.testedCount.toLocaleString("pt-BR")} testes
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </Shell>
  );
}
