import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Link2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
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

export const Route = createFileRoute("/compartilhar")({
  head: () => ({
    meta: [
      { title: "Indicar receita externa por link — Cookie" },
      {
        name: "description",
        content:
          "Compartilhe o link de uma receita de fora da plataforma e deixe a comunidade testar e avaliar.",
      },
      { property: "og:title", content: "Indicar receita externa por link — Cookie" },
      {
        property: "og:description",
        content: "Traga receitas de blogs e vídeos para serem testadas pela comunidade.",
      },
    ],
  }),
  component: CompartilharPage,
});

function CompartilharPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const previewReady = url.trim().length > 8;

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-semibold text-foreground">Indicar receita externa</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Encontrou uma receita boa em um blog ou vídeo? Traga o link e deixe a comunidade testar e
          avaliar por critérios.
        </p>

        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Link enviado para curadoria", {
              description: "Protótipo: nenhum dado é salvo.",
            });
            navigate({ to: "/ranking" });
          }}
        >
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
                placeholder="https://blogdacozinha.com/pao-de-queijo"
                className="rounded-xl bg-background pl-10"
              />
            </div>

            {previewReady && (
              <div className="mt-5 flex items-center gap-4 rounded-2xl bg-cream p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card">
                  <Sparkles width={18} height={18} className="text-caramel" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    Pré-visualização do link
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{url}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Título, foto e tempo serão extraídos automaticamente.
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
                  placeholder="Pão de queijo mineiro"
                  className="mt-2 rounded-xl bg-background"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select>
                  <SelectTrigger className="mt-2 rounded-xl bg-background">
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
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="motivo">Por que vale a pena testar?</Label>
              <Textarea
                id="motivo"
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
    </Shell>
  );
}
