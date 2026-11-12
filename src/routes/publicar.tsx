import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, CircleDollarSign, Flame, GripVertical, ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/feedback";
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
import { api, apiUrl } from "@/lib/api";
import {
  createRecipeBlock,
  decodeRecipeSteps,
  encodeRecipeSteps,
  encodeIngredientSection,
  getRecipeIngredientSectionTitle,
  type RecipeEditorBlock,
} from "@/lib/recipe-steps";

export const Route = createFileRoute("/publicar")({
  validateSearch: (search: Record<string, unknown>) => ({
    editar: typeof search["editar"] === "string" ? search["editar"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Publicar uma receita — Mums!" },
      {
        name: "description",
        content:
          "Publique sua receita com medidas precisas, tempo real e rendimento para que a comunidade possa testar.",
      },
      { property: "og:title", content: "Publicar uma receita — Mums!" },
      { property: "og:description", content: "Medidas claras, tempo real e rendimento confiável." },
    ],
  }),
  component: PublicarPage,
});

type Errors = Partial<
  Record<
    | "titulo"
    | "resumo"
    | "categoria"
    | "tempo"
    | "ingredientes"
    | "passos",
    string
  >
>;

type IngredientEditorBlock =
  | { id: string; type: "section"; text: string }
  | { id: string; type: "ingredient"; nome: string; quantidade: string; unidadeMedida: string };

function newIngredientBlock(): IngredientEditorBlock {
  return { id: createRecipeBlock("step").id, type: "ingredient", nome: "", quantidade: "", unidadeMedida: "" };
}

function newIngredientSection(): IngredientEditorBlock {
  return { id: createRecipeBlock("section").id, type: "section", text: "" };
}

function ingredientBlocksFromApi(items: any[]): IngredientEditorBlock[] {
  const blocks: IngredientEditorBlock[] = [];
  let previousSection: string | null = null;
  for (const item of items) {
    const sectionTitle = getRecipeIngredientSectionTitle(item.observacao);
    if (sectionTitle && sectionTitle !== previousSection)
      blocks.push({ ...newIngredientSection(), text: sectionTitle });
    previousSection = sectionTitle;
    blocks.push({
      ...newIngredientBlock(),
      nome: item.ingrediente ?? item.nome ?? "",
      quantidade: item.quantidade == null ? "" : String(item.quantidade),
      unidadeMedida: item.unidadeMedida ?? "",
    });
  }
  return blocks.length ? blocks : [newIngredientBlock(), newIngredientBlock()];
}

function serializeIngredientBlocks(blocks: IngredientEditorBlock[]) {
  const serialized: {
    nome: string;
    quantidade: number | null;
    unidadeMedida: string | null;
    observacao: string | null;
  }[] = [];
  let sectionTitle = "";
  for (const block of blocks) {
    if (block.type === "section") {
      sectionTitle = block.text.trim();
      continue;
    }
    if (!block.nome.trim()) continue;
    serialized.push({
      nome: block.nome.trim(),
      quantidade:
        isTasteUnit(block.unidadeMedida) || !block.quantidade
          ? null
          : Math.round(parseQuantity(block.quantidade) * 1000) / 1000,
      unidadeMedida: block.unidadeMedida.trim() || null,
      observacao: sectionTitle ? encodeIngredientSection(sectionTitle) : null,
    });
  }
  return serialized;
}

function sectionHasStep(blocks: RecipeEditorBlock[], sectionIndex: number) {
  const following = blocks.slice(sectionIndex + 1);
  const nextSection = following.findIndex((block) => block.type === "section");
  return following
    .slice(0, nextSection < 0 ? following.length : nextSection)
    .some((block) => block.type === "step" && block.text.trim());
}

const difficultyOptions = [
  { value: "FACIL", label: "Fácil" },
  { value: "MEDIO", label: "Médio" },
  { value: "DIFICIL", label: "Difícil" },
  { value: "CHEF", label: "Chef" },
];

const costOptions = [
  { value: "BAIXO", label: "Baixo" },
  { value: "MEDIO", label: "Médio" },
  { value: "ALTO", label: "Alto" },
  { value: "MUITO_ALTO", label: "Muito alto" },
];

const ingredientUnits = [
  { value: "g", label: "Grama (g)" },
  { value: "kg", label: "Quilograma (kg)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "L", label: "Litro (L)" },
  { value: "xícara", label: "Xícara" },
  { value: "colher de sopa", label: "Colher de sopa" },
  { value: "colher de chá", label: "Colher de chá" },
  { value: "unidade", label: "Unidade" },
  { value: "fatia", label: "Fatia" },
  { value: "dente", label: "Dente" },
  { value: "lata", label: "Lata" },
  { value: "caixa", label: "Caixa" },
  { value: "sachê", label: "Sachê" },
  { value: "pacote", label: "Pacote" },
  { value: "a gosto", label: "A gosto" },
];

function parseQuantity(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (normalized.includes("/")) {
    const [numerator, denominator] = normalized.split("/").map(Number);
    return denominator ? numerator / denominator : Number.NaN;
  }
  return Number(normalized);
}

function isValidQuantityInput(value: string) {
  return value === "" || /^(?:\d+(?:[.,]\d*|\/\d*)?|[.,]\d+)$/.test(value);
}

function isTasteUnit(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR") === "a gosto";
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
  const [dificuldade, setDificuldade] = useState("");
  const [hoverDifficultyIndex, setHoverDifficultyIndex] = useState<number | null>(null);
  const [faixaCusto, setFaixaCusto] = useState("");
  const [hoverCostIndex, setHoverCostIndex] = useState<number | null>(null);
  const [ingredients, setIngredients] = useState<IngredientEditorBlock[]>([
    newIngredientBlock(),
    newIngredientBlock(),
  ]);
  const [openUnitSuggestions, setOpenUnitSuggestions] = useState<string | null>(null);
  const [steps, setSteps] = useState(() => [createRecipeBlock("step"), createRecipeBlock("step")]);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [lockedStepsHeight, setLockedStepsHeight] = useState<number | null>(null);
  const stepListRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef(steps);
  const previousStepPositions = useRef<{ tops: Map<string, number>; time: number } | null>(null);
  const dragAnchor = useRef<{ pointerY: number; offset: number } | null>(null);
  stepsRef.current = steps;
  const [errors, setErrors] = useState<Errors>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [resumo, setResumo] = useState("");
  const [rendimento, setRendimento] = useState("");
  const [draftId, setDraftId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<{ id: number; titulo: string; atualizadoEm: string }[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);

  useLayoutEffect(() => {
    stepListRef.current?.querySelectorAll<HTMLTextAreaElement>("textarea[data-step-text]").forEach((textarea) => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
    const previous = previousStepPositions.current;
    previousStepPositions.current = null;
    if (!previous || performance.now() - previous.time > 300) return;
    stepListRef.current?.querySelectorAll<HTMLElement>("[data-step-block]").forEach((element) => {
      const oldTop = previous.tops.get(element.dataset.stepBlock ?? "");
      if (oldTop === undefined) return;
      const delta = oldTop - element.getBoundingClientRect().top;
      if (Math.abs(delta) < 1) return;
      element.getAnimations().forEach((animation) => animation.cancel());
      element.animate(
        [{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }],
        { duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      );
    });
  }, [steps]);

  useLayoutEffect(() => {
    const anchor = dragAnchor.current;
    if (!draggingBlockId || !anchor) return;
    const dragged = stepListRef.current?.querySelector<HTMLElement>(
      `[data-step-block="${draggingBlockId}"]`,
    );
    if (!dragged) return;
    const delta = dragged.getBoundingClientRect().top + anchor.offset - anchor.pointerY;
    if (Math.abs(delta) > 1) window.scrollBy(0, delta);
  }, [draggingBlockId]);

  useEffect(() => {
    if (!draggingBlockId) return;
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    const handlePointerMove = (event: PointerEvent) => {
      const list = stepListRef.current;
      const anchor = dragAnchor.current;
      if (!list || !anchor) return;
      if (event.clientY < 80) window.scrollBy(0, -18);
      else if (event.clientY > window.innerHeight - 80) window.scrollBy(0, 18);

      const current = stepsRef.current;
      const from = current.findIndex((block) => block.id === draggingBlockId);
      const elements = Array.from(list.querySelectorAll<HTMLElement>("[data-step-block]"));
      const before = elements.findIndex((element) => {
        const rect = element.getBoundingClientRect();
        return event.clientY < rect.top + rect.height / 2;
      });
      const target = before === -1 ? current.length - 1 : before > from ? before - 1 : before;
      if (from < 0 || target === from) return;

      const previous = new Map<string, number>();
      elements.forEach((element) => {
        if (element.dataset.stepBlock)
          previous.set(element.dataset.stepBlock, element.getBoundingClientRect().top);
      });
      previousStepPositions.current = { tops: previous, time: performance.now() };
      setSteps((items) => {
        const currentFrom = items.findIndex((block) => block.id === draggingBlockId);
        if (currentFrom < 0 || target < 0 || target >= items.length || currentFrom === target) return items;
        const reordered = [...items];
        const [moved] = reordered.splice(currentFrom, 1);
        reordered.splice(target, 0, moved);
        return reordered;
      });
    };

    const handlePointerUp = () => {
      setDraggingBlockId(null);
      setLockedStepsHeight(null);
      dragAnchor.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      document.body.style.userSelect = originalUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [draggingBlockId]);

  useEffect(() => {
    if (editar) {
      api<any>(`/api/receitas/${editar}`)
        .then((r) => {
          setTitulo(r.titulo);
          setCategoria(r.categoria.slug);
          setTempo(String(r.tempoPreparo));
          setDificuldade(r.dificuldade === "AVANCADO" ? "DIFICIL" : r.dificuldade ?? "");
          setFaixaCusto(r.faixaCusto ?? "");
          setResumo(r.resumo ?? "");
          setRendimento(r.rendimento ?? "");
          setPhoto(r.fotoPrincipal ?? null);
          setIngredients(ingredientBlocksFromApi(r.ingredientes));
          setSteps(decodeRecipeSteps(r.passos));
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
    setDificuldade(c["dificuldade"] === "AVANCADO" ? "DIFICIL" : c["dificuldade"] ?? "");
    setFaixaCusto(c["faixaCusto"] ?? "");
    setResumo(c["resumo"] ?? "");
    setRendimento(c["rendimento"] ?? "");
    const draftIngredients = Array.isArray(c["ingredients"]) ? c["ingredients"] : [];
    setIngredients(
      draftIngredients.length
        ? draftIngredients.map((item: any) =>
            item.type === "section"
              ? { id: item.id ?? newIngredientSection().id, type: "section" as const, text: item.text ?? "" }
              : {
                  id: item.id ?? newIngredientBlock().id,
                  type: "ingredient" as const,
                  nome: item.nome ?? "",
                  quantidade: item.quantidade ?? "",
                  unidadeMedida:
                    item.unidadeMedida === "__outra_unidade__"
                      ? item.unidadePersonalizada ?? ""
                      : item.unidadeMedida ?? "",
                },
          )
        : [newIngredientBlock(), newIngredientBlock()],
    );
    const draftSteps = decodeRecipeSteps(Array.isArray(c["steps"]) ? c["steps"] : []);
    setSteps(draftSteps.length ? draftSteps : [createRecipeBlock("step")]);
    setPhoto(c["photo"] ?? null);
  };

  const saveDraft = async () => {
    setSavingDraft(true);
    try {
      const conteudo = {
        titulo,
        categoria,
        tempo,
        dificuldade,
        faixaCusto,
        resumo,
        rendimento,
        ingredients,
        steps: encodeRecipeSteps(steps),
        photo,
      };
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
    if (!resumo.trim()) next.resumo = "Informe a descrição da receita.";
    if (!categoria) next.categoria = "Escolha uma categoria.";
    if (!(Number(tempo) > 0)) next.tempo = "Informe o tempo em minutos.";
    if (ingredients.filter((block) => block.type === "ingredient" && block.nome.trim()).length < 2)
      next.ingredientes = "Liste pelo menos 2 ingredientes.";
    if (
      ingredients.some(
        (block) =>
          block.type === "ingredient" &&
          block.nome.trim() &&
          !isTasteUnit(block.unidadeMedida) &&
          block.quantidade.trim() &&
          !(Math.round(parseQuantity(block.quantidade) * 1000) / 1000 > 0),
      )
    )
      next.ingredientes = "Informe quantidades positivas, usando vírgula ou ponto nos decimais.";
    if (ingredients.some((block) => block.type === "section" && !block.text.trim()))
      next.ingredientes = "Dê um título para cada seção de ingredientes.";
    if (ingredients.some((block, index) => {
      if (block.type !== "section") return false;
      const following = ingredients.slice(index + 1);
      const nextSection = following.findIndex((entry) => entry.type === "section");
      const ownIngredients = following.slice(0, nextSection < 0 ? following.length : nextSection);
      return !ownIngredients.some((entry) => entry.type === "ingredient" && entry.nome.trim());
    }))
      next.ingredientes = "Adicione pelo menos um ingrediente em cada seção.";
    if (steps.some((block) => block.type === "section" && !block.text.trim()))
      next.passos = "Dê um título para cada seção.";
    else if (steps.some((block, index) => block.type === "section" && !sectionHasStep(steps, index)))
      next.passos = "Cada seção precisa ter ao menos um passo preenchido.";
    if (!next.passos && steps.filter((block) => block.type === "step" && block.text.trim()).length < 1)
      next.passos = "Descreva pelo menos 1 passo.";
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
        dificuldade: dificuldade || null,
        faixaCusto: faixaCusto || null,
        fotoPrincipal: photo,
        ingredientes: serializeIngredientBlocks(ingredients),
        passos: encodeRecipeSteps(steps).filter((step) => step.trim()),
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
        editar ? "Receita atualizada e publicada" : "Receita publicada",
      );
      navigate({ to: "/perfil" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível publicar.");
    }
  };

  const updateIngredient = (id: string, patch: Partial<Extract<IngredientEditorBlock, { type: "ingredient" }>>) =>
    setIngredients((prev) => prev.map((item) =>
      item.id === id && item.type === "ingredient" ? { ...item, ...patch } : item,
    ));
  const canAddPreparationSection = steps.every(
    (block, index) => block.type !== "section" || (block.text.trim() && sectionHasStep(steps, index)),
  );

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
              <Label htmlFor="titulo">Título da receita *</Label>
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
              <Label htmlFor="resumo">Descrição *</Label>
              <Textarea
                id="resumo"
                name="resumo"
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                aria-invalid={Boolean(errors.resumo)}
                rows={3}
                placeholder="Faça uma breve descrição sobre a receita."
                className="mt-2 rounded-xl bg-background"
              />
              <FieldError>{errors.resumo}</FieldError>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Categoria *</Label>
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
                <Label htmlFor="tempo">Tempo (min) *</Label>
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
              <fieldset>
                <legend className="text-sm font-medium leading-none">
                  Dificuldade
                </legend>
                <div
                  role="radiogroup"
                  aria-label="Dificuldade"
                  onMouseLeave={() => setHoverDifficultyIndex(null)}
                  className="mt-3 flex gap-2.5"
                >
                  {difficultyOptions.map((option, index) => {
                    const selectedIndex = difficultyOptions.findIndex((item) => item.value === dificuldade);
                    const highlightedIndex = hoverDifficultyIndex ?? selectedIndex;
                    const active = highlightedIndex >= index;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={dificuldade === option.value}
                        aria-label={option.label}
                        title={option.label}
                        onMouseEnter={() => setHoverDifficultyIndex(index)}
                        onFocus={() => setHoverDifficultyIndex(index)}
                        onClick={() => {
                          setDificuldade(option.value);
                          setHoverDifficultyIndex(null);
                        }}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-150 ease-out hover:scale-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          active
                            ? "border-caramel bg-warm text-caramel shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-caramel/50"
                        }`}
                      >
                        <Flame
                          width={17}
                          height={17}
                          className={`transition-all duration-150 ${active ? "fill-caramel/25" : ""}`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {difficultyOptions.find((option) => option.value === dificuldade)?.label ?? "Opcional"}
                </p>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium leading-none">Custo <span className="text-muted-foreground">(opcional)</span></legend>
                <div
                  role="radiogroup"
                  aria-label="Custo estimado"
                  onMouseLeave={() => setHoverCostIndex(null)}
                  className="mt-3 flex gap-2.5"
                >
                  {costOptions.map((option, index) => {
                    const selectedIndex = costOptions.findIndex((item) => item.value === faixaCusto);
                    const highlightedIndex = hoverCostIndex ?? selectedIndex;
                    const active = highlightedIndex >= index;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={faixaCusto === option.value}
                        aria-label={option.label}
                        title={option.label}
                        onMouseEnter={() => setHoverCostIndex(index)}
                        onFocus={() => setHoverCostIndex(index)}
                        onClick={() => {
                          setFaixaCusto(option.value);
                          setHoverCostIndex(null);
                        }}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-[11px] font-semibold transition-all duration-150 ease-out hover:scale-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          active
                            ? "border-caramel bg-warm text-caramel shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-caramel/50"
                        }`}
                      >
                        <CircleDollarSign width={17} height={17} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {costOptions.find((option) => option.value === faixaCusto)?.label ?? "Escolha uma opção"}
                </p>
              </fieldset>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Fotos da receita</h2>
          <PhotoPicker
            className="mt-4"
            icon={<ImagePlus width={22} height={22} className="text-caramel" />}
            title="Arraste uma foto ou selecione"
            hint="Esta será a foto principal. PNG, JPG ou WEBP até 5 MB."
            currentImage={photo ? apiUrl(photo) : null}
            onUploaded={setPhoto}
          />
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Ingredientes</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Use gramas e mililitros sempre que possível — é o critério mais avaliado.
          </p>
          <div className="mt-4 space-y-2.5">
            {ingredients.map((block, i) => {
              if (block.type === "section") {
                return (
                  <div key={block.id} className="flex items-center gap-2 rounded-2xl border border-caramel/20 bg-warm/60 p-2">
                    <span className="shrink-0 px-2 text-xs font-semibold uppercase tracking-wide text-caramel">
                      Ingredientes para
                    </span>
                    <Input
                      value={block.text}
                      onChange={(event) => setIngredients((current) => current.map((entry) =>
                        entry.id === block.id && entry.type === "section"
                          ? { ...entry, text: event.target.value }
                          : entry,
                      ))}
                      maxLength={100}
                      placeholder="Ex.: Cobertura"
                      aria-label="Título da seção de ingredientes"
                      className="rounded-xl border-transparent bg-card"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 rounded-xl"
                      aria-label="Remover seção de ingredientes"
                      onClick={() => setIngredients((current) => current.filter((entry) => entry.id !== block.id))}
                    >
                      <Trash2 width={16} height={16} />
                    </Button>
                  </div>
                );
              }

              const ingredientNumber = ingredients.slice(0, i + 1).filter((entry) => entry.type === "ingredient").length;
              const selectedUnit = ingredientUnits.find((unit) => unit.value === block.unidadeMedida);
              const unitQuery = selectedUnit ? "" : block.unidadeMedida.trim().toLocaleLowerCase("pt-BR");
              const unitSuggestions = ingredientUnits.filter(
                (unit) => !unitQuery || `${unit.value} ${unit.label}`.toLocaleLowerCase("pt-BR").includes(unitQuery),
              );
              return (
                <div key={block.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px_160px_auto]">
                  <Input
                    value={block.nome}
                    onChange={(event) => updateIngredient(block.id, { nome: event.target.value })}
                    placeholder={`Ingrediente ${ingredientNumber}`}
                    className="rounded-xl bg-background"
                  />
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={block.quantidade}
                    onChange={(event) => {
                      if (isValidQuantityInput(event.target.value))
                        updateIngredient(block.id, { quantidade: event.target.value });
                    }}
                    disabled={isTasteUnit(block.unidadeMedida)}
                    placeholder={isTasteUnit(block.unidadeMedida) ? "Sem quantidade" : "Qtd. (ex.: 1/2)"}
                    aria-label={`Quantidade do ingrediente ${ingredientNumber}`}
                    className="rounded-xl bg-background tabular-nums"
                  />
                  <div className="relative">
                    <Input
                      role="combobox"
                      aria-expanded={openUnitSuggestions === block.id}
                      aria-controls={`unidades-medida-${block.id}`}
                      autoComplete="off"
                      value={selectedUnit?.label ?? block.unidadeMedida}
                      onFocus={(event) => {
                        event.currentTarget.select();
                        setOpenUnitSuggestions(block.id);
                      }}
                      onBlur={() => setOpenUnitSuggestions(null)}
                      onChange={(event) => {
                        const typedValue = event.target.value;
                        const unit = ingredientUnits.find(
                          (option) => option.label.toLocaleLowerCase("pt-BR") === typedValue.toLocaleLowerCase("pt-BR"),
                        )?.value ?? typedValue;
                        updateIngredient(block.id, {
                          unidadeMedida: unit,
                          quantidade: isTasteUnit(unit) ? "" : block.quantidade,
                        });
                        setOpenUnitSuggestions(block.id);
                      }}
                      placeholder="Unidade"
                      aria-label={`Unidade de medida do ingrediente ${ingredientNumber}`}
                      maxLength={50}
                      className="rounded-xl bg-background pr-9"
                    />
                    <button
                      type="button"
                      aria-label="Mostrar unidades disponíveis"
                      aria-expanded={openUnitSuggestions === block.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setOpenUnitSuggestions(openUnitSuggestions === block.id ? null : block.id)}
                      className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ChevronDown width={16} height={16} className={`transition-transform duration-150 ${openUnitSuggestions === block.id ? "rotate-180" : ""}`} />
                    </button>
                    {openUnitSuggestions === block.id && unitSuggestions.length > 0 && (
                      <div
                        id={`unidades-medida-${block.id}`}
                        role="listbox"
                        className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
                      >
                        {unitSuggestions.map((unit) => (
                          <button
                            key={unit.value}
                            type="button"
                            role="option"
                            aria-selected={block.unidadeMedida === unit.value}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              updateIngredient(block.id, {
                                unidadeMedida: unit.value,
                                quantidade: isTasteUnit(unit.value) ? "" : block.quantidade,
                              });
                              setOpenUnitSuggestions(null);
                            }}
                            className="flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-warm focus:bg-warm focus:outline-none"
                          >
                            {unit.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-xl"
                    aria-label={`Remover ingrediente ${ingredientNumber}`}
                    disabled={ingredients.filter((entry) => entry.type === "ingredient").length <= 1}
                    onClick={() => setIngredients((current) => current.filter((entry) => entry.id !== block.id))}
                  >
                    <Trash2 width={16} height={16} />
                  </Button>
                </div>
              );
            })}
          </div>
          <FieldError>{errors.ingredientes}</FieldError>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setIngredients((current) => [...current, newIngredientBlock()])}
            >
              <Plus width={14} height={14} /> Adicionar ingrediente
            </Button>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Modo de preparo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Arraste pelo ícone para reorganizar os passos ou separe o preparo em seções.
          </p>
          <div
            ref={stepListRef}
            style={lockedStepsHeight ? { minHeight: lockedStepsHeight } : undefined}
            className="mt-4 space-y-2.5"
          >
            {steps.map((block, i) => {
              const stepNumber = steps.slice(0, i + 1).filter((entry) => entry.type === "step").length;
              return (
                <div
                  key={block.id}
                  data-step-block={block.id}
                  className={`relative flex items-center gap-2 rounded-2xl transition-[box-shadow,opacity] duration-150 ${
                    draggingBlockId === block.id
                      ? "z-10 opacity-95"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      if (event.button !== 0) return;
                      event.preventDefault();
                      const row = event.currentTarget.closest<HTMLElement>("[data-step-block]");
                      dragAnchor.current = {
                        pointerY: event.clientY,
                        offset: row ? event.clientY - row.getBoundingClientRect().top : 0,
                      };
                      setLockedStepsHeight(stepListRef.current?.offsetHeight ?? null);
                      setDraggingBlockId(block.id);
                    }}
                    onKeyDown={(event) => {
                      const offset = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
                      if (!offset) return;
                      event.preventDefault();
                      setSteps((current) => {
                        const from = current.findIndex((entry) => entry.id === block.id);
                        const to = from + offset;
                        if (from < 0 || to < 0 || to >= current.length) return current;
                        const reordered = [...current];
                        const [moved] = reordered.splice(from, 1);
                        reordered.splice(to, 0, moved);
                        return reordered;
                      });
                    }}
                    aria-label={block.type === "section" ? "Arraste ou use as setas para mover a seção" : `Arraste ou use as setas para mover o passo ${stepNumber}`}
                    title="Arraste para reorganizar"
                    className={`flex h-9 w-8 shrink-0 touch-none cursor-grab items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-warm hover:text-foreground active:cursor-grabbing ${
                      draggingBlockId === block.id ? "bg-warm text-caramel" : ""
                    }`}
                  >
                    <GripVertical width={17} height={17} />
                  </button>
                  {block.type === "section" ? (
                    <>
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Input
                          value={block.text}
                          onChange={(event) =>
                            setSteps((current) => current.map((entry) =>
                              entry.id === block.id ? { ...entry, text: event.target.value } : entry,
                            ))
                          }
                          maxLength={100}
                          placeholder="Nome da seção"
                          aria-label="Título da seção"
                          style={{
                            width: `${Math.max(112, Math.min(320, (block.text || "Nome da seção").length * 8))}px`,
                          }}
                          className="relative z-10 h-8 min-w-0 shrink-0 rounded-none border-0 bg-transparent px-0 text-left text-sm font-semibold text-foreground shadow-none outline-none placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0"
                        />
                        <div className="h-px min-w-3 flex-1 bg-border" />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 rounded-xl"
                        aria-label="Remover seção"
                        onClick={() => setSteps((current) => current.filter((entry) => entry.id !== block.id))}
                      >
                        <Trash2 width={16} height={16} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="w-6 shrink-0 text-sm font-semibold text-muted-foreground">
                        {stepNumber}.
                      </span>
                      <Textarea
                        data-step-text="true"
                        value={block.text}
                        onChange={(event) =>
                          setSteps((current) => current.map((entry) =>
                            entry.id === block.id ? { ...entry, text: event.target.value } : entry,
                          ))
                        }
                        rows={1}
                        placeholder="Descreva o passo com tempo e sinais visuais"
                        className="resize-none overflow-hidden rounded-xl bg-background"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 rounded-xl"
                        aria-label={`Remover passo ${stepNumber}`}
                        disabled={steps.filter((entry) => entry.type === "step").length === 1}
                        onClick={() => setSteps((current) => current.filter((entry) => entry.id !== block.id))}
                      >
                        <Trash2 width={16} height={16} />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <FieldError>{errors.passos}</FieldError>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setSteps((current) => [...current, createRecipeBlock("step")])}
            >
              <Plus width={14} height={14} /> Adicionar passo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={!canAddPreparationSection}
              onClick={() => setSteps((current) => [
                ...current,
                createRecipeBlock("section"),
                createRecipeBlock("step"),
              ])}
            >
              <Plus width={14} height={14} /> Adicionar seção
            </Button>
          </div>
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
