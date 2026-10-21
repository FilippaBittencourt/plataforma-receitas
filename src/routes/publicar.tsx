import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FieldError } from "@/components/site/PasswordInput";
import { PhotoPicker } from "@/components/site/PhotoPicker";
import { RequireAuth } from "@/components/site/RequireAuth";
import { Shell } from "@/components/site/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/lib/mock-data";

export const Route = createFileRoute("/publicar")({
  head: () => ({
    meta: [
      { title: "Publicar uma receita — Cookie" },
      {
        name: "description",
        content:
          "Publique sua receita com medidas precisas, tempo real e rendimento para que a comunidade possa testar.",
      },
      { property: "og:title", content: "Publicar uma receita — Cookie" },
      { property: "og:description", content: "Medidas claras, tempo real e rendimento confiável." },
    ],
  }),
  component: PublicarPage,
});

type Errors = Partial<Record<"titulo" | "categoria" | "tempo" | "ingredientes" | "passos", string>>;

function PublicarPage() {
  return (
    <Shell>
      <RequireAuth>
        <PublicarForm />
      </RequireAuth>
    </Shell>
  );
}

function PublicarForm() {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tempo, setTempo] = useState("");
  const [ingredients, setIngredients] = useState(["", ""]);
  const [steps, setSteps] = useState(["", ""]);
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (titulo.trim().length < 3) next.titulo = "Dê um nome para a receita.";
    if (!categoria) next.categoria = "Escolha uma categoria.";
    if (!(Number(tempo) > 0)) next.tempo = "Informe o tempo em minutos.";
    if (ingredients.filter((v) => v.trim()).length < 2)
      next.ingredientes = "Liste pelo menos 2 ingredientes.";
    if (steps.filter((v) => v.trim()).length < 1) next.passos = "Descreva pelo menos 1 passo.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Revise os campos destacados.");
      return;
    }
    toast.success("Receita enviada para curadoria", {
      description: "Protótipo: nenhum dado é salvo.",
    });
    navigate({ to: "/perfil" });
  };

  const update = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    idx: number,
    value: string,
  ) => setter((prev) => prev.map((v, i) => (i === idx ? value : v)));

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold text-foreground">Publicar uma receita</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Quanto mais precisa a informação, maior a chance da sua receita ser verificada.
      </p>

      <form className="mt-8 space-y-6" noValidate onSubmit={submit}>
        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Informações básicas</h2>
          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="titulo">Nome da receita</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                aria-invalid={Boolean(errors.titulo)}
                placeholder="Ex.: Cookies de caramelo salgado"
                className="mt-2 rounded-xl bg-background"
              />
              <FieldError>{errors.titulo}</FieldError>
            </div>
            <div>
              <Label htmlFor="resumo">Resumo</Label>
              <Textarea
                id="resumo"
                rows={3}
                placeholder="Em uma frase, o que torna essa receita confiável?"
                className="mt-2 rounded-xl bg-background"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger
                    aria-invalid={Boolean(errors.categoria)}
                    className="mt-2 rounded-xl bg-background"
                  >
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{errors.categoria}</FieldError>
              </div>
              <div>
                <Label htmlFor="tempo">Tempo (min)</Label>
                <Input
                  id="tempo"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={tempo}
                  onChange={(e) => setTempo(e.target.value)}
                  aria-invalid={Boolean(errors.tempo)}
                  placeholder="45"
                  className="mt-2 rounded-xl bg-background"
                />
                <FieldError>{errors.tempo}</FieldError>
              </div>
              <div>
                <Label htmlFor="rendimento">Rendimento</Label>
                <Input
                  id="rendimento"
                  placeholder="18 unidades"
                  className="mt-2 rounded-xl bg-background"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Foto principal</h2>
          <PhotoPicker
            className="mt-4"
            icon={<ImagePlus width={22} height={22} className="text-caramel" />}
            title="Arraste uma foto ou selecione"
            hint="Prefira a foto do prato real, sem edição pesada. PNG ou JPG até 5 MB."
          />
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Ingredientes</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Use gramas e mililitros sempre que possível — é o critério mais avaliado.
          </p>
          <div className="mt-4 space-y-2.5">
            {ingredients.map((v, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={v}
                  onChange={(e) => update(setIngredients, i, e.target.value)}
                  placeholder={`Ingrediente ${i + 1}`}
                  className="rounded-xl bg-background"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-xl"
                  aria-label={`Remover ingrediente ${i + 1}`}
                  disabled={ingredients.length === 1}
                  onClick={() => setIngredients((p) => p.filter((_, idx) => idx !== i))}
                >
                  <Trash2 width={16} height={16} />
                </Button>
              </div>
            ))}
          </div>
          <FieldError>{errors.ingredientes}</FieldError>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 rounded-full"
            onClick={() => setIngredients((p) => [...p, ""])}
          >
            <Plus width={14} height={14} /> Adicionar ingrediente
          </Button>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Modo de preparo</h2>
          <div className="mt-4 space-y-2.5">
            {steps.map((v, i) => (
              <div key={i} className="flex gap-2">
                <span className="mt-2.5 w-5 shrink-0 text-sm font-semibold text-muted-foreground">
                  {i + 1}.
                </span>
                <Textarea
                  value={v}
                  onChange={(e) => update(setSteps, i, e.target.value)}
                  rows={2}
                  placeholder="Descreva o passo com tempo e sinais visuais"
                  className="rounded-xl bg-background"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-xl"
                  aria-label={`Remover passo ${i + 1}`}
                  disabled={steps.length === 1}
                  onClick={() => setSteps((p) => p.filter((_, idx) => idx !== i))}
                >
                  <Trash2 width={16} height={16} />
                </Button>
              </div>
            ))}
          </div>
          <FieldError>{errors.passos}</FieldError>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 rounded-full"
            onClick={() => setSteps((p) => [...p, ""])}
          >
            <Plus width={14} height={14} /> Adicionar passo
          </Button>
        </section>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={() =>
              toast.success("Rascunho salvo", { description: "Protótipo: nenhum dado é salvo." })
            }
          >
            Salvar rascunho
          </Button>
          <Button type="submit" className="rounded-full px-7">
            Publicar receita
          </Button>
        </div>
      </form>
    </div>
  );
}
