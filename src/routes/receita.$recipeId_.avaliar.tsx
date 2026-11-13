import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, Star } from "lucide-react";
import { toast } from "@/lib/feedback";
import { FieldError } from "@/components/site/PasswordInput";
import { PhotoPicker } from "@/components/site/PhotoPicker";
import { RequireAuth } from "@/components/site/RequireAuth";
import { Shell } from "@/components/site/Shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { criteriaLabels, type Criteria, type Recipe } from "@/lib/mock-data";
import { getRecipe } from "@/lib/recipes-api";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/receita/$recipeId_/avaliar")({
  loader: async ({ params }) => {
    try {
      return { recipe: await getRecipe(params.recipeId) };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Registrar avaliação: ${loaderData.recipe.title} — Mums!`
          : "Registrar avaliação — Mums!",
      },
      {
        name: "description",
        content:
          "Registre o resultado de uma tentativa e avalie medidas, tempo, rendimento, clareza e resultado final.",
      },
      { property: "og:title", content: "Registrar avaliação — Mums!" },
      {
        property: "og:description",
        content: "Sua avaliação por critérios ajuda outras pessoas a cozinhar com segurança.",
      },
    ],
  }),
  component: AvaliarPage,
});

function CriterionStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} ${i === 1 ? "estrela" : "estrelas"}`}
          aria-pressed={value === i}
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
  const { user } = useAuth();
  return (
    <Shell>
      <RequireAuth>
        {user?.id === recipe.authorId ? (
          <div className="mx-auto max-w-xl px-5 py-24 text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Você não pode avaliar sua própria receita
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              As avaliações precisam vir de outras pessoas da comunidade.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/receita/$recipeId" params={{ recipeId: recipe.id }}>
                Voltar para a receita
              </Link>
            </Button>
          </div>
        ) : (
          <AvaliarForm recipe={recipe} />
        )}
      </RequireAuth>
    </Shell>
  );
}

function AvaliarForm({ recipe }: { recipe: Recipe }) {
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
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previousTestDate, setPreviousTestDate] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ success?: string; criteria?: string }>({});

  const filled = Object.values(scores).filter(Boolean).length;
  const average = filled > 0 ? Object.values(scores).reduce((a, b) => a + b, 0) / filled : 0;

  useEffect(() => {
    api<{ dataAvaliacao: string }>(`/api/receitas/${recipe.id}/avaliacao`)
      .then((evaluation) => setPreviousTestDate(evaluation.dataAvaliacao))
      .catch(() => setPreviousTestDate(null));
  }, [recipe.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (success === null) next.success = "Conte se a receita deu certo.";
    if (filled < criteriaLabels.length) next.criteria = "Dê uma nota para todos os critérios.";
    setErrors(next);
    if (next.success || next.criteria || photoUploading || submitting) return;
    setSubmitting(true);
    try {
      await api(`/api/receitas/${recipe.id}/avaliacao`, {
        method: "POST",
        body: JSON.stringify({
          funcionou: success,
          notas: {
            medidas: scores.medidas,
            tempo: scores.tempo,
            rendimento: scores.rendimento,
            clareza: scores.clareza,
            resultado: scores.resultado,
          },
          comentario: comment.trim() || null,
          fotoResultado: photo,
        }),
      });
      toast.success("Avaliação registrada!");
      navigate({ to: "/receita/$recipeId", params: { recipeId: recipe.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar o teste.");
      setSubmitting(false);
    }
  };

  return (
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
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Registrando teste
          </p>
          <h1 className="text-xl font-semibold text-foreground">{recipe.title}</h1>
          <p className="text-sm text-muted-foreground">por {recipe.author}</p>
        </div>
      </div>

      <form className="mt-8 space-y-6" noValidate onSubmit={submit}>
        {previousTestDate && (
          <p className="rounded-2xl border border-caramel/25 bg-warm px-4 py-3 text-sm text-foreground">
            Você já testou esta receita em {new Date(previousTestDate).toLocaleDateString("pt-BR")}.
            Este envio será registrado como uma nova tentativa.
          </p>
        )}
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
                aria-pressed={success === opt.ok}
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
          <FieldError>{errors.success}</FieldError>
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
          <FieldError>{errors.criteria}</FieldError>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <Label htmlFor="comentario-teste" className="text-lg font-semibold text-foreground">
            Comentário sobre esta tentativa
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Conte ajustes que fez, tempo real de preparo ou o resultado que obteve.
          </p>
          <Textarea
            id="comentario-teste"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Conte como foi preparar a receita desta vez"
            className="mt-4 rounded-2xl bg-background"
          />
          <PhotoPicker
            className="mt-5"
            icon={<Camera width={20} height={20} className="text-caramel" />}
            title="Envie uma foto do seu resultado (opcional)"
            hint="PNG, JPG ou WEBP · até 5 MB"
            onUploaded={setPhoto}
            onUploadingChange={setPhotoUploading}
          />
        </section>

        <div className="flex justify-end gap-3">
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/receita/$recipeId" params={{ recipeId: recipe.id }}>
              Cancelar
            </Link>
          </Button>
          <Button
            type="submit"
            className="rounded-full px-7"
            disabled={photoUploading || submitting}
          >
            {photoUploading
              ? "Enviando foto…"
              : submitting
                ? "Salvando…"
                : previousTestDate
                  ? "Registrar outra avaliação"
                  : "Registrar avaliação"}
          </Button>
        </div>
      </form>
    </div>
  );
}
