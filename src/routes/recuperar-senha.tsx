import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "@/lib/feedback";
import { Logo } from "@/components/site/Logo";
import { FieldError, PasswordInput } from "@/components/site/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Mums!" },
      { name: "description", content: "Use seu código de recuperação para redefinir a senha." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RecuperarSenhaPage,
});

function RecuperarSenhaPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [novoCodigo, setNovoCodigo] = useState("");

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError("Informe um e-mail válido.");
    if (codigo.replace(/[^a-z0-9]/gi, "").length !== 20)
      return setError("Informe o código completo de 20 caracteres.");
    if (password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (password !== confirm) return setError("As senhas não conferem.");
    setBusy(true);
    setError("");
    try {
      const result = await api<{ codigoRecuperacao: string }>("/api/auth/redefinir-senha", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          codigoRecuperacao: codigo,
          novaSenha: password,
        }),
      });
      setNovoCodigo(result.codigoRecuperacao);
    } catch (err) {
      setError(err instanceof Error ? err.message : "E-mail ou código de recuperação inválido.");
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(novoCodigo);
      toast.success("Novo código copiado");
    } catch {
      toast.error("Selecione e copie o código manualmente.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Logo />
        {novoCodigo ? (
          <div className="mt-10">
            <KeyRound width={28} height={28} className="text-verified" />
            <h1 className="mt-4 text-3xl font-semibold text-foreground">Senha redefinida</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              O código usado foi invalidado. Guarde este novo código: ele será necessário na próxima
              recuperação e não será mostrado novamente.
            </p>
            <code className="mt-5 block select-all break-all rounded-xl border border-border bg-muted p-4 text-center font-mono text-lg font-bold tracking-wider">
              {novoCodigo}
            </code>
            <Button
              type="button"
              variant="outline"
              onClick={() => void copyCode()}
              className="mt-3 w-full rounded-full"
            >
              Copiar novo código
            </Button>
            <Button
              type="button"
              onClick={() => navigate({ to: "/entrar", replace: true })}
              className="mt-3 h-11 w-full rounded-full"
            >
              Já guardei, ir para o login
            </Button>
          </div>
        ) : (
          <div className="mt-10">
            <h1 className="text-3xl font-semibold text-foreground">Esqueceu a senha?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Informe o e-mail da conta, o código que você guardou e escolha uma nova senha. O
              código é de uso único.
            </p>
            <form className="mt-8 space-y-4" noValidate onSubmit={resetPassword}>
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
              </div>
              <div>
                <Label htmlFor="codigo-recuperacao">Código de recuperação</Label>
                <Input
                  id="codigo-recuperacao"
                  autoComplete="off"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  aria-invalid={Boolean(error)}
                  placeholder="ABCD-EFGH-JKLM-NPQR-STUV"
                  className="mt-2 h-11 rounded-xl bg-card font-mono tracking-wider"
                />
              </div>
              <div>
                <Label htmlFor="nova-senha">Nova senha</Label>
                <PasswordInput
                  id="nova-senha"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(error)}
                  className="mt-2 h-11 rounded-xl bg-card"
                />
              </div>
              <div>
                <Label htmlFor="confirmar-senha">Confirme a nova senha</Label>
                <PasswordInput
                  id="confirmar-senha"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={Boolean(error)}
                  className="mt-2 h-11 rounded-xl bg-card"
                />
              </div>
              <FieldError>{error}</FieldError>
              <Button type="submit" disabled={busy} className="h-11 w-full rounded-full">
                {busy ? "Trocando senha…" : "Redefinir senha"}
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
