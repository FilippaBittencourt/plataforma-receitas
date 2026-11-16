import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { toast } from "@/lib/feedback";

export function useSignOut() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return async () => {
    await navigate({ to: "/" });
    logout();
    toast.success("Você saiu da sua conta");
  };
}
