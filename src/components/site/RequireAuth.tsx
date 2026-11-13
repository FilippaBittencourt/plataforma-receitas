import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/use-auth";
import type { Role } from "@/lib/mock-data";

export function RequireAuth({ children, role }: { children: ReactNode; role?: Role }) {
  const { ready, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (user) {
      redirected.current = false;
      return;
    }
    // Durante a transição o componente ainda está montado e location.href já aponta para
    // /entrar; sem essa trava o efeito redireciona de novo e aninha o ?redirect= sem fim.
    if (redirected.current) return;
    redirected.current = true;
    navigate({ to: "/entrar", search: { redirect: location.href }, replace: true });
  }, [ready, user, location.href, navigate]);

  if (!ready || !user) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-5 py-12">
        <Skeleton className="h-9 w-64 rounded-full" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    );
  }

  if (role && user.role !== role) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <Lock width={22} height={22} className="mx-auto text-caramel" />
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é exclusiva da equipe de moderação. Se você faz parte dela, troque para a conta
          de moderador.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/">Voltar para a home</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
