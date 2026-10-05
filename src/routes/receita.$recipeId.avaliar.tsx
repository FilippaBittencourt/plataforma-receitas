import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Camera, Star } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/site/Shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { criteriaLabels, getRecipe, type Criteria } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/receita/$recipeId/avaliar")({
  loader: ({ params }) => {
    const recipe = getRecipe(params.recipeId);
    if (!recipe) throw notFound();
    return { recipe };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `Avaliar ${loaderData.recipe.title} — Cookie` : "Avaliar receita — Cookie",
      },
      {
        name: "description",
        content:
          "Avalie medidas, tempo, rendimento, clareza e resultado final e conte se a receita funcionou.",
      },
      { property: "og:title", content: "Avaliar receita — Cookie" },
      {
        property: "og:description",
        content: "Sua avaliação por critérios ajuda outras pessoas a cozinhar com segurança.",
      },
    ],
  }),
  component: AvaliarPage,
});

function CriterionStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} estrelas`}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110"
        >
          <Star
            width={26}
            height={26}
            strokeWidth={1.5}
            className={cn(value >= i ? "fill-caramel text-caramel" : "fill-transparent text-sand")}
          />
        </button>
      ))}
    </div>
  );
}

function AvaliarPage() {
  const { recipe } = Route.useLoaderData();
  const navigate = useNavigate();
  const [scores, setScores] = useState<Criteria>({
    medidas: 0,
    tempo: 0,
    rendimento: 0,
    clareza: 0,
    resultado: 0,
  });
  const [success, setSuccess] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");

  const filled = Object.values(scores).filter(Boolean).length;
  const average =
    filled > 0 ? Object.values(scores).reduce((a, b) => a + b, 0) / filled : 0;

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Link
          to="/receita/$recipeId"
          params={{ recipeId: recipe.id }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft width={14} height={14} /> Voltar para a receita
        </Link>

        <div className="mt-6 flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <img
            src={recipe.image}
            alt={recipe.title}
            loading="lazy"
            width={1024}
            height={768}
            className="h-16 w-16 rounded-2xl object-cover"
          />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Avaliando</p>
            <h1 className="text-xl font-semibold text-foreground">{recipe.title}</h1>
            <p className="text-sm text-muted-foreground">por {recipe.author}</p>
          </div>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Avaliação enviada!", {
              description: "Protótipo: nada é salvo, mas obrigado por testar o fluxo.",
            });
            navigate({ to: "/receita/$recipeId", params: { recipeId: recipe.id } });
          }}
        >
          <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground">A receita funcionou para você?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { ok: true, title: "Sim, deu certo", text: "O resultado ficou como o esperado." },
                { ok: false, title: "Não deu certo", text: "Algo não bateu com o descrito." },
              ].map((opt) => (
                <button
                  key={opt.title}
                  type="button"
                  onClick={() => setSuccess(opt.ok)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors",
                    success === opt.ok
                      ? "border-caramel bg-warm"
                      : "border-border bg-background hover:bg-secondary",
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">{opt.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{opt.text}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground">Avalie por critérios</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              É isso que diferencia uma receita testada de uma receita bonita.
            </p>
            <div className="mt-6 space-y-6">
              {criteriaLabels.map(({ key, label, hint }) => (
                <div key={key} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                  </div>
                  <CriterionStars
                    value={scores[key]}
                    onChange={(v) => setScores((s) => ({ ...s, [key]: v }))}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
              <span className="text-sm text-muted-foreground">Sua nota média</span>
              <span className="font-display text-2xl font-semibold text-foreground">
                {average.toFixed(1)}
              </span>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <Label htmlFor="comentario" className="text-lg font-semibold text-foreground">
              Comentário
            </Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Conte ajustes que fez, tempo real de forno, rendimento obtido.
            </p>
            <Textarea
              id="comentario"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              placeholder="Ex.: assei por 13 minutos em forno a gás e rendeu 16 unidades..."
              className="mt-4 rounded-2xl bg-background"
            />

            <div className="mt-5 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background p-8 text-center">
              <Camera width={20} height={20} className="text-caramel" />
              <p className="text-sm font-medium text-foreground">Envie a foto do seu resultado</p>
              <p className="text-xs text-muted-foreground">PNG ou JPG até 5 MB (protótipo)</p>
              <Button type="button" variant="outline" size="sm" className="mt-2 rounded-full">
                Escolher arquivo
              </Button>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/receita/$recipeId" params={{ recipeId: recipe.id }}>
                Cancelar
              </Link>
            </Button>
            <Button type="submit" className="rounded-full px-7">
              Enviar avaliação
            </Button>
          </div>
        </form>
      </div>
    </Shell>
  );
}
