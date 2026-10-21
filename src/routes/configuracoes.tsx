import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { FieldError, PasswordInput } from "@/components/site/PasswordInput";
import { RequireAuth } from "@/components/site/RequireAuth";
import { Shell } from "@/components/site/Shell";
import { UserAvatar } from "@/components/site/UserMenu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import type { Account } from "@/lib/mock-data";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Cookie" },
      { name: "description", content: "Edite seu perfil, e-mail, senha e notificações." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfiguracoesPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE_RE = /^@[a-z0-9_.]{3,30}$/;

function ConfiguracoesPage() {
  return (
    <Shell>
      <RequireAuth>
        <Settings />
      </RequireAuth>
    </Shell>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Settings() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold text-foreground">Configurações</h1>
      <p className="mt-2 text-sm text-muted-foreground">Gerencie sua conta e suas preferências.</p>

      {/* key: ao trocar de conta, os formulários recomeçam com os dados da nova conta */}
      <div key={user.id} className="mt-8 space-y-6">
        <ProfileForm user={user} />
        <EmailForm user={user} />
        <PasswordForm />
        <NotificationsForm user={user} />
        <DangerZone user={user} />
      </div>
    </div>
  );
}

function ProfileForm({ user }: { user: Account }) {
  const { updateUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [bio, setBio] = useState(user.bio);
  const [errors, setErrors] = useState<{ name?: string; handle?: string }>({});

  const dirty = name !== user.name || handle !== user.handle || bio !== user.bio;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const normalizedHandle = `@${handle.trim().replace(/^@+/, "").toLowerCase()}`;
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Informe seu nome.";
    if (!HANDLE_RE.test(normalizedHandle))
      next.handle = "Use de 3 a 30 letras minúsculas, números, ponto ou sublinhado.";
    setErrors(next);
    if (next.name || next.handle) return;

    updateUser({ name: name.trim(), handle: normalizedHandle, bio: bio.trim() });
    setHandle(normalizedHandle);
    toast.success("Perfil atualizado");
  };

  return (
    <Section title="Perfil" description="Como você aparece para a comunidade.">
      <form className="space-y-4" noValidate onSubmit={submit}>
        <div className="flex items-center gap-4">
          <UserAvatar user={{ ...user, name: name || user.name }} className="h-14 w-14 text-base" />
          <p className="text-xs text-muted-foreground">
            O avatar usa as iniciais do seu nome. Fotos de perfil chegam numa próxima versão.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              className="mt-2 rounded-xl bg-background"
            />
            <FieldError>{errors.name}</FieldError>
          </div>
          <div>
            <Label htmlFor="usuario">Nome de usuário</Label>
            <Input
              id="usuario"
              autoComplete="username"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              aria-invalid={Boolean(errors.handle)}
              className="mt-2 rounded-xl bg-background"
            />
            <FieldError>{errors.handle}</FieldError>
          </div>
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={3}
            maxLength={160}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ex.: Testo receitas nos fins de semana e confio em medidas em gramas."
            className="mt-2 rounded-xl bg-background"
          />
          <p className="mt-1.5 text-right text-xs text-muted-foreground">{bio.length}/160</p>
        </div>
        <div className="flex justify-end">
          <Button type="submit" className="rounded-full" disabled={!dirty}>
            Salvar perfil
          </Button>
        </div>
      </form>
    </Section>
  );
}

function EmailForm({ user }: { user: Account }) {
  const { updateUser, emailInUse } = useAuth();
  const [email, setEmail] = useState(user.email);
  const [error, setError] = useState<string>();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) return setError("Informe um e-mail válido.");
    if (emailInUse(normalized)) return setError("Já existe outra conta com este e-mail.");
    setError(undefined);
    updateUser({ email: normalized });
    setEmail(normalized);
    toast.success("E-mail atualizado", { description: "Use o novo e-mail no próximo login." });
  };

  return (
    <Section title="E-mail" description="Usado para entrar e para receber avisos.">
      <form className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate onSubmit={submit}>
        <div className="flex-1">
          <Label htmlFor="email" className="sr-only">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(error)}
            className="rounded-xl bg-background"
          />
          <FieldError>{error}</FieldError>
        </div>
        <Button
          type="submit"
          variant="outline"
          className="rounded-full"
          disabled={email.trim().toLowerCase() === user.email}
        >
          Alterar e-mail
        </Button>
      </form>
    </Section>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (!current) found.current = "Informe sua senha atual.";
    if (next.length < 8) found.next = "A nova senha precisa ter pelo menos 8 caracteres.";
    else if (next === current) found.next = "A nova senha precisa ser diferente da atual.";
    if (confirm !== next) found.confirm = "As senhas não conferem.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Senha alterada", { description: "Protótipo: a senha não é armazenada." });
  };

  return (
    <Section title="Senha" description="Use pelo menos 8 caracteres.">
      <form className="space-y-4" noValidate onSubmit={submit}>
        <div>
          <Label htmlFor="senha-atual">Senha atual</Label>
          <PasswordInput
            id="senha-atual"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            aria-invalid={Boolean(errors.current)}
            className="mt-2 rounded-xl bg-background"
          />
          <FieldError>{errors.current}</FieldError>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="senha-nova">Nova senha</Label>
            <PasswordInput
              id="senha-nova"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              aria-invalid={Boolean(errors.next)}
              className="mt-2 rounded-xl bg-background"
            />
            <FieldError>{errors.next}</FieldError>
          </div>
          <div>
            <Label htmlFor="senha-confirmar">Confirmar nova senha</Label>
            <PasswordInput
              id="senha-confirmar"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={Boolean(errors.confirm)}
              className="mt-2 rounded-xl bg-background"
            />
            <FieldError>{errors.confirm}</FieldError>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="outline" className="rounded-full">
            Alterar senha
          </Button>
        </div>
      </form>
    </Section>
  );
}

const notificationOptions: { key: keyof Account["notifications"]; label: string; hint: string }[] =
  [
    {
      key: "avaliacoes",
      label: "Avaliações nas minhas receitas",
      hint: "Quando alguém testar e avaliar uma receita sua.",
    },
    {
      key: "comentarios",
      label: "Respostas e comentários",
      hint: "Quando responderem um comentário seu.",
    },
    {
      key: "novidades",
      label: "Novidades e receitas verificadas",
      hint: "Um resumo semanal com o que ganhou o selo.",
    },
  ];

function NotificationsForm({ user }: { user: Account }) {
  const { updateUser } = useAuth();

  return (
    <Section title="Notificações por e-mail" description="Escolha o que você quer receber.">
      <ul className="divide-y divide-border">
        {notificationOptions.map((opt) => (
          <li
            key={opt.key}
            className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
          >
            <div>
              <Label htmlFor={`notif-${opt.key}`} className="text-sm font-medium text-foreground">
                {opt.label}
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">{opt.hint}</p>
            </div>
            <Switch
              id={`notif-${opt.key}`}
              checked={user.notifications[opt.key]}
              onCheckedChange={(checked) => {
                updateUser({ notifications: { ...user.notifications, [opt.key]: checked } });
                toast.success("Preferência salva");
              }}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function DangerZone({ user }: { user: Account }) {
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");

  return (
    <section className="rounded-3xl border border-destructive/30 bg-card p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-foreground">Excluir conta</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Remove seu perfil e suas preferências. Receitas publicadas continuam no site sem o seu nome.
      </p>
      <AlertDialog onOpenChange={(open) => !open && setConfirmText("")}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="mt-5 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Excluir minha conta
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir a conta de {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Digite <strong>EXCLUIR</strong> para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            aria-label="Digite EXCLUIR para confirmar"
            className="rounded-xl"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText.trim().toUpperCase() !== "EXCLUIR"}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                // Sai da página protegida antes de apagar a sessão, para não cair no login.
                await navigate({ to: "/", replace: true });
                deleteAccount();
                toast.success("Sua conta foi excluída");
              }}
            >
              Excluir conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
