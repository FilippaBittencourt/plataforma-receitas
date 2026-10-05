import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import recipeImage from "@/assets/recipe-1.jpg";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — Cookie" },
      {
        name: "description",
        content: "Crie sua conta gratuita e comece a avaliar receitas por critérios objetivos.",
      },
      { property: "og:title", content: "Criar conta — Cookie" },
      { property: "og:description", content: "Junte-se à comunidade que testa receitas de verdade." },
    ],
  }),
  component: CadastroPage,
});

function CadastroPage() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16">
        <Logo />
        <div className="mt-10 max-w-sm">
          <h1 className="text-3xl font-semibold text-foreground">Criar conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Leva menos de um minuto e é gratuito.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Conta criada (protótipo)");
              navigate({ to: "/perfil" });
            }}
          >
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" placeholder="Seu nome" className="mt-2 h-11 rounded-xl bg-card" />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@email.com"
                className="mt-2 h-11 rounded-xl bg-card"
              />
            </div>
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Mínimo de 8 caracteres"
                className="mt-2 h-11 rounded-xl bg-card"
              />
            </div>
            <div className="flex items-start gap-2.5 pt-1">
              <Checkbox id="termos" className="mt-0.5" />
              <Label htmlFor="termos" className="text-xs font-normal leading-relaxed text-muted-foreground">
                Concordo com os termos de uso e com a política de avaliações honestas da comunidade.
              </Label>
            </div>
            <Button type="submit" className="h-11 w-full rounded-full">
              Criar conta
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/entrar" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <img
          src={recipeImage}
          alt="Cookies em prato de cerâmica"
          width={1024}
          height={768}
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-10 left-10 right-10 space-y-3 rounded-3xl bg-card/92 p-6 backdrop-blur">
          {[
            "Avalie por medidas, tempo, rendimento e resultado",
            "Envie fotos do prato real",
            "Acompanhe a taxa de sucesso de cada receita",
          ].map((t) => (
            <p key={t} className="flex items-center gap-2 text-sm text-foreground">
              <Check width={16} height={16} className="text-verified" /> {t}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
