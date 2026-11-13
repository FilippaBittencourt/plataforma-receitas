import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "@/lib/feedback";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError, PasswordInput } from "@/components/site/PasswordInput";
import { useAuth } from "@/lib/use-auth";
import recipeImage from "@/assets/recipe-1.jpg";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — Mums!" },
      {
        name: "description",
        content: "Crie sua conta gratuita e comece a avaliar receitas por critérios objetivos.",
      },
      { property: "og:title", content: "Criar conta — Mums!" },
      {
        property: "og:description",
        content: "Junte-se à comunidade que testa receitas de verdade.",
      },
    ],
  }),
  component: CadastroPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<"nome" | "email" | "senha" | "termos" | "form", string>>;

function CadastroPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [termos, setTermos] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (nome.trim().length < 2) next.nome = "Informe seu nome.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Informe um e-mail válido.";
    if (senha.length < 8) next.senha = "A senha precisa ter pelo menos 8 caracteres.";
    if (!termos) next.termos = "É preciso aceitar os termos para criar a conta.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const result = await signup({ name: nome, email, password: senha });
    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    toast.success("Conta criada!", { description: "Complete seu perfil nas configurações." });
    navigate({ to: "/perfil", replace: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16">
        <Logo />
        <div className="mt-10 max-w-sm">
          <h1 className="text-3xl font-semibold text-foreground">Criar conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Leva menos de um minuto e é gratuito.
          </p>

          <form className="mt-8 space-y-4" noValidate onSubmit={submit}>
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                autoComplete="name"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                aria-invalid={Boolean(errors.nome)}
                placeholder="Seu nome"
                className="mt-2 h-11 rounded-xl bg-card"
              />
              <FieldError>{errors.nome}</FieldError>
            </div>
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
                className="mt-2 h-11 rounded-xl bg-card"
              />
              <FieldError>{errors.email}</FieldError>
            </div>
            <div>
              <Label htmlFor="senha">Senha</Label>
              <PasswordInput
                id="senha"
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                aria-invalid={Boolean(errors.senha)}
                placeholder="Mínimo de 8 caracteres"
                className="mt-2 h-11 rounded-xl bg-card"
              />
              <FieldError>{errors.senha}</FieldError>
            </div>
            <div>
              <div className="flex items-start gap-2.5 pt-1">
                <Checkbox
                  id="termos"
                  className="mt-0.5"
                  checked={termos}
                  onCheckedChange={(v) => setTermos(v === true)}
                  aria-invalid={Boolean(errors.termos)}
                />
                <Label
                  htmlFor="termos"
                  className="text-xs font-normal leading-relaxed text-muted-foreground"
                >
                  Concordo com os termos de uso e com a política de avaliações honestas da
                  comunidade.
                </Label>
              </div>
              <FieldError>{errors.termos}</FieldError>
            </div>
            {errors.form && (
              <p
                role="alert"
                className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {errors.form}{" "}
                <Link to="/entrar" className="font-semibold underline">
                  Entrar
                </Link>
              </p>
            )}
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
