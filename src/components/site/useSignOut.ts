import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";

export function useSignOut() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  // Sai da página antes de limpar a sessão; senão uma página protegida manda para o login.
  return async () => {
    await navigate({ to: "/" });
    logout();
  };
}
