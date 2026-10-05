import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Em meio a milhares de receitas, mostramos quais realmente funcionam.
          </p>
        </div>
        <div className="flex gap-12 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Explorar</p>
            <Link to="/buscar" search={{ q: "" }} className="block text-muted-foreground hover:text-foreground">
              Buscar
            </Link>
            <Link to="/ranking" className="block text-muted-foreground hover:text-foreground">
              Ranking
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Comunidade</p>
            <Link to="/publicar" className="block text-muted-foreground hover:text-foreground">
              Publicar receita
            </Link>
            <Link to="/compartilhar" className="block text-muted-foreground hover:text-foreground">
              Indicar link
            </Link>
            <Link to="/admin" className="block text-muted-foreground hover:text-foreground">
              Moderação
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
