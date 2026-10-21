import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { FieldError } from "@/components/site/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Cookie" },
      { name: "description", content: "Receba um link para redefinir a senha da sua conta." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RecuperarSenhaPage,
});

function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Logo />

        {sentTo ? (
          <div className="mt-10">
            <MailCheck width={28} height={28} className="text-verified" />
            <h1 className="mt-4 text-3xl font-semibold text-foreground">Confira seu e-mail</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Se existir uma conta com{" "}
              <span className="font-semibold text-foreground">{sentTo}</span>, você vai receber um
              link para criar uma nova senha. O link vale por 30 minutos.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Protótipo: nenhum e-mail é enviado de verdade.
            </p>
            <Button asChild className="mt-8 h-11 w-full rounded-full">
              <Link to="/entrar">Voltar para o login</Link>
            </Button>
            <button
              type="button"
              onClick={() => setSentTo(undefined)}
              className="mt-3 w-full text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Usar outro e-mail
            </button>
          </div>
        ) : (
          <div className="mt-10">
            <h1 className="text-3xl font-semibold text-foreground">Esqueceu a senha?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Informe o e-mail da sua conta e enviaremos um link para redefinir a senha.
            </p>
            <form
              className="mt-8 space-y-4"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (!EMAIL_RE.test(email.trim())) {
                  setError("Informe um e-mail válido.");
                  return;
                }
                setError(undefined);
                setSentTo(email.trim());
              }}
            >
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(error)}
                  placeholder="voce@email.com"
                  className="mt-2 h-11 rounded-xl bg-card"
                />
                <FieldError>{error}</FieldError>
              </div>
              <Button type="submit" className="h-11 w-full rounded-full">
                Enviar link
              </Button>
            </form>
            <Link
              to="/entrar"
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft width={14} height={14} /> Voltar para o login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
