import { Link, useNavigate } from "@tanstack/react-router";
import { Check, LogOut, Plus, Settings, ShieldCheck, User, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { initialsOf, type Account } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

export function UserAvatar({ user, className }: { user: Account; className?: string }) {
  return (
    <Avatar className={cn("h-9 w-9 border border-border", className)}>
      {user.fotoPerfil && <AvatarImage src={apiUrl(user.fotoPerfil)} alt={user.name} />}
      <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
        {initialsOf(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function useSignOut() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  // Sai da página antes de limpar a sessão; senão uma página protegida manda para o login.
  return async () => {
    await navigate({ to: "/" });
    logout();
  };
}

export function UserMenu({ user }: { user: Account }) {
  const { signedInAccounts, switchAccount } = useAuth();
  const navigate = useNavigate();
  const signOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Abrir menu da conta"
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <UserAvatar user={user} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 rounded-2xl p-1.5">
        <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
          <UserAvatar user={user} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
          <Link to="/perfil">
            <User width={16} height={16} /> Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
          <Link to="/publicar" search={{ editar: undefined }}>
            <Plus width={16} height={16} /> Publicar receita
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
          <Link to="/configuracoes">
            <Settings width={16} height={16} /> Configurações
          </Link>
        </DropdownMenuItem>
        {user.role === "moderador" && (
          <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
            <Link to="/admin">
              <ShieldCheck width={16} height={16} /> Moderação
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2 rounded-xl">
            <Users width={16} height={16} /> Trocar de conta
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-60 rounded-2xl p-1.5">
            {signedInAccounts.map((account) => (
              <DropdownMenuItem
                key={account.id}
                className="cursor-pointer rounded-xl"
                onSelect={() => {
                  if (account.id === user.id) return;
                  switchAccount(account.id);
                }}
              >
                <UserAvatar user={account} className="h-7 w-7" />
                <span className="min-w-0 flex-1 truncate">{account.name}</span>
                {account.id === user.id && (
                  <Check width={14} height={14} className="text-verified" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer rounded-xl"
              onSelect={() => navigate({ to: "/entrar", search: { adicionar: true } })}
            >
              <UserPlus width={16} height={16} /> Adicionar outra conta
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem
          className="cursor-pointer rounded-xl text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={signOut}
        >
          <LogOut width={16} height={16} /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
