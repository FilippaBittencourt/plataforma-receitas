import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Quote } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { FieldError, PasswordInput } from "@/components/site/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeRedirect, useAuth } from "@/lib/auth";
import { demoAccounts } from "@/lib/mock-data";
import heroImage from "@/assets/login-ingredients.jpg";

type EntrarSearch = { redirect?: string; adicionar?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Route = createFileRoute("/entrar")({
  validateSearch: (search: Record<string, unknown>): EntrarSearch => {
    const redirect = safeRedirect(search["redirect"]);
    return {
      ...(redirect ? { redirect } : {}),
      ...(search["adicionar"] === true || search["adicionar"] === "true"
        ? { adicionar: true }
        : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Entrar — Mums!" },
      {
        name: "description",
        content: "Acesse sua conta para avaliar receitas, salvar favoritas e enviar fotos.",
      },
      { property: "og:title", content: "Entrar — Mums!" },
      {
        property: "og:description",
        content: "Acesse sua conta na plataforma de receitas testadas.",
      },
    ],
  }),
  component: EntrarPage,
});

function EntrarPage() {
  const navigate = useNavigate();
  const { redirect, adicionar } = Route.useSearch();
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errors, setErrors] = useState<{ email?: string; senha?: string; form?: string }>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Informe um e-mail válido.";
    if (!senha) next.senha = "Informe sua senha.";
    setErrors(next);
    if (next.email || next.senha) return;

    const result = await login(email, senha);
    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    if (redirect) navigate({ href: redirect, replace: true });
    else navigate({ to: "/perfil", replace: true });
  };

  return (
    <div className="grid min-h-[100dvh] lg:h-dvh lg:min-h-0 lg:grid-cols-2 lg:overflow-hidden">
      <div className="flex flex-col justify-center px-6 py-8 sm:px-16 lg:min-h-0 lg:px-12 lg:py-5 xl:px-16">
        <Logo />
        <div className="mt-8 max-w-sm lg:mt-6">
          <h1 className="text-3xl font-semibold text-foreground">
            {adicionar ? "Adicionar outra conta" : "Bem-vindo de volta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {redirect
              ? "Entre na sua conta para continuar."
              : "Entre para avaliar receitas e acompanhar o que realmente funciona."}
          </p>

          {user && !adicionar && (
            <div className="mt-6 rounded-2xl bg-cream p-4 text-sm text-muted-foreground">
              Você já está conectado como{" "}
              <span className="font-semibold text-foreground">{user.name}</span>.{" "}
              <Link to="/perfil" className="font-semibold text-primary hover:underline">
                Ir para o perfil
              </Link>
            </div>
          )}

          <form className="mt-6 space-y-3 lg:mt-5" noValidate onSubmit={submit}>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                placeholder="voce@email.com"
                className="mt-2 h-10 rounded-xl bg-card"
              />
              <FieldError>{errors.email}</FieldError>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="senha">Senha</Label>
                <Link
                  to="/recuperar-senha"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <PasswordInput
                id="senha"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                aria-invalid={Boolean(errors.senha)}
                placeholder="••••••••"
                className="mt-2 h-10 rounded-xl bg-card"
              />
              <FieldError>{errors.senha}</FieldError>
            </div>
            {errors.form && (
              <p
                role="alert"
                className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {errors.form}{" "}
                <Link to="/cadastro" className="font-semibold underline">
                  Criar conta
                </Link>
              </p>
            )}
            <Button type="submit" className="h-10 w-full rounded-full">
              Entrar
            </Button>
          </form>

          <div className="mt-4 rounded-2xl border border-dashed border-border p-3 lg:mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contas de demonstração
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Contas de demonstração da API (senha: demo1234).
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {demoAccounts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setSenha("demo1234");
                    setErrors({});
                  }}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  {a.role === "moderador" ? "Moderação" : a.name}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link to="/cadastro" className="font-semibold text-primary hover:underline">
              Criar conta
            </Link>
          </p>
          <Link
            to="/"
            className="mt-1 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            Voltar para a home
          </Link>
        </div>
      </div>

      <div className="relative hidden min-h-0 lg:block">
        <img
          src={heroImage}
          alt="Ingredientes e utensílios organizados sobre uma mesa"
          width={1408}
          height={1008}
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-auto sm:right-8 sm:max-w-sm">
          <div className="relative overflow-hidden rounded-2xl border border-white/25 bg-transparent p-4 shadow-lifted ring-1 ring-white/10 backdrop-blur-md sm:p-5">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-sand/20 blur-2xl" />
            <div className="relative flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sand">
                <Quote width={15} height={15} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Feito para dar certo
                </p>
                <p className="mt-1 font-display text-sm leading-relaxed text-white sm:text-base">
                  “Em meio a milhares de receitas, mostramos quais realmente funcionam.”
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
