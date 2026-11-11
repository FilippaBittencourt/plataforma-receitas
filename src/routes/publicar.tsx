import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { api } from "@/lib/api";

export const Route = createFileRoute("/publicar")({
  validateSearch: (search: Record<string, unknown>) => ({
    editar: typeof search["editar"] === "string" ? search["editar"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Publicar uma receita — Lipapa" },
      {
        name: "description",
        content:
          "Publique sua receita com medidas precisas, tempo real e rendimento para que a comunidade possa testar.",
      },
      { property: "og:title", content: "Publicar uma receita — Lipapa" },
      { property: "og:description", content: "Medidas claras, tempo real e rendimento confiável." },
    ],
  }),
  component: PublicarPage,
});

type Errors = Partial<Record<"titulo" | "categoria" | "tempo" | "ingredientes" | "passos", string>>;

const ingredientUnits = [
  { value: "g", label: "Grama (g)" },
  { value: "kg", label: "Quilograma (kg)" },
  { value: "mg", label: "Miligrama (mg)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "l", label: "Litro (l)" },
  { value: "xícara", label: "Xícara" },
  { value: "copo", label: "Copo" },
  { value: "colher de sopa", label: "Colher de sopa" },
  { value: "colher de chá", label: "Colher de chá" },
  { value: "colher de café", label: "Colher de café" },
  { value: "unidade", label: "Unidade" },
  { value: "pitada", label: "Pitada" },
  { value: "a gosto", label: "A gosto" },
  { value: "dente", label: "Dente" },
  { value: "folha", label: "Folha" },
  { value: "ramo", label: "Ramo" },
  { value: "fatia", label: "Fatia" },
  { value: "lata", label: "Lata" },
  { value: "pacote", label: "Pacote" },
  { value: "sachê", label: "Sachê" },
];

function parseQuantity(value: string) {
  return Number(value.trim().replace(",", "."));
}

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
  const { editar } = Route.useSearch();
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tempo, setTempo] = useState("");
  const [ingredients, setIngredients] = useState([
    { nome: "", quantidade: "", unidadeMedida: "" },
    { nome: "", quantidade: "", unidadeMedida: "" },
  ]);
  const [steps, setSteps] = useState(["", ""]);
  const [errors, setErrors] = useState<Errors>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [resumo, setResumo] = useState("");
  const [rendimento, setRendimento] = useState("");
  const [draftId, setDraftId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<{ id: number; titulo: string; atualizadoEm: string }[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);

  useEffect(() => {
    if (editar) {
      api<any>(`/api/receitas/${editar}`)
        .then((r) => {
          setTitulo(r.titulo);
          setCategoria(r.categoria.slug);
          setTempo(String(r.tempoPreparo));
          setResumo(r.resumo ?? "");
          setRendimento(r.rendimento ?? "");
          setPhoto(r.fotoPrincipal ?? null);
          setIngredients(
            r.ingredientes.map((i: any) => ({
              nome: i.ingrediente,
              quantidade: i.quantidade == null ? "" : String(i.quantidade),
              unidadeMedida: i.unidadeMedida ?? "",
            })),
          );
          setSteps(r.passos);
        })
        .catch((e) =>
          toast.error(
            e instanceof Error ? e.message : "Não foi possível abrir a receita para edição.",
          ),
        );
      return;
    }
    api<{ id: number; titulo: string; atualizadoEm: string }[]>("/api/rascunhos")
      .then(setDrafts)
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Não foi possível carregar seus rascunhos."),
      );
  }, [editar]);

  const aplicarRascunho = (d: { id: number; conteudo: Record<string, any> }) => {
    const c = d.conteudo;
    setDraftId(d.id);
    setTitulo(c["titulo"] ?? "");
    setCategoria(c["categoria"] ?? "");
    setTempo(c["tempo"] ?? "");
    setResumo(c["resumo"] ?? "");
    setRendimento(c["rendimento"] ?? "");
    setIngredients(
      Array.isArray(c["ingredients"]) && c["ingredients"].length
        ? c["ingredients"]
        : [
            { nome: "", quantidade: "", unidadeMedida: "" },
            { nome: "", quantidade: "", unidadeMedida: "" },
          ],
    );
    setSteps(Array.isArray(c["steps"]) && c["steps"].length ? c["steps"] : [""]);
    setPhoto(c["photo"] ?? null);
  };

  const saveDraft = async () => {
    setSavingDraft(true);
    try {
      const conteudo = { titulo, categoria, tempo, resumo, rendimento, ingredients, steps, photo };
      const salvo = await api<{ id: number; titulo: string; atualizadoEm: string }>(
        draftId ? `/api/rascunhos/${draftId}` : "/api/rascunhos",
        { method: draftId ? "PUT" : "POST", body: JSON.stringify({ conteudo }) },
      );
      setDraftId(salvo.id);
      setDrafts(await api("/api/rascunhos"));
      toast.success("Rascunho salvo na sua conta");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar o rascunho.");
    } finally {
      setSavingDraft(false);
    }
  };

  const loadDraft = async (id: number) => {
    try {
      const d = await api<{ id: number; conteudo: Record<string, any> }>(`/api/rascunhos/${id}`);
      aplicarRascunho(d);
      toast.success("Rascunho carregado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível abrir o rascunho.");
    }
  };

  const deleteDraft = async (id: number) => {
    try {
      await api(`/api/rascunhos/${id}`, { method: "DELETE" });
      setDrafts(await api("/api/rascunhos"));
      if (draftId === id) setDraftId(null);
      toast.success("Rascunho excluído");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir o rascunho.");
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Errors = {};
    if (titulo.trim().length < 3) next.titulo = "Dê um nome para a receita.";
    if (!categoria) next.categoria = "Escolha uma categoria.";
    if (!(Number(tempo) > 0)) next.tempo = "Informe o tempo em minutos.";
    if (ingredients.filter((v) => v.nome.trim()).length < 2)
      next.ingredientes = "Liste pelo menos 2 ingredientes.";
    if (
      ingredients.some(
        (v) => v.nome.trim() && v.quantidade.trim() && !(parseQuantity(v.quantidade) > 0),
      )
    )
      next.ingredientes = "Informe quantidades positivas, usando vírgula ou ponto nos decimais.";
    if (steps.filter((v) => v.trim()).length < 1) next.passos = "Descreva pelo menos 1 passo.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Revise os campos destacados.");
      return;
    }
    try {
      const payload = {
        titulo: titulo.trim(),
        resumo,
        categoria,
        tempoPreparo: Number(tempo),
        rendimento,
        dificuldade: null,
        fotoPrincipal: photo,
        ingredientes: ingredients
          .filter((v) => v.nome.trim())
          .map((i) => ({
            nome: i.nome.trim(),
            quantidade: i.quantidade ? parseQuantity(i.quantidade) : null,
            unidadeMedida: i.unidadeMedida.trim() || null,
            observacao: null,
          })),
        passos: steps.filter((v) => v.trim()),
      };
      await api(editar ? `/api/receitas/${editar}` : "/api/receitas", {
        method: editar ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      if (draftId) {
        try {
          await api(`/api/rascunhos/${draftId}`, { method: "DELETE" });
        } catch {
          toast.error("A receita foi enviada, mas não foi possível remover o rascunho salvo.");
        }
      }
      toast.success(
        editar ? "Receita atualizada e enviada para curadoria" : "Receita enviada para curadoria",
      );
      navigate({ to: "/perfil" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível publicar.");
    }
  };

  const update = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    idx: number,
    value: string,
  ) => setter((prev) => prev.map((v, i) => (i === idx ? value : v)));
  const updateIngredient = (idx: number, patch: Partial<(typeof ingredients)[number]>) =>
    setIngredients((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold text-foreground">
        {editar ? "Editar receita" : "Publicar uma receita"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Quanto mais precisa a informação, maior a chance da sua receita ser verificada.
      </p>

      {!editar && drafts.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-semibold">Meus rascunhos</h2>
          <ul className="mt-2 space-y-2">
            {drafts.map((d) => (
              <li key={d.id} className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left hover:underline"
                  onClick={() => void loadDraft(d.id)}
                >
                  {d.titulo || "Receita sem título"} · atualizado em{" "}
                  {new Date(d.atualizadoEm).toLocaleDateString("pt-BR")}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Excluir rascunho"
                  onClick={() => void deleteDraft(d.id)}
                >
                  <Trash2 width={15} height={15} />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

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
                name="resumo"
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
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
                  name="rendimento"
                  value={rendimento}
                  onChange={(e) => setRendimento(e.target.value)}
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
            onUploaded={setPhoto}
          />
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Ingredientes</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Use gramas e mililitros sempre que possível — é o critério mais avaliado.
          </p>
          <div className="mt-4 space-y-2.5">
            {ingredients.map((v, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px_160px_auto]">
                <Input
                  value={v.nome}
                  onChange={(e) => updateIngredient(i, { nome: e.target.value })}
                  placeholder={`Ingrediente ${i + 1}`}
                  className="rounded-xl bg-background"
                />
                <Input
                  type="text"
                  inputMode="decimal"
                  value={v.quantidade}
                  onChange={(e) => updateIngredient(i, { quantidade: e.target.value })}
                  placeholder="Qtd. (ex.: 1,5)"
                  aria-label={`Quantidade do ingrediente ${i + 1}`}
                  className="rounded-xl bg-background tabular-nums"
                />
                <Select
                  value={v.unidadeMedida}
                  onValueChange={(value) => updateIngredient(i, { unidadeMedida: value })}
                >
                  <SelectTrigger
                    aria-label={`Unidade de medida do ingrediente ${i + 1}`}
                    className="h-9 rounded-xl bg-background"
                  >
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {!ingredientUnits.some((unit) => unit.value === v.unidadeMedida) &&
                      v.unidadeMedida && (
                        <SelectItem value={v.unidadeMedida}>{v.unidadeMedida}</SelectItem>
                      )}
                    {ingredientUnits.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            onClick={() =>
              setIngredients((p) => [...p, { nome: "", quantidade: "", unidadeMedida: "" }])
            }
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
            onClick={() => void saveDraft()}
            disabled={savingDraft}
          >
            {savingDraft ? "Salvando…" : "Salvar rascunho"}
          </Button>
          <Button type="submit" className="rounded-full px-7">
            {editar ? "Salvar alterações" : "Publicar receita"}
          </Button>
        </div>
      </form>
    </div>
  );
}
