import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Link2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { FieldError } from "@/components/site/PasswordInput";
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

export const Route = createFileRoute("/compartilhar")({
  head: () => ({
    meta: [
      { title: "Indicar receita externa por link — Lipapa" },
      {
        name: "description",
        content:
          "Compartilhe o link de uma receita de fora da plataforma e deixe a comunidade testar e avaliar.",
      },
      { property: "og:title", content: "Indicar receita externa por link — Lipapa" },
      {
        property: "og:description",
        content: "Traga receitas de blogs e vídeos para serem testadas pela comunidade.",
      },
    ],
  }),
  component: CompartilharPage,
});

function parseUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function CompartilharPage() {
  return (
    <Shell>
      <RequireAuth>
        <CompartilharForm />
      </RequireAuth>
    </Shell>
  );
}

function CompartilharForm() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [errors, setErrors] = useState<{ url?: string; nome?: string; categoria?: string }>({});
  const parsed = parseUrl(url);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!parsed) next.url = "Cole um link completo, começando com https://";
    if (nome.trim().length < 3) next.nome = "Informe o nome da receita.";
    if (!categoria) next.categoria = "Escolha uma categoria.";
    setErrors(next);
    if (next.url || next.nome || next.categoria) return;
    const data = new FormData(e.currentTarget);
    try {
      await api("/api/receitas/indicacoes", {
        method: "POST",
        body: JSON.stringify({
          urlFonte: parsed!.toString(),
          titulo: nome.trim(),
          categoria,
          motivo: data.get("motivo"),
        }),
      });
      toast.success("Link enviado para curadoria");
      navigate({ to: "/perfil" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o link.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold text-foreground">Indicar receita externa</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Encontrou uma receita boa em um blog ou vídeo? Traga o link e deixe a comunidade testar e
        avaliar por critérios.
      </p>

      <form className="mt-8 space-y-6" noValidate onSubmit={submit}>
        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <Label htmlFor="url">Link da receita</Label>
          <div className="relative mt-2">
            <Link2
              width={16}
              height={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              inputMode="url"
              aria-invalid={Boolean(errors.url)}
              placeholder="https://blogdacozinha.com/pao-de-queijo"
              className="rounded-xl bg-background pl-10"
            />
          </div>
          <FieldError>{errors.url}</FieldError>

          {parsed && (
            <div className="mt-5 flex items-center gap-4 rounded-2xl bg-cream p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card">
                <Sparkles width={18} height={18} className="text-caramel" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {parsed.hostname.replace(/^www\./, "")}
                </p>
                <p className="truncate text-xs text-muted-foreground">{url}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  O link e o nome informado serão enviados para curadoria. Os dados do site externo
                  não são importados automaticamente.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="nome">Nome da receita</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                aria-invalid={Boolean(errors.nome)}
                placeholder="Pão de queijo mineiro"
                className="mt-2 rounded-xl bg-background"
              />
              <FieldError>{errors.nome}</FieldError>
            </div>
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
          </div>
          <div className="mt-4">
            <Label htmlFor="motivo">Por que vale a pena testar?</Label>
            <Textarea
              id="motivo"
              name="motivo"
              rows={4}
              placeholder="Ex.: fiz duas vezes e as medidas bateram perfeitamente."
              className="mt-2 rounded-xl bg-background"
            />
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-3xl border border-border bg-cream p-5">
          <ShieldCheck width={18} height={18} className="mt-0.5 shrink-0 text-verified" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Links indicados passam por curadoria e sempre creditam a fonte original. A receita só
            recebe o selo de verificada após avaliações suficientes da comunidade.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="rounded-full px-7">
            Enviar link
          </Button>
        </div>
      </form>
    </div>
  );
}
