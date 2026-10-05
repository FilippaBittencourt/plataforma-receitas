import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { currentUser } from "@/lib/mock-data";

const nav = [
  { to: "/buscar", label: "Explorar" },
  { to: "/ranking", label: "Ranking" },
  { to: "/publicar", label: "Publicar" },
  { to: "/compartilhar", label: "Indicar link" },
] as const;

export function Header() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
        <Logo />

        <form
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
          <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
            <Link to="/publicar">
              <Plus width={16} height={16} /> Nova receita
            </Link>
          </Button>
          <Link to="/perfil" className="hidden sm:block">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full lg:hidden">
                <Menu width={18} height={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background p-6">
              <div className="mt-6 flex flex-col gap-1">
                {[...nav, { to: "/perfil", label: "Meu perfil" }, { to: "/admin", label: "Moderação" }].map(
                  (item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      {item.label}
                    </Link>
                  ),
                )}
                <Link
                  to="/entrar"
                  className="mt-4 rounded-xl bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
                >
                  Entrar
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
