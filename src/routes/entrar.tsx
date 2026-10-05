import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import heroImage from "@/assets/hero-food.jpg";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — Cookie" },
      {
        name: "description",
        content: "Acesse sua conta para avaliar receitas, salvar favoritas e enviar fotos.",
      },
      { property: "og:title", content: "Entrar — Cookie" },
      { property: "og:description", content: "Acesse sua conta na plataforma de receitas testadas." },
    ],
  }),
  component: EntrarPage,
});

function EntrarPage() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16">
        <Logo />
        <div className="mt-12 max-w-sm">
          <h1 className="text-3xl font-semibold text-foreground">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre para avaliar receitas e acompanhar o que realmente funciona.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Login simulado");
              navigate({ to: "/perfil" });
            }}
          >
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
                placeholder="••••••••"
                className="mt-2 h-11 rounded-xl bg-card"
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-full">
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link to="/cadastro" className="font-semibold text-primary hover:underline">
              Criar conta
            </Link>
          </p>
          <Link
            to="/"
            className="mt-2 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            Voltar para a home
          </Link>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <img
          src={heroImage}
          alt="Mesa com bolo caseiro"
          width={1408}
          height={1008}
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-10 left-10 right-10 rounded-3xl bg-card/92 p-6 backdrop-blur">
          <p className="font-display text-lg text-foreground">
            “Em meio a milhares de receitas, mostramos quais realmente funcionam.”
          </p>
        </div>
      </div>
    </div>
  );
}
