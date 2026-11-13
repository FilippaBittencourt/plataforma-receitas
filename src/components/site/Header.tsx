import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { UserAvatar, UserMenu } from "./UserMenu";
import { useSignOut } from "./useSignOut";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/use-auth";

const nav = [
  { to: "/buscar", label: "Explorar" },
  { to: "/ranking", label: "Ranking" },
  { to: "/publicar", label: "Publicar" },
  { to: "/compartilhar", label: "Indicar link" },
] as const;

export function Header() {
  const navigate = useNavigate();
  const { ready, user } = useAuth();
  const signOut = useSignOut();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const accountLinks = user
    ? [
        { to: "/perfil", label: "Meu perfil" },
        { to: "/configuracoes", label: "Configurações" },
        ...(user.role === "moderador" ? [{ to: "/admin", label: "Moderação" } as const] : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
        <Logo />

        <form
          role="search"
          className="relative ml-2 hidden max-w-sm flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/buscar", search: { q } });
          }}
        >
          <Search
            width={16}
            height={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar receitas testadas..."
            aria-label="Buscar receitas"
            className="h-10 w-full rounded-full border border-border bg-secondary/60 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {!ready ? (
            <Skeleton className="hidden h-9 w-9 rounded-full sm:block" />
          ) : user ? (
            <>
              <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
                <Link to="/publicar">
                  <Plus width={16} height={16} /> Nova receita
                </Link>
              </Button>
              <div className="hidden sm:block">
                <UserMenu user={user} />
              </div>
            </>
          ) : (
            <>
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="hidden rounded-full sm:inline-flex"
              >
                <Link to="/entrar">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
                <Link to="/cadastro">Criar conta</Link>
              </Button>
            </>
          )}

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu width={18} height={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto bg-background p-6">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Navegação e conta</SheetDescription>

              {user && (
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-cream p-3">
                  <UserAvatar user={user} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}

              <form
                role="search"
                className="relative mt-6 md:hidden"
                onSubmit={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  navigate({ to: "/buscar", search: { q } });
                }}
              >
                <Search
                  width={16}
                  height={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar receitas..."
                  aria-label="Buscar receitas"
                  className="h-10 w-full rounded-full border border-border bg-secondary/60 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:bg-card"
                />
              </form>

              <div className="mt-6 flex flex-col gap-1">
                {[...nav, ...accountLinks].map((item) => (
                  <SheetClose asChild key={item.to}>
                    <Link
                      to={item.to}
                      className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                      activeProps={{ className: "bg-secondary" }}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}

                {user ? (
                  <>
                    <SheetClose asChild>
                      <Link
                        to="/entrar"
                        search={{ adicionar: true }}
                        className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                      >
                        Trocar de conta
                      </Link>
                    </SheetClose>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
                    >
                      <LogOut width={16} height={16} /> Sair
                    </button>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link
                        to="/entrar"
                        className="mt-4 rounded-xl bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
                      >
                        Entrar
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/cadastro"
                        className="rounded-xl border border-border px-3 py-2.5 text-center text-sm font-semibold text-foreground hover:bg-secondary"
                      >
                        Criar conta
                      </Link>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
